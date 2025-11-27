/*
  Warnings:

  - You are about to drop the column `quoteId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `wishlistItemId` on the `CartItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartId,itemId,type]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('QUOTE', 'WISHLIST_ITEM');

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_wishlistItemId_fkey";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "quoteId",
DROP COLUMN "wishlistItemId",
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "type" "CartItemType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_itemId_type_key" ON "CartItem"("cartId", "itemId", "type");
