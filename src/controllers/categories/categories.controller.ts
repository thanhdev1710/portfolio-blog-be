import { count, desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { categories, posts, postsCategories } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";

export const GetAllCategories = CatchAsync(async (req, res, next) => {
  const data = await db
    .select({
      name: categories.name,
      countBlog: count(postsCategories.postId),
    })
    .from(categories)
    .innerJoin(postsCategories, eq(postsCategories.categoryId, categories.id))
    .innerJoin(posts, eq(posts.id, postsCategories.postId))
    .where(eq(posts.status, "public"))
    .groupBy(categories.name)
    .orderBy(desc(count(postsCategories.postId)));

  res.status(200).json({
    status: "success",
    data,
  });
});
