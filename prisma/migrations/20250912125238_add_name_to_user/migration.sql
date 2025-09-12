/*
  Warnings:

  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'SIN NOMBRE';

