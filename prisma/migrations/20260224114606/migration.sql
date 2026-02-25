-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_projectId_idx" ON "articles"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_projectId_key" ON "articles"("projectId");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
