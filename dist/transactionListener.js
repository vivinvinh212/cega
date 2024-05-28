"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const client_1 = require("@prisma/client");
const web3 = new web3_1.default(process.env.RPC_URL);
const contractAddress = '0x7a67D5Eb2D6684d3e899575aAAA5AB31b79890c2';
const prisma = new client_1.PrismaClient();
function fetchABI() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)('https://raw.githubusercontent.com/cega-fi/cega-sdk-evm/main/src/abiV2/ICegaCombinedEntry.json');
        const abi = yield response.json();
        return abi;
    });
}
function saveDeposit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.deposit.create({
            data: {
                vaultAddress: event.returnValues.vaultAddress,
                receiver: event.returnValues.receiver,
                amount: BigInt(event.returnValues.amount),
                timestamp: new Date(event.returnValues.timestamp * 1000),
            },
        });
    });
}
function saveWithdrawal(event) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.withdrawal.create({
            data: {
                vaultAddress: event.returnValues.vaultAddress,
                owner: event.returnValues.owner,
                sharesAmount: BigInt(event.returnValues.sharesAmount),
                timestamp: new Date(event.returnValues.timestamp * 1000),
            },
        });
    });
}
function setupEventListeners(contract) {
    return __awaiter(this, void 0, void 0, function* () {
        contract.events.DepositProcessed({
            fromBlock: 'latest'
        })
            .on('data', (event) => __awaiter(this, void 0, void 0, function* () {
            console.log('Deposit Event:', event);
            yield saveDeposit(event);
            console.log('Deposit saved to the database');
        }));
        // .on('error', (error: Error) => {
        //   console.error('Error on DepositProcessed:', error);
        // });
        contract.events.WithdrawalProcessed({
            fromBlock: 'latest'
        })
            .on('data', (event) => __awaiter(this, void 0, void 0, function* () {
            console.log('Withdrawal Event:', event);
            yield saveWithdrawal(event);
            console.log('Withdrawal saved to the database');
        }));
        // .on('error', (error: Error) => {
        //   console.error('Error on WithdrawalProcessed:', error);
        //   // Implement reconnection or other error handling logic
        // });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const abi = yield fetchABI();
            const contract = new web3.eth.Contract(abi, contractAddress);
            yield setupEventListeners(contract);
        }
        catch (error) {
            console.error('Initialization error:', error);
        }
    });
}
main().catch((error) => console.error('Unhandled error in main:', error));
//# sourceMappingURL=transactionListener.js.map