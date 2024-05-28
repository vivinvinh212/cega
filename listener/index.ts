import { ethers } from "ethers";
import abi from "./abi.json" with { type: "json" };
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DepositEventParams {
    vaultAddress: string;
    receiver: string;
    amount: string; 
    timestamp: Date;
}

interface WithdrawalEventParams {
    vaultAddress: string;
    owner: string;
    sharesAmount: string;
    timestamp: Date;
}

/**
 * Sets up the event listeners for Ethereum smart contract events.
 * Initializes WebSocket connection and listens for deposit and withdrawal events.
 */
const setupEventListeners = async () => {
    const provider = new ethers.WebSocketProvider("wss://eth-mainnet.g.alchemy.com/v2/WZHNbu3isZL_-l5l7WPRP7d9OnrZku2h");
    const contractAddress = '0x7a67D5Eb2D6684d3e899575aAAA5AB31b79890c2';
    const contract = new ethers.Contract(contractAddress, abi.abi, provider);

    contract.on('DepositProcessed', handleDepositEvent);
    contract.on('WithdrawalProcessed', handleWithdrawalEvent);

    console.log('Event listeners set up successfully.');
};

/**
 * Handles the 'DepositProcessed' event from the Ethereum smart contract.
 * @param {string} vaultAddress - Address of the vault.
 * @param {string} receiver - Address of the receiver.
 * @param {ethers.BigNumberish} amount - Amount of the deposit in wei.
 * @param {ethers.Log} event - Event object containing metadata.
 */
const handleDepositEvent = (vaultAddress: string, receiver: string, amount: ethers.BigNumberish, event: ethers.Log) => {
    console.log(`DepositProcessed Event: vaultAddress=${vaultAddress}, receiver=${receiver}, amount=${ethers.formatUnits(amount, 18)}`);
    saveDeposit({
        vaultAddress,
        receiver,
        amount: ethers.formatUnits(amount, 18),
        timestamp: new Date(event.blockNumber * 1000) 
    });
};

/**
 * Handles the 'WithdrawalProcessed' event from the Ethereum smart contract.
 * @param {string} vaultAddress - Address of the vault.
 * @param {string} owner - Address of the owner.
 * @param {ethers.BigNumberish} sharesAmount - Amount of shares withdrawn in wei.
 * @param {ethers.Log} event - Event object containing metadata.
 */
const handleWithdrawalEvent = (vaultAddress: string, owner: string, sharesAmount: ethers.BigNumberish, event: ethers.Log) => {
    console.log(`WithdrawalProcessed Event: vaultAddress=${vaultAddress}, owner=${owner}, sharesAmount=${ethers.formatUnits(sharesAmount, 18)}`);
    saveWithdrawal({
        vaultAddress,
        owner,
        sharesAmount: ethers.formatUnits(sharesAmount, 18),
        timestamp: new Date(event.blockNumber * 1000) 
    });
};

/**
 * Saves deposit event data to the database.
 * @param {DepositEventParams} data - Data extracted from the deposit event.
 */
const saveDeposit = async (data: DepositEventParams) => {
  try {
      const deposit = await prisma.deposit.create({
          data: {
              vaultAddress: data.vaultAddress,
              receiver: data.receiver,
              amount: data.amount,
              timestamp: data.timestamp,
          }
      });
      console.log('Deposit saved to the database:', deposit);
  } catch (error) {
      console.error('Failed to save deposit:', error);
  }
};

/**
 * Saves withdrawal event data to the database.
 * @param {WithdrawalEventParams} data - Data extracted from the withdrawal event.
 */
const saveWithdrawal = async (data: WithdrawalEventParams) => {
  try {
      const withdrawal = await prisma.withdrawal.create({
          data: {
              vaultAddress: data.vaultAddress,
              owner: data.owner,
              sharesAmount: data.sharesAmount,
              timestamp: data.timestamp,
          }
      });
      console.log('Withdrawal saved to the database:', withdrawal);
  } catch (error) {
      console.error('Failed to save withdrawal:', error);
  }
};

setupEventListeners().catch(console.error);