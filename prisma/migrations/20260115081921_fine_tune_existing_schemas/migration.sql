/*
  Warnings:

  - You are about to drop the column `company_name` on the `users` table. All the data in the column will be lost.
  - Added the required column `job_location` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_type` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE');

-- CreateEnum
CREATE TYPE "JobLocation" AS ENUM ('ON_SITE', 'REMOTE', 'HYBRID');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "job_location" "JobLocation" NOT NULL,
ADD COLUMN     "job_type" "JobType" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "company_name";
