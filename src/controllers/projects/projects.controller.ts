import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { projects } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";
import AppError from "../../utils/error/AppError";
import { z } from "zod";

const TypeCreateProject = z.object({
  title: z.string().max(100),
  imgMain: z.string(),
  imgGallery: z.array(z.string()),
  shortDescription: z.string().max(300),
  detailedDescription: z.string(),
  demoLink: z.string().default(""),
  slug: z.string().default(""),
  video: z.string(),
  status: z.enum(["active", "in-development", "no-funding"]),
});

export const validateCreateProject = CatchAsync(async (req, res, next) => {
  req.body["imgMain"] = req.body["image"];
  req.body["imgGallery"] = req.body["images"];
  req.body["video"] = req.body["video"];
  req.body = TypeCreateProject.parse(req.body);

  next();
});

export const getAllProject = CatchAsync(async (req, res, next) => {
  const data = await db.select().from(projects);
  res.status(200).json({
    status: "success",
    data,
  });
});

export const getProjectBySlug = CatchAsync(async (req, res, next) => {
  const { slug } = req.params;
  if (slug && typeof slug === "string") {
    const data = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug));

    res.status(200).json({
      status: "success",
      data,
    });
  } else {
    next(new AppError("Not found", 404));
  }
});

export const createProject = CatchAsync(async (req, res, next) => {
  const data = (await db.insert(projects).values(req.body).returning())[0];
  res.status(201).json({
    status: "success",
    data,
  });
});

export const updateProject = CatchAsync(async (req, res, next) => {});

export const deleteProject = CatchAsync(async (req, res, next) => {
  const { slug } = req.params;
  if (slug && typeof slug === "string") {
    await db.delete(projects).where(eq(projects.slug, slug));

    res.status(204).json({
      status: "success",
    });
  } else {
    next(new AppError("Not found", 404));
  }
});
