import Redis from "ioredis";
import { ethers } from "ethers";
import logger from "./utils/logger";
import { chunks } from "./utils/helpers";
import constants from "./utils/constants";
import { PrismaClient } from "@prisma/client";
import type { Result } from "ethers/lib/utils";
import axios, { type AxiosInstance } from "axios";
import type { RPCMethod, Transaction } from "./utils/types";

export default class Keeper {
  // Database
  private db: PrismaClient;
  // Redis cache
  private redis: Redis;
  // RPC client
  private rpc: AxiosInstance;
  // Locally consistent latest synced block
  private latestSyncedBlock: number | undefined;

  /**
   * Create new Keeper
   * @param {string} rpc_url Base RPC
   * @param {string} redis_url Cache URL
   */
  constructor(rpc_url: string, redis_url: string) {
    this.db = new PrismaClient();
    this.redis = new Redis(redis_url);
    this.rpc = axios.create({
      baseURL: rpc_url,
    });
  }

  /**
   * Get chain head number
   * @returns {Promise<number>} block number
   */
  async getChainBlock(): Promise<number> {
    try {
      // Send request
      const { data } = await this.rpc.post("/", {
        id: 0,
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
      });

      // Parse hex to number
      return Number(data.result);
    } catch {
      logger.error("Failed to collect chain head number");
      throw new Error("Could not collect chain head number");
    }
  }

  /**
   * Get latest synced block from cache
   * @returns {Promise<number>} block number
   */
  async getSyncedBlock(): Promise<number> {
    // If latest synced block exists locally, return
    if (this.latestSyncedBlock) return this.latestSyncedBlock;
    // Else, get value from cache
    const value: string | null = await this.redis.get("synced_block");

    // If value exists
    return value
      ? // Return numeric
        Number(value)
      : // Else return 1 block before contract deploy
        constants.CONTRACT_DEPLOY_BLOCK - 1;
  }

  /**
   * Chunks batch data request processing to avoid 1K request limit
   * @param {RPCMethod[]} batch to execute
   */
  async chunkTxCall(batch: RPCMethod[]) {
    let txData: {
      result: {
        transactionHash: string;
        status: "0x0" | "0x1";
      };
    }[] = [];

    // Execute batch data request in chunks of 950
    for (const chunk of [...chunks(batch, 950)]) {
      // Execute request for batch tx data
      const {
        data,
      }: {
        data: {
          result: {
            transactionHash: string;
            status: "0x0" | "0x1";
          };
        }[];
      } = await this.rpc.post("/", chunk);

      // Concat results
      txData.push(...data);
    }

    // Return tx data
    return txData;
  }

