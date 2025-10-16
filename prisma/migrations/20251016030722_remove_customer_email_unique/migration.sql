-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- AlterTable
ALTER TABLE "public"."Customer" ALTER COLUMN "email" DROP NOT NULL;
