/*
  Warnings:

  - A unique constraint covering the columns `[clientEventId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClientEvent" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "clientEventId" TEXT,
ADD COLUMN     "groupAdminId" TEXT,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventTodoList" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventTodoList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTodoItem" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "listId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTodoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudget" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "EventBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudgetItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "actualCost" DOUBLE PRECISION,
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGuestList" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventGuestList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGuest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTodoList_eventId_idx" ON "EventTodoList"("eventId");

-- CreateIndex
CREATE INDEX "EventTodoItem_listId_idx" ON "EventTodoItem"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBudget_eventId_key" ON "EventBudget"("eventId");

-- CreateIndex
CREATE INDEX "EventBudgetItem_budgetId_idx" ON "EventBudgetItem"("budgetId");

-- CreateIndex
CREATE INDEX "EventGuestList_eventId_idx" ON "EventGuestList"("eventId");

-- CreateIndex
CREATE INDEX "EventGuest_listId_idx" ON "EventGuest"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_clientEventId_key" ON "Conversation"("clientEventId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientEventId_fkey" FOREIGN KEY ("clientEventId") REFERENCES "ClientEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTodoList" ADD CONSTRAINT "EventTodoList_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClientEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTodoItem" ADD CONSTRAINT "EventTodoItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "EventTodoList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTodoItem" ADD CONSTRAINT "EventTodoItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventBudget" ADD CONSTRAINT "EventBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClientEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetItem" ADD CONSTRAINT "EventBudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "EventBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGuestList" ADD CONSTRAINT "EventGuestList_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClientEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_listId_fkey" FOREIGN KEY ("listId") REFERENCES "EventGuestList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
