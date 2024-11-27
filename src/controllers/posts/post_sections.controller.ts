import { z } from "zod";
import { db } from "../../db/db";
import { postSections } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";

const schemaPostSections = z.object({
  title: z.string().min(10).max(255).optional(),
  altText: z.string().min(10).max(250).optional(),
  content: z.string(),
  position: z.number(),
});

export const validatePostSection = CatchAsync(async (req, res, next) => {
  schemaPostSections.parse(req.body);

  next();
});

export const createPostSections = CatchAsync(async (req, res, next) => {
  const { content, altText, imageUrl, position, title } = req.body;
  const { id } = req.params;

  const data = await db
    .insert(postSections)
    .values({
      content,
      postId: Number(id),
      altText,
      imageUrl,
      position,
      title,
    })
    .returning({
      id: postSections.id,
    });

  res.status(201).json({
    status: "success",
    message: "Post section created successfully",
    data,
  });
});
