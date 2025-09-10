/*
  Warnings:

  - You are about to drop the column `delivered` on the `Customer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DeliveryState" AS ENUM ('ENTREGADO', 'PENDIENTE_ENTREGA');

-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "delivered",
ADD COLUMN     "deliveryState" "public"."DeliveryState";
