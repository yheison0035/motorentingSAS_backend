/*
  Warnings:

  - You are about to drop the column `state` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "state",
ADD COLUMN     "stateId" INTEGER;

-- CreateTable
CREATE TABLE "public"."State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "public"."State"("name");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."State"("id") ON DELETE SET NULL ON UPDATE CASCADE;
