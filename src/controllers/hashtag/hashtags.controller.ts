import { count, desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { posts, postsTags, tags } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";

export const GetAllHashtag = CatchAsync(async (req, res, next) => {
  const data = await db
    .select({
      name: tags.name,
      countBlog: count(postsTags.postId),
    })
    .from(tags)
    .innerJoin(postsTags, eq(postsTags.tagId, tags.id))
    .innerJoin(posts, eq(posts.id, postsTags.postId))
    .where(eq(posts.status, "public"))
    .groupBy(tags.name)
    .orderBy(desc(count(postsTags.postId)));

  res.status(200).json({
    status: "success",
    data,
  });
});
