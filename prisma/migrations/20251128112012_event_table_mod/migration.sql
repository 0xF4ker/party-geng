/*
  Warnings:

  - The `status` column on the `EventGuest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `EventGuest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('PENDING', 'ATTENDING', 'MAYBE', 'DECLINED');

-- AlterTable
ALTER TABLE "EventGuest" ADD COLUMN     "tableNumber" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "GuestStatus" NOT NULL DEFAULT 'PENDING';
