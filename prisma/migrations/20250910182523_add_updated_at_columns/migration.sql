/*
  Warnings:

  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `State` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE "Customer" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE "Comment" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE "State" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
