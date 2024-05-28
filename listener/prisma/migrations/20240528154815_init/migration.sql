-- CreateTable
CREATE TABLE "Deposit" (
    "id" SERIAL NOT NULL,
    "vaultAddress" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" SERIAL NOT NULL,
    "vaultAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "sharesAmount" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);
