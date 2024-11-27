import { Skip } from "../../utils/utils";
import { db, pool } from "../../db/db";
import { PAGE_SIZE } from "../../constants/page";
import { z } from "zod";
import AppError from "../../utils/error/AppError";
import CatchAsync from "../../utils/error/CatchAsync";
import { likes, posts, users } from "../../db/schema";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";

const postSchema = z.object({
  title: z.string().max(100, "Max length 100 char"),
  content: z.string(),
  summary: z.string(),
  status: z.enum(["private", "public"]),
});

export const validatePost = CatchAsync(async (req, res, next) => {
  postSchema.parse(req.body);

  next();
});

export const getAllPost = CatchAsync(async (req, res, next) => {
  const { p = 1, q = "" } = req.query;
  if (!Number(p)) {
    return next(new AppError("Page must be a number!", 400));
  }

  const data = await db
    .select({
      ...getTableColumns(posts),
      like_count: count(likes.id),
    })
    .from(posts)
    .leftJoin(likes, eq(likes.postId, posts.id))
    .where(
      and(
        eq(posts.status, "public"),
        or(
          ilike(posts.slug, `%${q}%`),
          ilike(posts.title, `%${q}%`),
          ilike(posts.content, `%${q}%`),
          ilike(posts.summary, `%${q}%`)
        )
      )
    )
    .groupBy(posts.id)
    .orderBy(desc(posts.createdAt), desc(count(likes.id)))
    .offset(Skip(Number(p)))
    .limit(PAGE_SIZE);

  res.status(200).json({
    status: "success",
    data,
  });
});

export const getPostBySlug = CatchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const result = await db
    .select({
      ...getTableColumns(posts),
      email: getTableColumns(users).email,
      image: getTableColumns(users).image,
      name: getTableColumns(users).name,
    })
    .from(posts)
    .where(eq(posts.slug, slug))
    .innerJoin(users, eq(users.id, posts.userId));

  if (result.length === 0) {
    return next(new AppError(`No post found with slug`, 404));
  }

  res.status(200).json({
    status: "success",
    data: result[0],
  });
});

export const createPost = CatchAsync(async (req, res, next) => {
  const { body } = req;
  const { title, content, summary, status } = body;

  const data = await db
    .insert(posts)
    .values({
      content,
      status,
      summary,
      title,
      userId: (req as any).user.id,
      slug: "",
    })
    .returning({
      id: posts.id,
      slug: posts.slug,
      userId: posts.userId,
    });

  res.status(201).json({
    status: "success",
    message: "Post created successfully",
    data,
  });
});

export const updatePost = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
  const { title, content, summary, status } = body;

  const data = await db
    .update(posts)
    .set({
      content,
      status,
      summary,
      title,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, Number(id)))
    .returning({
      id: posts.id,
      slug: posts.slug,
      userId: posts.userId,
    });

  if (data.length === 0) {
    return next(new AppError(`No post found with id ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    message: "Post created successfully",
    data,
  });
});

export const deletePost = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const result = await db.delete(posts).where(eq(posts.id, Number(id)));

  if (result.rowCount === 0) {
    return next(new AppError(`No post found with id ${id}`, 404));
  }

  res.status(204).send();
});
