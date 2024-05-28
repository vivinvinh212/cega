# Cega Smart Contract Event Listener

This project provides a setup for listening to Cega Ethereum smart contract events and saving them to a PostgreSQL database using Prisma. It uses the `ethers.js` library to interact with the Ethereum blockchain.

## Features

- Listening for specific smart contract events.
- Saving event data to a PostgreSQL database.
- Efficient and structured error handling.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.x or newer)
- Yarn or npm
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
   npm install
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

Run the listener:
```bash
npm run build && npm run start
```

## Structure

- `index.ts`: Main entry file where the ethers.js setup and event listeners are initialized.
- `prisma/`: Contains the Prisma schema and migrations.
- `abi.json`: ABI file for the smart contract.

