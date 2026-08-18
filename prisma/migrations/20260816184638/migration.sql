-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "description" TEXT,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "status" "ArticleStatus" NOT NULL DEFAULT 'PUBLISHED';
