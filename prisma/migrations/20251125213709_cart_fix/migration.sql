/*
  Warnings:

  - You are about to drop the column `itemId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `CartItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartId,quoteId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cartId,wishlistItemId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_idx";

-- DropIndex
DROP INDEX "CartItem_cartId_itemId_type_key";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "itemId",
DROP COLUMN "type",
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "wishlistItemId" TEXT;

-- DropEnum
DROP TYPE "CartItemType";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_quoteId_key" ON "CartItem"("cartId", "quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_wishlistItemId_key" ON "CartItem"("cartId", "wishlistItemId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_wishlistItemId_fkey" FOREIGN KEY ("wishlistItemId") REFERENCES "WishlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