  /**
   * Syncs trades between a certain range of blocks
   * @param {number} startBlock beginning index
   * @param {number} endBlock ending index
   */
  async syncTradeRange(startBlock: number, endBlock: number): Promise<void> {
    // Create block + transaction collection requests
    const numBlocks: number = endBlock - startBlock;
    logger.info(`Collecting ${numBlocks} blocks: ${startBlock} -> ${endBlock}`);

    // Create batch requests array
    const batchBlockRequests: RPCMethod[] = new Array(numBlocks)
      .fill(0)
      .map((_, i: number) => ({
        method: "eth_getBlockByNumber",
        // Hex block number, true => return all transactions
        params: [`0x${(startBlock + i).toString(16)}`, true],
        id: i,
        jsonrpc: "2.0",
      }));

    // Execute request for batch blocks + transactions
    const {
      data: blockData,
    }: {
      data: {
        result: {
          number: string;
          timestamp: string;
          transactions: {
            from: string;
            hash: string;
            to: string;
            input: string;
          }[];
        };
      }[];
    } = await this.rpc.post("/", batchBlockRequests);

    // Setup contract
    const contractAddress: string = constants.CONTRACT_ADDRESS.toLowerCase();
    const contractSignatures: string[] = [
      constants.SIGNATURES.DEPOSIT,
      constants.SIGNATURES.WITHDRAW,
    ];

    // Filter for transaction hashes that are either BUY or SELL to friend.tech contract
    let txHashes: string[] = [];
    for (const block of blockData) {
      for (const tx of block.result.transactions) {
        if (
          // If transaction is to contract
          tx.to === contractAddress &&
          // And, transaction is of format buyShares or sellShares
          contractSignatures.includes(tx.input.slice(0, 10))
        ) {
          // Track tx hash
          txHashes.push(tx.hash);
        }
      }
    }

    // If no relevant tx hashes
    if (txHashes.length === 0) {
      // Update latest synced block
      const ok = await this.redis.set("synced_block", endBlock);
      if (!ok) {
        logger.error("Error storing synced_block in cache");
        throw new Error("Could not synced_block store in Redis");
      }
      logger.info("Skipping because 0 relevant txs found");

      return;
    }

    // Check all relevant transaction hashes for success status
    const txBatchRequests: RPCMethod[] = new Array(txHashes.length)
      .fill(0)
      .map((_, i: number) => ({
        method: "eth_getTransactionReceipt",
        // Hex block number, true => return all transactions
        params: [txHashes[i]],
        id: i,
        jsonrpc: "2.0",
      }));

    // Execute request for batch tx data
    const txData = await this.chunkTxCall(txBatchRequests);

    // Create set of successful transactions
    const successTxHash: Set<string> = new Set();
    for (const tx of txData) {
      // Filter for success
      if (tx.result.status === "0x1") {
        successTxHash.add(tx.result.transactionHash.toLowerCase());
      }
    }

    // Transform only successful transactions
    let txs: Transaction[] = [];

    // We iterate over blockData to preserve ordering
    // This is necessary to appropriately calculate cost locally
    for (const block of blockData) {
      // For each transaction in block
      for (const tx of block.result.transactions) {
        // Filter for only successful transactions
        if (successTxHash.has(tx.hash.toLowerCase())) {
          // Decode tx input
          const result: Result = ethers.utils.defaultAbiCoder.decode(
            ["address", "uint256"],
            ethers.utils.hexDataSlice(tx.input, 4)
          );

          // Collect params and create tx
          const subject = result[0].toLowerCase();
          const amount = result[1].toNumber();
          const isBuy: boolean =
            tx.input.slice(0, 10) === constants.SIGNATURES.DEPOSIT;

          // Push newly tracked transaction
          const transaction = {
            hash: tx.hash,
            timestamp: Number(block.result.timestamp),
            blockNumber: Number(block.result.number),
            from: tx.from.toLowerCase(),
            to: subject,
            amount,
          };
          txs.push(transaction);
        }
      }
    }

    logger.info(`Collected ${txs.length} transactions`);


    // Setup trade updates
    let tradeInsert = this.db.trade.createMany({
      data: txs.map((tx) => ({
        hash: tx.hash,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: tx.amount,
      })),
    });

    // Insert trades as atomic transaction
    await this.db.$transaction([tradeInsert]);
    logger.info(
      `Added ${txs.length} trades`
    );

    // Update latest synced block
    const ok = await this.redis.set("synced_block", endBlock);
    if (!ok) {
      logger.error("Error storing synced_block in cache");
      throw new Error("Could not synced_block store in Redis");
    }
    logger.info(`Set last synced block to ${endBlock}`);
  }

  /**
   * Continuously synchronizes trade data from the blockchain starting from the last synced block.
   */
  async syncTrades() {
    // Latest blocks
    const latestChainBlock: number = await this.getChainBlock();
    const latestSyncedBlock: number = await this.getSyncedBlock();

    // Calculate remaining blocks to sync
    const diffSync: number = latestChainBlock - latestSyncedBlock;
    logger.info(`Remaining blocks to sync: ${diffSync}`);

    // If diff > 0, poll by 100 blocks at a time
    if (diffSync > 0) {
      // Max 100 blocks to collect
      const numToSync: number = Math.min(diffSync, 100);

      // (Start, End) sync blocks
      let startBlock: number = latestSyncedBlock;
      let endBlock: number = latestSyncedBlock + numToSync;

      // Sync between block ranges
      try {
        // Sync start -> end blocks
        await this.syncTradeRange(startBlock, endBlock);
        // Update last synced block
        this.latestSyncedBlock = endBlock;
        // Recursively resync if diffSync > 0
        await this.syncTrades();
      } catch (e) {
        logger.error("Error when syncing between range", e);
      }
    }
  }

  /**
   * Initiates the trade synchronization process and sets a timer to periodically re-sync.
   */
  async sync() {
    // Sync trades
    await this.syncTrades();

    // Recollect in 5s
    logger.info("Sleeping for 5s");
    setTimeout(() => this.sync(), 1000 * 5);
  }
}
