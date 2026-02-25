-- DropIndex
DROP INDEX "articles_id_idx";

-- CreateIndex
CREATE INDEX "articles_title_idx" ON "articles"("title");
