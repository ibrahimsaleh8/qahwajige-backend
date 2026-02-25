import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer from "multer";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

export const router = express.Router();
const upload = multer();
// Configure Cloudinary (reused by multiple routes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------------
// Admin Auth Routes
// -------------------------

// POST /api/admin/register
router.post("/api/admin/register", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    const secretPassword = body.secretpassword;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    if (!secretPassword) {
      return res.status(400).json({ error: "secret passwor is required" });
    }

    if (secretPassword !== process.env.SECRET_PASSWORD) {
      return res.status(400).json({ error: "Invalid secret password" });
    }

    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true },
    });

    return res.status(201).json({ success: true, admin });
  } catch (error) {
    console.error("Admin register error:", error);
    return res.status(500).json({
      error: "Failed to register admin",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/admin/login
router.post("/api/admin/login", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return res.status(400).json({
        error: "بريد إلكتروني أو كلمة مرور غير صحيحة",
      });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        error: "بريد إلكتروني أو كلمة مرور غير صحيحة",
      });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({
        error: "بريد إلكتروني أو كلمة مرور غير صحيحة",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      },
    );

    // Assuming cookie middleware is enabled in Express
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      error: "Failed to login",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// -------------------------
// Project Creation
// -------------------------

// POST /api/create-project
router.post("/api/create-project", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};

    if (!body.projectId || !body.name || !body.description) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "projectId, name, and description are required",
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: { projectId: body.projectId },
    });

    if (existingProject) {
      return res.status(409).json({
        error: "Project ID already exists",
        message: `A project with ID "${body.projectId}" already exists`,
      });
    }

    const project = await prisma.project.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        description: body.description,
        isActive: body.isActive ?? true,

        // Site Settings
        siteSettings: body.siteSettings
          ? {
              create: {
                siteTitle: body.siteSettings.siteTitle,
                siteDescription: body.siteSettings.siteDescription,
                siteKeywords: body.siteSettings.siteKeywords || [],
                phone: body.siteSettings.phone,
                whatsapp: body.siteSettings.whatsapp,
                email: body.siteSettings.email,
                address: body.siteSettings.address,
                brandName: body.siteSettings.brandName,
              },
            }
          : undefined,

        // Hero Section
        heroSection: body.heroSection
          ? {
              create: {
                headline: body.heroSection.headline,
                headlineHighlight: body.heroSection.headlineHighlight,
                subheadline: body.heroSection.subheadline,
                primaryCtaText: body.heroSection.primaryCtaText,
                primaryCtaLink: body.heroSection.primaryCtaLink,
                secondaryCtaText: body.heroSection.secondaryCtaText,
                secondaryCtaLink: body.heroSection.secondaryCtaLink,
                backgroundImage: body.heroSection.backgroundImage,
                isActive: body.heroSection.isActive ?? true,
              },
            }
          : undefined,

        // About Section
        aboutSection: body.aboutSection
          ? {
              create: {
                label: body.aboutSection.label,
                title: body.aboutSection.title,
                description1: body.aboutSection.description1,
                image: body.aboutSection.image,
              },
            }
          : undefined,

        // Services Section
        servicesSection: body.servicesSection
          ? {
              create: {
                label: body.servicesSection.label,
                title: body.servicesSection.title,
                description: body.servicesSection.description,
                services: body.servicesSection.services
                  ? {
                      create: body.servicesSection.services.map(
                        (service: {
                          icon: any;
                          title: any;
                          description: any;
                        }) => ({
                          icon: service.icon,
                          title: service.title,
                          description: service.description,
                        }),
                      ),
                    }
                  : undefined,
              },
            }
          : undefined,

        // Why Us Section
        whyUsSection: body.whyUsSection
          ? {
              create: {
                label: body.whyUsSection.label,
                title: body.whyUsSection.title,
                description: body.whyUsSection.description,
                features: body.whyUsSection.features
                  ? {
                      create: body.whyUsSection.features.map(
                        (feature: {
                          icon: any;
                          title: any;
                          description: any;
                        }) => ({
                          icon: feature.icon,
                          title: feature.title,
                          description: feature.description,
                        }),
                      ),
                    }
                  : undefined,
              },
            }
          : undefined,

        // Contact Section
        contactSection: body.contactSection
          ? {
              create: {
                label: body.contactSection.label,
                title: body.contactSection.title,
                description: body.contactSection.description,
              },
            }
          : undefined,

        // Gallery Images
        galleryImages: body.galleryImages
          ? {
              create: body.galleryImages.map(
                (image: { url: any; alt: any }) => ({
                  url: image.url,
                  alt: image.alt,
                }),
              ),
            }
          : undefined,
      },
      include: {
        siteSettings: true,
        heroSection: true,
        aboutSection: true,
        servicesSection: {
          include: {
            services: true,
          },
        },
        whyUsSection: {
          include: {
            features: true,
          },
        },
        contactSection: true,
        galleryImages: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      error: "Failed to create project",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// -------------------------
// Public Project Data Routes
// -------------------------

type ProjectWithMainData = Prisma.ProjectGetPayload<{
  include: {
    heroSection: true;
    aboutSection: true;
    servicesSection: {
      include: { services: true };
    };
    whyUsSection: {
      include: { features: true };
    };
    contactSection: true;
    galleryImages: true;
    siteSettings: true;
  };
}>;

// GET /api/project/:id/main-data
router.get(
  "/api/project/:id/main-data",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          heroSection: true,
          aboutSection: true,
          servicesSection: {
            include: { services: true },
          },
          whyUsSection: {
            include: { features: true },
          },
          contactSection: true,
          galleryImages: true,
          siteSettings: true,
          packages: {
            select: {
              id: true,
              title: true,
              features: true,
              image: true,
            },
          },
          ratings: {
            select: {
              numberOfRatings: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Calculate average rating
      let averageRating = 0;
      let totalRatings = 0;
      if (project.ratings && project.ratings.length > 0) {
        const totalStars = project.ratings.reduce(
          (sum, r) => sum + r.numberOfRatings,
          0,
        );
        totalRatings = project.ratings.length;
        averageRating = parseFloat((totalStars / totalRatings).toFixed(1));
      }

      const response = {
        header: {
          brandName: project.siteSettings?.brandName ?? "",
        },
        hero: project.heroSection
          ? {
              headline: project.heroSection.headline,
              subheadline: project.heroSection.subheadline,
              whatsApp: project.siteSettings?.whatsapp ?? "",
            }
          : null,
        about: project.aboutSection
          ? {
              label: project.aboutSection.label,
              title: project.aboutSection.title,
              description1: project.aboutSection.description1,
              image: project.aboutSection.image ?? null,
            }
          : null,
        services: project.servicesSection
          ? {
              label: project.servicesSection.label,
              title: project.servicesSection.title,
              description: project.servicesSection.description,
              items: project.servicesSection.services.map((s) => ({
                id: s.id,
                icon: s.icon,
                title: s.title,
                description: s.description,
              })),
            }
          : null,
        whyUs: project.whyUsSection
          ? {
              label: project.whyUsSection.label,
              title: project.whyUsSection.title,
              description: project.whyUsSection.description,
              features: project.whyUsSection.features.map((f) => ({
                icon: f.icon,
                title: f.title,
                description: f.description,
              })),
            }
          : null,
        gallery: project.galleryImages.map((img) => ({
          url: img.url,
          alt: img.alt ?? undefined,
        })),
        footer: {
          brandName: project.siteSettings?.brandName ?? "",
          phone: project.siteSettings?.phone ?? "",
          email: project.siteSettings?.email ?? "",
          address: project.siteSettings?.address ?? "",
        },
        packages: project.packages,
        rating: {
          averageRating,
          totalRatings,
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("GET CONTENT ERROR:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/project/:id/main-data-with-keywords
router.get(
  "/api/project/:id/main-data-with-keywords",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          heroSection: true,
          aboutSection: true,
          servicesSection: {
            include: { services: true },
          },
          whyUsSection: {
            include: { features: true },
          },
          contactSection: true,
          galleryImages: true,
          siteSettings: true,
          packages: {
            select: {
              id: true,
              title: true,
              features: true,
              image: true,
            },
          },
          ratings: {
            select: {
              numberOfRatings: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Calculate average rating
      let averageRating = 0;
      let totalRatings = 0;
      if (project.ratings && project.ratings.length > 0) {
        const totalStars = project.ratings.reduce(
          (sum, r) => sum + r.numberOfRatings,
          0,
        );
        totalRatings = project.ratings.length;
        averageRating = parseFloat((totalStars / totalRatings).toFixed(1));
      }

      const response = {
        header: {
          brandName: project.siteSettings?.brandName ?? "",
        },
        hero: project.heroSection
          ? {
              headline: project.heroSection.headline,
              subheadline: project.heroSection.subheadline,
              whatsApp: project.siteSettings?.whatsapp ?? "",
            }
          : null,
        about: project.aboutSection
          ? {
              label: project.aboutSection.label,
              title: project.aboutSection.title,
              description1: project.aboutSection.description1,
              image: project.aboutSection.image ?? null,
            }
          : null,
        services: project.servicesSection
          ? {
              label: project.servicesSection.label,
              title: project.servicesSection.title,
              description: project.servicesSection.description,
              items: project.servicesSection.services.map((s) => ({
                id: s.id,
                icon: s.icon,
                title: s.title,
                description: s.description,
              })),
            }
          : null,
        whyUs: project.whyUsSection
          ? {
              label: project.whyUsSection.label,
              title: project.whyUsSection.title,
              description: project.whyUsSection.description,
              features: project.whyUsSection.features.map((f) => ({
                icon: f.icon,
                title: f.title,
                description: f.description,
              })),
            }
          : null,
        gallery: project.galleryImages.map((img) => ({
          url: img.url,
          alt: img.alt ?? undefined,
        })),
        footer: {
          brandName: project.siteSettings?.brandName ?? "",
          phone: project.siteSettings?.phone ?? "",
          email: project.siteSettings?.email ?? "",
          address: project.siteSettings?.address ?? "",
        },
        packages: project.packages,
        rating: {
          averageRating,
          totalRatings,
        },
        keywords: project.siteSettings?.siteKeywords,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("GET CONTENT ERROR:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/project/:id/metadata
router.get("/api/project/:id/metadata", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const siteSettings = await prisma.siteSettings.findFirst({
      where: {
        project: {
          id,
        },
      },
      select: {
        siteTitle: true,
        siteDescription: true,
        siteKeywords: true,
        brandName: true,
      },
    });

    if (!siteSettings) {
      return res.status(404).json({ error: "Metadata not found" });
    }

    return res.status(200).json({
      title: siteSettings.siteTitle,
      description: siteSettings.siteDescription,
      keywords: siteSettings.siteKeywords,
      brandName: siteSettings.brandName,
    });
  } catch (error) {
    console.error("GET METADATA ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------
// Dashboard - Main Project Data
// -------------------------

// GET /api/dashboard/:id/get-project-main-data
router.get(
  "/api/dashboard/:id/get-project-main-data",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const project = await prisma.project.findFirst({
        where: {
          OR: [{ id }],
        },
        select: {
          id: true,
          name: true,
          description: true,
          siteSettings: {
            select: {
              siteTitle: true,
              brandName: true,
              phone: true,
              whatsapp: true,
              email: true,
              address: true,
            },
          },
          heroSection: {
            select: {
              headline: true,
              subheadline: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const main = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
        siteSettings: project.siteSettings,
        heroSection: project.heroSection,
      };

      return res.status(200).json({ data: main });
    } catch (error) {
      console.error("Error fetching main dashboard data:", error);
      return res.status(500).json({
        error: "Failed to fetch main dashboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-project-main-data
router.put(
  "/api/dashboard/:id/update-project-main-data",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res
          .status(400)
          .json({ error: "Project id is required in the route" });
      }

      const body = req.body || {};

      const {
        projectName,
        projectDescription,
        brandName,
        siteTitle,
        email,
        phone,
        whatsapp,
        address,
        heroHeadline,
        heroSubheadline,
      } = body;

      if (!projectName || !projectDescription) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "projectName and projectDescription are required",
        });
      }

      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          siteSettings: true,
          heroSection: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [updatedProject, updatedSiteSettings, updatedHeroSection] =
        await prisma.$transaction([
          prisma.project.update({
            where: { id },
            data: {
              name: projectName,
              description: projectDescription,
            },
          }),
          prisma.siteSettings.update({
            where: { projectId: id },
            data: {
              brandName: brandName ?? existingProject.siteSettings?.brandName,
              siteTitle: siteTitle ?? existingProject.siteSettings?.siteTitle,
              email: email ?? existingProject.siteSettings?.email,
              phone: phone ?? existingProject.siteSettings?.phone,
              whatsapp: whatsapp ?? existingProject.siteSettings?.whatsapp,
              address: address ?? existingProject.siteSettings?.address,
            },
          }),
          prisma.heroSection.upsert({
            where: {
              projectId: id,
            },
            update: {
              headline:
                heroHeadline ?? existingProject.heroSection?.headline ?? "",
              subheadline:
                heroSubheadline ??
                existingProject.heroSection?.subheadline ??
                "",
            },
            create: {
              projectId: id,
              headline: heroHeadline ?? "",
              subheadline: heroSubheadline ?? "",
            },
          }),
        ]);

      const main = {
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
        },
        siteSettings: {
          siteTitle: updatedSiteSettings.siteTitle,
          brandName: updatedSiteSettings.brandName,
          phone: updatedSiteSettings.phone,
          whatsapp: updatedSiteSettings.whatsapp,
          email: updatedSiteSettings.email,
          address: updatedSiteSettings.address,
        },
        heroSection: {
          headline: updatedHeroSection.headline,
          subheadline: updatedHeroSection.subheadline,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Main dashboard data updated successfully",
        data: main,
      });
    } catch (error) {
      console.error("Error updating main dashboard data:", error);
      return res.status(500).json({
        error: "Failed to update main dashboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Dashboard - Gallery Images
// -------------------------

// GET /api/dashboard/:id/get-gallery-images
router.get(
  "/api/dashboard/:id/get-gallery-images",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const galleryImages = await prisma.galleryImage.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        data: {
          galleryImages: galleryImages.map((image) => ({
            id: image.id,
            projectId: image.projectId,
            url: image.url,
            alt: image.alt,
            createdAt: image.createdAt.toISOString(),
            updatedAt: image.updatedAt.toISOString(),
          })),
          count: galleryImages.length,
        },
      });
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      return res.status(500).json({
        error: "Failed to fetch gallery images",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/dashboard/:id/add-gallery-image
router.post(
  "/api/dashboard/:id/add-gallery-image",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const existingProject = await prisma.project.findUnique({
        where: { id: id as string },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const file = req.file;
      const alt = req.body.alt || null;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
          message: "Only JPEG, PNG, WebP, and GIF images are allowed",
        });
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({
          error: "File too large",
          message: "File size must be less than 10MB",
        });
      }

      const buffer = file.buffer;

      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `projects/${id}/gallery`,
              resource_type: "image",
              transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else if (!result) {
                reject(new Error("Cloudinary upload returned no result"));
              } else {
                resolve(result);
              }
            },
          );

          uploadStream.end(buffer);
        },
      );

      const cloudinaryResult: UploadApiResponse = uploadResult;

      if (!cloudinaryResult || !cloudinaryResult.secure_url) {
        return res.status(500).json({
          error: "Failed to upload image to Cloudinary",
        });
      }

      const galleryImage = await prisma.galleryImage.create({
        data: {
          projectId: id as string,
          url: cloudinaryResult.secure_url,
          alt: alt || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Gallery image added successfully",
        data: {
          galleryImage: {
            id: galleryImage.id,
            projectId: galleryImage.projectId,
            url: galleryImage.url,
            alt: galleryImage.alt,
            cloudinaryPublicId: cloudinaryResult.public_id,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            createdAt: galleryImage.createdAt.toISOString(),
            updatedAt: galleryImage.updatedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error adding gallery image:", error);
      return res.status(500).json({
        error: "Failed to add gallery image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// DELETE /api/dashboard/:id/delete-gallery-image
router.delete(
  "/api/dashboard/:id/delete-gallery-image",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { imageId } = body;

      if (!imageId) {
        return res.status(400).json({
          error: "Missing required field",
          message: "imageId is required",
        });
      }

      const galleryImage = await prisma.galleryImage.findUnique({
        where: { id: imageId },
      });

      if (!galleryImage) {
        return res.status(404).json({ error: "Gallery image not found" });
      }

      if (galleryImage.projectId !== id) {
        return res.status(403).json({
          error: "Gallery image does not belong to this project",
        });
      }

      const urlParts = galleryImage.url.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
        const publicId = publicIdWithExt.substring(
          0,
          publicIdWithExt.lastIndexOf("."),
        );

        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error("Error deleting from Cloudinary:", cloudinaryError);
        }
      }

      await prisma.galleryImage.delete({
        where: { id: imageId },
      });

      return res.status(200).json({
        success: true,
        message: "Gallery image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      return res.status(500).json({
        error: "Failed to delete gallery image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Dashboard - Keywords
// -------------------------

// GET /api/dashboard/:id/get-keywords
router.get(
  "/api/dashboard/:id/get-keywords",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const siteSettings = await prisma.siteSettings.findUnique({
        where: { projectId: id },
        select: {
          id: true,
          siteKeywords: true,
          siteTitle: true,
          siteDescription: true,
          updatedAt: true,
        },
      });

      if (!siteSettings) {
        return res.status(404).json({
          error: "Site settings not found for this project",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          keywords: siteSettings.siteKeywords,
          siteTitle: siteSettings.siteTitle,
          siteDescription: siteSettings.siteDescription,
          updatedAt: siteSettings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching keywords:", error);
      return res.status(500).json({
        error: "Failed to fetch keywords",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-keywrords
router.put(
  "/api/dashboard/:id/update-keywrords",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { keywords } = body;

      if (!keywords) {
        return res.status(400).json({
          error: "Missing required field",
          message: "keywords array is required",
        });
      }

      if (!Array.isArray(keywords)) {
        return res.status(400).json({
          error: "Invalid data type",
          message: "keywords must be an array of strings",
        });
      }

      const invalidKeywords = keywords.filter(
        (keyword) => typeof keyword !== "string" || keyword.trim() === "",
      );

      if (invalidKeywords.length > 0) {
        return res.status(400).json({
          error: "Invalid keywords",
          message: "All keywords must be non-empty strings",
        });
      }

      const trimmedKeywords = keywords.map((keyword) => keyword.trim());

      const existingSiteSettings = await prisma.siteSettings.findUnique({
        where: { projectId: id },
      });

      if (!existingSiteSettings) {
        return res.status(404).json({
          error: "Site settings not found for this project",
        });
      }

      const updatedSiteSettings = await prisma.siteSettings.update({
        where: { projectId: id },
        data: {
          siteKeywords: trimmedKeywords,
        },
        select: {
          id: true,
          siteKeywords: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Keywords updated successfully",
        data: {
          keywords: updatedSiteSettings.siteKeywords,
          updatedAt: updatedSiteSettings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating keywords:", error);
      return res.status(500).json({
        error: "Failed to update keywords",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Dashboard - Why Us section
// -------------------------

// GET /api/dashboard/:id/get-whyus
router.get(
  "/api/dashboard/:id/get-whyus",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          whyUsSection: {
            include: {
              features: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (!project.whyUsSection) {
        return res.status(404).json({
          error: "WhyUs section not found for this project",
        });
      }

      return res.status(200).json({
        success: true,
        message: "WhyUs data retrieved successfully",
        data: {
          whyUsSection: {
            id: project.whyUsSection.id,
            label: project.whyUsSection.label,
            title: project.whyUsSection.title,
            description: project.whyUsSection.description,
            features: project.whyUsSection.features.map((feature) => ({
              id: feature.id,
              sectionId: feature.sectionId,
              icon: feature.icon,
              title: feature.title,
              description: feature.description,
              createdAt: feature.createdAt.toISOString(),
              updatedAt: feature.updatedAt.toISOString(),
            })),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching whyUs data:", error);
      return res.status(500).json({
        error: "Failed to fetch whyUs data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-why-us-section
router.put(
  "/api/dashboard/:id/update-why-us-section",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { label, title, description } = body;

      if (!label || !title || !description) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "label, title and description are required",
        });
      }

      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          whyUsSection: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const whyUsSection = await prisma.whyUsSection.upsert({
        where: { projectId: id },
        update: {
          label,
          title,
          description,
        },
        create: {
          projectId: id,
          label,
          title,
          description,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Why Us section updated successfully",
        data: {
          whyUsSection: {
            id: whyUsSection.id,
            label: whyUsSection.label,
            title: whyUsSection.title,
            description: whyUsSection.description,
          },
        },
      });
    } catch (error) {
      console.error("Error updating why us section:", error);
      return res.status(500).json({
        error: "Failed to update why us section",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-why-us-feature
router.put(
  "/api/dashboard/:id/update-why-us-feature",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { featureId, title, description, icon } = body;

      if (!featureId || !title || !description || !icon) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "featureId, title, description, and icon are required",
        });
      }

      const existingFeature = await prisma.whyUsFeature.findUnique({
        where: { id: featureId },
        include: {
          section: {
            select: {
              projectId: true,
            },
          },
        },
      });

      if (!existingFeature) {
        return res.status(404).json({ error: "Feature not found" });
      }

      if (existingFeature.section.projectId !== id) {
        return res.status(403).json({
          error: "Feature does not belong to this project",
        });
      }

      const updatedFeature = await prisma.whyUsFeature.update({
        where: { id: featureId },
        data: {
          title,
          description,
          icon,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Why Us feature updated successfully",
        data: {
          feature: {
            id: updatedFeature.id,
            sectionId: updatedFeature.sectionId,
            title: updatedFeature.title,
            description: updatedFeature.description,
            icon: updatedFeature.icon,
            createdAt: updatedFeature.createdAt.toISOString(),
            updatedAt: updatedFeature.updatedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error updating why us feature:", error);
      return res.status(500).json({
        error: "Failed to update why us feature",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Dashboard - Services section
// -------------------------

// GET /api/dashboard/:id/get-services
router.get(
  "/api/dashboard/:id/get-services",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          servicesSection: {
            include: {
              services: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (!project.servicesSection) {
        return res.status(404).json({
          error: "Services section not found for this project",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Services data retrieved successfully",
        data: {
          servicesSection: {
            id: project.servicesSection.id,
            label: project.servicesSection.label,
            title: project.servicesSection.title,
            description: project.servicesSection.description,
            services: project.servicesSection.services.map((service) => ({
              id: service.id,
              sectionId: service.sectionId,
              icon: service.icon,
              title: service.title,
              description: service.description,
              createdAt: service.createdAt.toISOString(),
              updatedAt: service.updatedAt.toISOString(),
            })),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching services data:", error);
      return res.status(500).json({
        error: "Failed to fetch services data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-services
router.put(
  "/api/dashboard/:id/update-services",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { label, title, description } = body;

      if (!label || !title || !description) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "label, title and description are required",
        });
      }

      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          servicesSection: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const servicesSection = await prisma.servicesSection.upsert({
        where: { projectId: id },
        update: {
          label,
          title,
          description,
        },
        create: {
          projectId: id,
          label,
          title,
          description,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Services section updated successfully",
        data: {
          servicesSection: {
            id: servicesSection.id,
            label: servicesSection.label,
            title: servicesSection.title,
            description: servicesSection.description,
          },
        },
      });
    } catch (error) {
      console.error("Error updating services section:", error);
      return res.status(500).json({
        error: "Failed to update services section",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-service
router.put(
  "/api/dashboard/:id/update-service",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { serviceId, title, description, icon } = body;

      if (!serviceId || !title || !description || !icon) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "serviceId, title, description, and icon are required",
        });
      }

      const existingService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          section: {
            select: {
              projectId: true,
            },
          },
        },
      });

      if (!existingService) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (existingService.section.projectId !== id) {
        return res.status(403).json({
          error: "Service does not belong to this project",
        });
      }

      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
          title,
          description,
          icon,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: {
          service: {
            id: updatedService.id,
            sectionId: updatedService.sectionId,
            title: updatedService.title,
            description: updatedService.description,
            icon: updatedService.icon,
            createdAt: updatedService.createdAt.toISOString(),
            updatedAt: updatedService.updatedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error updating service:", error);
      return res.status(500).json({
        error: "Failed to update service",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Dashboard - About section
// -------------------------

// GET /api/dashboard/:id/get-about-project
router.get(
  "/api/dashboard/:id/get-about-project",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          aboutSection: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (!project.aboutSection) {
        return res.status(404).json({
          error: "About section not found for this project",
        });
      }

      const about = {
        id: project.aboutSection.id,
        label: project.aboutSection.label,
        title: project.aboutSection.title,
        description1: project.aboutSection.description1,
        image: project.aboutSection.image,
      };

      return res.status(200).json({
        success: true,
        message: "About project data fetched successfully",
        data: {
          about,
        },
      });
    } catch (error) {
      console.error("Error fetching about project data:", error);
      return res.status(500).json({
        error: "Failed to fetch about project data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PUT /api/dashboard/:id/update-about-project
router.put(
  "/api/dashboard/:id/update-about-project",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({
          error: "Project id is required in the route",
        });
      }

      const body = req.body || {};
      const { label, title, description1, image } = body;

      if (!label || !title || !description1) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "label, title and description1 are required",
        });
      }

      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          aboutSection: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const aboutSection = await prisma.aboutSection.upsert({
        where: { projectId: id },
        update: {
          label,
          title,
          description1,
          image: image ?? existingProject.aboutSection?.image ?? null,
        },
        create: {
          projectId: id,
          label,
          title,
          description1,
          image: image ?? null,
        },
      });

      const about = {
        id: aboutSection.id,
        label: aboutSection.label,
        title: aboutSection.title,
        description1: aboutSection.description1,
        image: aboutSection.image,
      };

      return res.status(200).json({
        success: true,
        message: "About project data updated successfully",
        data: {
          about,
        },
      });
    } catch (error) {
      console.error("Error updating about project data:", error);
      return res.status(500).json({
        error: "Failed to update about project data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Package Routes
// -------------------------

// POST /api/package - Create new package
router.post("/api/package", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { projectId, title, features, image } = body;

    if (!projectId || !title || !image) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "projectId, title and image are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const featuresArray = Array.isArray(features) ? features : [];

    const pkg = await prisma.package.create({
      data: {
        projectId,
        title: String(title).trim(),
        features: featuresArray.map((f: unknown) => String(f)),
        image: String(image).trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: pkg,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    return res.status(500).json({
      error: "Failed to create package",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/package/:id - Update package
router.put("/api/package/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body || {};
    const { title, features, image } = body;

    if (!id) {
      return res.status(400).json({
        error: "Package id is required in the route",
      });
    }

    const existing = await prisma.package.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Package not found" });
    }

    const updateData: { title?: string; features?: string[]; image?: string } =
      {};

    if (title !== undefined) {
      updateData.title = String(title).trim();
    }
    if (features !== undefined) {
      updateData.features = Array.isArray(features)
        ? features.map((f: unknown) => String(f))
        : [];
    }
    if (image !== undefined) {
      updateData.image = String(image).trim();
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: pkg,
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return res.status(500).json({
      error: "Failed to update package",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// -------------------------
// Rating Routes
// -------------------------

// POST /api/rating - Add new rating
router.post("/api/rating", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { projectId, stars } = body;

    if (!projectId || stars === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "projectId and stars are required",
      });
    }

    const starsNum = Number(stars);
    if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({
        error: "Invalid stars value",
        message: "stars must be a number between 1 and 5",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Create new rating entry
    const newRating = await prisma.rating.create({
      data: {
        projectId,
        numberOfRatings: starsNum,
      },
    });

    // Get all ratings for this project to calculate average
    const allRatings = await prisma.rating.findMany({
      where: { projectId },
    });

    const totalStars = allRatings.reduce(
      (sum, r) => sum + r.numberOfRatings,
      0,
    );
    const averageRating = (totalStars / allRatings.length).toFixed(1);

    return res.status(201).json({
      success: true,
      message: "Rating added successfully",
      data: {
        rating: newRating,
        statistics: {
          averageRating: parseFloat(averageRating),
          totalRatings: allRatings.length,
          totalStars: totalStars,
        },
      },
    });
  } catch (error) {
    console.error("Error adding rating:", error);
    return res.status(500).json({
      error: "Failed to add rating",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// -------------------------
// Generic Upload Images (non-dashboard)
// -------------------------

// POST /api/upload-images
router.post(
  "/api/upload-images",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const folder = req.body.folder || "uploads";
      const alt = req.body.alt || null;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
          message: "Only JPEG, PNG, WebP, and GIF images are allowed",
        });
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({
          error: "File too large",
          message: "File size must be less than 10MB",
        });
      }

      const buffer = file.buffer;

      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "image",
              transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else if (!result) {
                reject(new Error("Cloudinary upload returned no result"));
              } else {
                resolve(result);
              }
            },
          );

          uploadStream.end(buffer);
        },
      );

      if (!uploadResult.secure_url) {
        return res.status(500).json({
          error: "Failed to upload image to Cloudinary",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: uploadResult.secure_url,
          alt: alt || null,
          cloudinaryPublicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes,
        },
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({
        error: "Failed to upload image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// GET /api/project/:projectId/packages
router.get(
  "/api/project/:projectId/packages",
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params as { projectId: string };

      if (!projectId) {
        return res.status(400).json({
          error: "Project ID is required in the route",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const packages = await prisma.package.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        message: "Packages fetched successfully",
        data: packages,
      });
    } catch (error) {
      console.error("Error fetching packages:", error);
      return res.status(500).json({
        error: "Failed to fetch packages",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// DELETE /api/package/:packageId
router.delete(
  "/api/package/:packageId",
  async (req: Request, res: Response) => {
    try {
      const { packageId } = req.params as { packageId: string };

      if (!packageId) {
        return res.status(400).json({
          error: "Package ID is required in the route",
        });
      }

      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }

      await prisma.package.delete({
        where: { id: packageId },
      });

      return res.status(200).json({
        success: true,
        message: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting package:", error);
      return res.status(500).json({
        error: "Failed to delete package",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Article Routes
// -------------------------

// GET /api/project/:projectId/articles
router.get(
  "/api/project/:projectId/articles",
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params as { projectId: string };

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const articles = await prisma.article.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          content: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          articles,
          count: articles.length,
        },
      });
    } catch (error) {
      console.error("Error fetching articles:", error);
      return res.status(500).json({
        error: "Failed to fetch articles",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/article
router.post("/api/article", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { projectId, title, content, coverImage } = body;

    // 1️⃣ Validation
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        error: "projectId is required",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "title is required",
      });
    }

    // 2️⃣ Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    const isExistTitle = await prisma.article.findFirst({
      where: {
        title,
      },
    });

    if (isExistTitle) {
      return res.status(404).json({
        error: "هناك مقالة لها نفس العنوان من فضلك غير العنوان",
      });
    }

    // 4️⃣ Create article
    const article = await prisma.article.create({
      data: {
        projectId,
        title: title.trim(),
        content: content ? String(content) : "",
        coverImage:
          coverImage !== undefined && coverImage !== null && coverImage !== ""
            ? String(coverImage).trim()
            : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: { article },
    });
  } catch (error) {
    console.error("Error creating article:", error);

    return res.status(500).json({
      error: "Failed to create article",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/article/:articleId
router.get("/api/article/title/:title", async (req: Request, res: Response) => {
  try {
    const { title } = req.params as { title: string };

    const article = await prisma.article.findFirst({
      where: { title },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.status(200).json({
      success: true,
      data: { article },
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return res.status(500).json({
      error: "Failed to fetch article",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/article/:articleId
router.put("/api/article/:articleId", async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params as { articleId: string };
    const body = req.body || {};
    const { title, content, coverImage } = body;

    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: title ? String(title).trim() : existingArticle.title,
        content: content ?? existingArticle.content,
        coverImage:
          coverImage !== undefined
            ? coverImage
              ? String(coverImage).trim()
              : null
            : existingArticle.coverImage,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      data: { article: updatedArticle },
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return res.status(500).json({
      error: "Failed to update article",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/article/:articleId
router.delete(
  "/api/article/:articleId",
  async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params as { articleId: string };

      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      await prisma.article.delete({ where: { id: articleId } });

      return res.status(200).json({
        success: true,
        message: "Article deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting article:", error);
      return res.status(500).json({
        error: "Failed to delete article",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
export default router;
