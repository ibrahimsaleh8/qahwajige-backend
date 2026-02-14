/*
  Warnings:

  - You are about to drop the column `ratingId` on the `projects` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `ratings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_ratingId_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "ratingId";

-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ratings_projectId_key" ON "ratings"("projectId");

-- CreateIndex
CREATE INDEX "ratings_projectId_idx" ON "ratings"("projectId");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
