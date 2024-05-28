/*
  Warnings:

  - You are about to drop the column `cost` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `isBuy` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `subjectAddress` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `toAddress` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_fromAddress_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_subjectAddress_fkey";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "cost",
DROP COLUMN "isBuy",
DROP COLUMN "subjectAddress";

ALTER TABLE "Trade" ADD COLUMN "toAddress" TEXT NOT NULL DEFAULT '';
-- DropTable
DROP TABLE "User";
