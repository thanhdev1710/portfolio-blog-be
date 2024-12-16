import { Skip } from "../../utils/utils";
import { db } from "../../db/db";
import { PAGE_SIZE } from "../../constants/page";
import { z } from "zod";
import AppError from "../../utils/error/AppError";
import CatchAsync from "../../utils/error/CatchAsync";
import {
  likes,
  posts,
  postSections,
  postsTags,
  tags,
  users,
} from "../../db/schema";
import {
  and,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

const postSchema = z.object({
  title: z.string().max(50),
  content: z.string(),
  summary: z.string(),
  image: z.string().optional(),
  status: z.enum(["private", "public"]),
});

export const validatePost = CatchAsync(async (req, res, next) => {
  postSchema.parse(req.body);

  next();
});

export const getAllPost = CatchAsync(async (req, res, next) => {
  const { p = 1, q = "", tag = "" } = req.query;

  if (!Number(p)) {
    return next(new AppError("Page must be a number!", 400));
  }

  const subquery = db
    .select({ postId: postsTags.postId })
    .from(postsTags)
    .innerJoin(tags, eq(tags.id, postsTags.tagId))
    .where(eq(tags.name, `${tag}`));

  const data = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      updatedAt: posts.updatedAt,
      status: posts.status,
      idUser: users.id,
      nameUser: users.name,
      emailUser: users.email,
      imageUser: users.image,
      tags: sql`ARRAY_AGG(DISTINCT ${tags.name})`.as("tags"), // Lấy tất cả các tag liên quan
      countView: posts.views,
      countLike: countDistinct(likes.id),
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(postsTags, eq(postsTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postsTags.tagId))
    .where(
      and(
        // Lọc theo tag nếu có
        ...(tag ? [inArray(posts.id, subquery)] : []),
        // Lọc theo trạng thái "public"
        eq(posts.status, "public"),
        // Lọc theo từ khóa tìm kiếm
        or(ilike(posts.slug, `%${q}%`), ilike(posts.title, `%${q}%`))
      )
    )
    .groupBy(posts.id, users.id)
    .orderBy(desc(posts.updatedAt), desc(countDistinct(likes.id)))
    .limit(PAGE_SIZE)
    .offset(Skip(Number(p)));

  const totalItem = await db.$count(
    posts,
    and(
      eq(posts.status, "public"),
      ...(tag ? [inArray(posts.id, subquery)] : []),
      or(ilike(posts.slug, `%${q}%`), ilike(posts.title, `%${q}%`))
    )
  );

  const totalPage = Math.ceil(totalItem / PAGE_SIZE);

  res.status(200).json({
    status: "success",
    totalItem,
    totalPage,
    data,
  });
});

export const getPostBySlug = CatchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const result = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      image: posts.imageUrl,
      content: posts.content,
      updatedAt: posts.updatedAt,
      status: posts.status,
      idUser: users.id,
      nameUser: users.name,
      emailUser: users.email,
      imageUser: users.image,
      tags: sql`ARRAY_AGG(DISTINCT ${tags.name})`.as("tags"),
      countView: posts.views,
      countLike: countDistinct(likes.id),
    })
    .from(posts)
    .where(eq(posts.slug, slug))
    .innerJoin(users, eq(users.id, posts.userId))
    .leftJoin(postSections, eq(postSections.postId, posts.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .leftJoin(postsTags, eq(postsTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postsTags.tagId))
    .groupBy(posts.id, users.id);

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
  const { title, content, summary, status, tags: ts, image } = body;

  const data = await db.transaction(async (tx) => {
    // Thêm bài viết vào bảng posts
    const postData = await tx
      .insert(posts)
      .values({
        content,
        status,
        summary,
        title,
        imageUrl: image,
        userId: (req as any).user.id,
        slug: "",
      })
      .returning({
        id: posts.id,
        slug: posts.slug,
        userId: posts.userId,
      });

    const postId = postData[0].id;

    // Xử lý tags: kiểm tra và thêm tag mới nếu cần
    const tagIds = await Promise.all(
      ts.map(async (tag: string) => {
        // Kiểm tra xem tag đã tồn tại chưa
        let existingTag = await tx
          .select()
          .from(tags)
          .where(eq(tags.name, tag))
          .limit(1);

        if (existingTag.length === 0) {
          // Nếu chưa tồn tại, thêm tag mới vào bảng tags
          const newTag = await tx
            .insert(tags)
            .values({ name: tag })
            .returning();

          return newTag[0].id; // Trả về ID của tag vừa thêm
        } else {
          // Nếu tag đã tồn tại, trả về ID của tag đó
          return existingTag[0].id;
        }
      })
    );

    // Thêm mối quan hệ giữa bài viết và tags vào bảng posts_tags
    const postTagRelations = tagIds.map((tagId) => ({
      postId: postId,
      tagId: tagId,
    }));

    // Thêm vào bảng posts_tags
    await tx.insert(postsTags).values(postTagRelations);

    return postData;
  });

  // Trả về kết quả
  res.status(201).json({
    status: "success",
    message: "Post created successfully",
    data,
  });
});

export const updatePost = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
  const { title, content, summary, status, image } = body;

  const data = await db
    .update(posts)
    .set({
      content,
      status,
      summary,
      title,
      imageUrl: image,
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
