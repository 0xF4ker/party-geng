/*
  Warnings:

  - A unique constraint covering the columns `[invitationToken]` on the table `EventGuest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EventGuest" ADD COLUMN     "invitationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EventGuest_invitationToken_key" ON "EventGuest"("invitationToken");
