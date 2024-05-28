import { ethers } from "ethers";
import abi from "./abi.json" with { type: "json" };
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const setupEventListeners = async () => {
    const provider = new ethers.WebSocketProvider("wss://eth-mainnet.g.alchemy.com/v2/WZHNbu3isZL_-l5l7WPRP7d9OnrZku2h");
    const contractAddress = '0x7a67D5Eb2D6684d3e899575aAAA5AB31b79890c2';
    const contract = new ethers.Contract(contractAddress, abi.abi, provider);
    contract.on('DepositProcessed', (vaultAddress, receiver, amount, event) => {
        console.log(`DepositProcessed Event: vaultAddress=${vaultAddress}, receiver=${receiver}, amount=${ethers.formatUnits(amount, 18)}`);
        saveDeposit({
            vaultAddress,
            receiver,
            amount: ethers.formatUnits(amount, 18),
            timestamp: new Date(event.blockNumber * 1000)
        });
    });
    contract.on('WithdrawalProcessed', (vaultAddress, owner, sharesAmount, event) => {
        console.log(`WithdrawalProcessed Event: vaultAddress=${vaultAddress}, owner=${owner}, sharesAmount=${ethers.formatUnits(sharesAmount, 18)}`);
        saveWithdrawal({
            vaultAddress,
            owner,
            sharesAmount: ethers.formatUnits(sharesAmount, 18),
            timestamp: new Date(event.blockNumber * 1000)
        });
    });
    console.log('Event listeners set up successfully.');
};
const saveDeposit = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to save deposit:', error);
    }
};
const saveWithdrawal = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to save withdrawal:', error);
    }
};
setupEventListeners().catch(console.error);
//# sourceMappingURL=index.js.map