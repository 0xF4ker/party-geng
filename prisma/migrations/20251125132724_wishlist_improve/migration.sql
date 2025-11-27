/*
  Warnings:

  - You are about to drop the `WishlistPromise` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('PROMISE', 'CASH');

-- DropForeignKey
ALTER TABLE "WishlistPromise" DROP CONSTRAINT "WishlistPromise_guestUserId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistPromise" DROP CONSTRAINT "WishlistPromise_wishlistItemId_fkey";

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "cashContribution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "storeUrl" TEXT;

-- DropTable
DROP TABLE "WishlistPromise";

-- CreateTable
CREATE TABLE "WishlistContribution" (
    "id" TEXT NOT NULL,
    "wishlistItemId" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "guestUserId" TEXT,
    "guestName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistContribution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WishlistContribution" ADD CONSTRAINT "WishlistContribution_wishlistItemId_fkey" FOREIGN KEY ("wishlistItemId") REFERENCES "WishlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistContribution" ADD CONSTRAINT "WishlistContribution_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
