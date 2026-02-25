-- DropIndex
DROP INDEX "articles_projectId_idx";

-- DropIndex
DROP INDEX "articles_projectId_key";

-- CreateIndex
CREATE INDEX "articles_id_idx" ON "articles"("id");
