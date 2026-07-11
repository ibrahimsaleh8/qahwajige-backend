-- CreateTable
CREATE TABLE "social_media_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_sections" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_section_cards" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_section_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_media_links_projectId_key" ON "social_media_links"("projectId");

-- CreateIndex
CREATE INDEX "social_media_links_projectId_idx" ON "social_media_links"("projectId");

-- CreateIndex
CREATE INDEX "custom_sections_projectId_idx" ON "custom_sections"("projectId");

-- CreateIndex
CREATE INDEX "custom_section_cards_sectionId_idx" ON "custom_section_cards"("sectionId");

-- AddForeignKey
ALTER TABLE "social_media_links" ADD CONSTRAINT "social_media_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_sections" ADD CONSTRAINT "custom_sections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_section_cards" ADD CONSTRAINT "custom_section_cards_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "custom_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
