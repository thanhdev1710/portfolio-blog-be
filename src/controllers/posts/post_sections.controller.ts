import { z } from "zod";
import { db } from "../../db/db";
import { postSections } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";
import { eq } from "drizzle-orm";

const schemaPostSections = z.object({
  title: z.string().max(50),
  altText: z.string().max(255).optional(),
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

export const getPostSectionById = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const data = await db
    .select()
    .from(postSections)
    .where(eq(postSections.postId, Number(id)))
    .orderBy(postSections.position);

  res.status(200).json({
    status: "success",
    data,
  });
});

export const updateSectionOrder = CatchAsync(async (req, res, next) => {
  const sections: { position: number; id: number }[] = req.body;

  await db.transaction(async (tx) => {
    const updates = sections.map((sec) =>
      tx
        .update(postSections)
        .set({ position: sec.position, updatedAt: new Date().toISOString() })
        .where(eq(postSections.id, sec.id))
    );
    await Promise.all(updates);
  });

  return res.status(204).json({
    status: "success",
    message: "Section order updated successfully",
  });
});
