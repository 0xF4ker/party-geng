/*
  Warnings:

  - You are about to drop the column `gigId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `gigId` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the `Gig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GigAddOn` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `services` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Gig" DROP CONSTRAINT "Gig_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Gig" DROP CONSTRAINT "Gig_vendorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GigAddOn" DROP CONSTRAINT "GigAddOn_gigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_gigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Quote" DROP CONSTRAINT "Quote_gigId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "gigId";

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "gigId",
ADD COLUMN     "services" JSONB NOT NULL;

-- DropTable
DROP TABLE "public"."Gig";

-- DropTable
DROP TABLE "public"."GigAddOn";

-- CreateTable
CREATE TABLE "ServicesOnVendors" (
    "vendorProfileId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicesOnVendors_pkey" PRIMARY KEY ("vendorProfileId","serviceId")
);

-- AddForeignKey
ALTER TABLE "ServicesOnVendors" ADD CONSTRAINT "ServicesOnVendors_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicesOnVendors" ADD CONSTRAINT "ServicesOnVendors_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
