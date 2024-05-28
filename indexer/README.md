

# Cega Smart Contract Event Indexer

This module, referred to as the `Keeper`, is designed to index and sync trades for the Cega contract on the Ethereum blockchain, focusing on the `Deposit` and `Withdrawal` transactions.

## Features

- Real-time syncing of blockchain transactions related to specific contract functions.
- Storing transaction data in a PostgreSQL database using Prisma.
- Utilizes Redis for caching and efficient data retrieval.
- Resilient to node disconnections and API rate limits.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.x or newer)
- Yarn or pnpm
- PostgreSQL
- An Ethereum node access URL (Alchemy, Infura, etc.)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vivinvinh212/cega.git
   cd cega
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure your environment variables:
   Create a `.env` file at the root of your project and add the following:
   ```plaintext
   DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
   WEBSOCKET=""
   ```

4. Run the migration to set up the database schema:
   ```bash
   npx prisma migrate dev
   ```

## Usage

Start the synchronization process:
```bash
pnpm run build && pnpm run start
```

## Structure

- `keeper.ts`: Main class file that contains methods for blockchain interaction and data synchronization.
- `utils/logger.ts`: Utility for logging events and errors.
- `utils/constants.ts`: Constants file that includes ABI details and other configuration constants.
- `prisma/`: Directory containing Prisma schema and migrations.
- `abi.json`: ABI file for the smart contract used in the synchronization.

## Code Overview

### Constructor

```typescript
constructor(rpc_url: string, redis_url: string)
```
Initializes the Keeper instance with connections to the PostgreSQL database, Redis cache, and blockchain node.

### Methods

- **getChainBlock()**
  Fetches the current head block number from the blockchain.

- **getSyncedBlock()**
  Retrieves the block number up to which the trades have been synced from the Redis cache.

- **syncTradeRange(startBlock: number, endBlock: number)**
  Synchronizes trades from a specified range of blocks.

- **syncTrades()**
  Continuously checks for new blocks and syncs them if found.

- **sync()**
  Starts the trade synchronization and sets a periodic timer to keep the process alive.

## Database Schema

The database schema for storing trades is straightforward:

```prisma
model Trade {
  hash         String   @id @unique
  timestamp    Int
  blockNumber  Int
  fromAddress  String
  toAddress    String
  amount       Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

This schema allows for detailed tracking of transactions along with timestamps for creation and updates.

