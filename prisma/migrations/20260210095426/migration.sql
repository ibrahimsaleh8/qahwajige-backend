-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "siteTitle" TEXT NOT NULL DEFAULT 'قهوجيين الرياض - ضيافة عربية فاخرة في الرياض',
    "siteDescription" TEXT NOT NULL DEFAULT 'قهوجيين الرياض تقدم خدمات الضيافة والقهوة العربية الفاخرة لجميع المناسبات الخاصة والرسمية في الرياض.',
    "siteKeywords" TEXT[],
    "phone" TEXT NOT NULL DEFAULT '+966506451744',
    "whatsapp" TEXT NOT NULL DEFAULT '+966506451744',
    "email" TEXT NOT NULL DEFAULT 'info@qahwajialriyad.com',
    "address" TEXT NOT NULL DEFAULT 'الرياض، المملكة العربية السعودية',
    "brandName" TEXT NOT NULL DEFAULT 'قهوجيين الرياض',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_section" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'ضيافة عربية أصيلة بلمسة فاخرة',
    "headlineHighlight" TEXT,
    "subheadline" TEXT NOT NULL DEFAULT 'نقدم خدمات القهوة العربية والضيافة الراقية لمناسباتكم الخاصة والرسمية في الرياض، بأعلى معايير الجودة والأصالة السعودية',
    "primaryCtaText" TEXT NOT NULL DEFAULT 'احجز خدمتك الآن',
    "primaryCtaLink" TEXT NOT NULL DEFAULT 'tel:+966506451744',
    "secondaryCtaText" TEXT NOT NULL DEFAULT 'تعرف على خدماتنا',
    "secondaryCtaLink" TEXT NOT NULL DEFAULT '#services',
    "backgroundImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_section" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'من نحن',
    "title" TEXT NOT NULL DEFAULT 'إرث عريق في الضيافة السعودية',
    "description1" TEXT NOT NULL DEFAULT 'نحن في قهوجيين الرياض نؤمن بأن القهوة العربية ليست مجرد مشروب، بل هي رمز للكرم والأصالة السعودية العريقة. نقدم خدمات الضيافة الفاخرة بأيدي فريق محترف يجسد قيم الضيافة العربية الأصيلة.',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_section" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'خدماتنا',
    "title" TEXT NOT NULL DEFAULT 'خدمات ضيافة متكاملة',
    "description" TEXT NOT NULL DEFAULT 'نقدم مجموعة شاملة من خدمات الضيافة العربية لتلبية احتياجات جميع المناسبات',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "why_us_section" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'لماذا نحن',
    "title" TEXT NOT NULL DEFAULT 'الخيار الأمثل لمناسباتكم',
    "description" TEXT NOT NULL DEFAULT 'نفخر بكوننا الخيار الأول للعديد من العائلات والشركات في الرياض. تميزنا ينبع من شغفنا بالضيافة السعودية الأصيلة وحرصنا على إرضاء عملائنا.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "why_us_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "why_us_features" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "why_us_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_section" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'تواصل معنا',
    "title" TEXT NOT NULL DEFAULT 'احجز خدمتك الآن',
    "description" TEXT NOT NULL DEFAULT 'تواصل معنا لحجز خدمات الضيافة لمناسبتك القادمة',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectId_key" ON "projects"("projectId");

-- CreateIndex
CREATE INDEX "projects_projectId_idx" ON "projects"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_projectId_key" ON "site_settings"("projectId");

-- CreateIndex
CREATE INDEX "site_settings_projectId_idx" ON "site_settings"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "hero_section_projectId_key" ON "hero_section"("projectId");

-- CreateIndex
CREATE INDEX "hero_section_projectId_idx" ON "hero_section"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "about_section_projectId_key" ON "about_section"("projectId");

-- CreateIndex
CREATE INDEX "about_section_projectId_idx" ON "about_section"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "services_section_projectId_key" ON "services_section"("projectId");

-- CreateIndex
CREATE INDEX "services_section_projectId_idx" ON "services_section"("projectId");

-- CreateIndex
CREATE INDEX "services_sectionId_idx" ON "services"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "why_us_section_projectId_key" ON "why_us_section"("projectId");

-- CreateIndex
CREATE INDEX "why_us_section_projectId_idx" ON "why_us_section"("projectId");

-- CreateIndex
CREATE INDEX "why_us_features_sectionId_idx" ON "why_us_features"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_section_projectId_key" ON "contact_section"("projectId");

-- CreateIndex
CREATE INDEX "contact_section_projectId_idx" ON "contact_section"("projectId");

-- CreateIndex
CREATE INDEX "gallery_images_projectId_idx" ON "gallery_images"("projectId");

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_section" ADD CONSTRAINT "hero_section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_section" ADD CONSTRAINT "about_section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_section" ADD CONSTRAINT "services_section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "services_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "why_us_section" ADD CONSTRAINT "why_us_section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "why_us_features" ADD CONSTRAINT "why_us_features_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "why_us_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_section" ADD CONSTRAINT "contact_section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
