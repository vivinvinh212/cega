import Web3 from 'web3';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
const contractAddress = '0x7a67D5Eb2D6684d3e899575aAAA5AB31b79890c2';
const prisma = new PrismaClient();

async function fetchABI(): Promise<any> {
  const response = await fetch('https://raw.githubusercontent.com/cega-fi/cega-sdk-evm/main/src/abiV2/ICegaCombinedEntry.json');
  const abi = await response.json();
  return abi;
}

async function saveDeposit(event: any): Promise<void> {
  await prisma.deposit.create({
    data: {
      vaultAddress: event.returnValues.vaultAddress,
      receiver: event.returnValues.receiver,
      amount: BigInt(event.returnValues.amount),
      timestamp: new Date(event.returnValues.timestamp * 1000),
    },
  });
}

async function saveWithdrawal(event: any): Promise<void> {
  await prisma.withdrawal.create({
    data: {
      vaultAddress: event.returnValues.vaultAddress,
      owner: event.returnValues.owner,
      sharesAmount: BigInt(event.returnValues.sharesAmount),
      timestamp: new Date(event.returnValues.timestamp * 1000),
    },
  });
}

async function main(): Promise<void> {
  const abi = await fetchABI();
  const contract = new web3.eth.Contract(abi, contractAddress);

  contract.events.DepositProcessed((error, event) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Deposit Event:', event);
      saveDeposit(event)
        .then(() => console.log('Deposit saved to the database'))
        .catch((error) => console.error('Error saving deposit:', error));
    }
  });

  contract.events.WithdrawalProcessed((error, event) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Withdrawal Event:', event);
      saveWithdrawal(event)
        .then(() => console.log('Withdrawal saved to the database'))
        .catch((error) => console.error('Error saving withdrawal:', error));
    }
  });
}

main().catch((error) => console.error('Error:', error));