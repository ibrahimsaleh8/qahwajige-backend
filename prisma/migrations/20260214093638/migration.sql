/*
  Warnings:

  - Added the required column `projectId` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratingId` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "ratingId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "packages_projectId_idx" ON "packages"("projectId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "ratings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
