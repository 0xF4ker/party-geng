-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'HELD');

-- Add a temporary column with the new enum type, allowing nulls
ALTER TABLE "Transaction" ADD COLUMN "new_status" "TransactionStatus";

-- Update the new column with values from the old column, mapping strings to enum
UPDATE "Transaction" SET "new_status" = CASE "status"
    WHEN 'PENDING' THEN 'PENDING'::"TransactionStatus"
    WHEN 'COMPLETED' THEN 'COMPLETED'::"TransactionStatus"
    WHEN 'FAILED' THEN 'FAILED'::"TransactionStatus"
    -- Default to PENDING if old status is unknown or null, adjust as per actual data
    ELSE 'PENDING'::"TransactionStatus" 
END;

-- Drop the old column
ALTER TABLE "Transaction" DROP COLUMN "status";

-- Rename the new column to 'status'
ALTER TABLE "Transaction" RENAME COLUMN "new_status" TO "status";

-- Alter the new 'status' column to be NOT NULL (after ensuring all rows have a value)
ALTER TABLE "Transaction" ALTER COLUMN "status" SET NOT NULL;