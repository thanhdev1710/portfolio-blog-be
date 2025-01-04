import { relations } from "drizzle-orm/relations";
import { users, posts, comments, likes, postsCategories, categories, postsTags, tags, bookmarks } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	comments: many(comments),
	likes: many(likes),
	postsCategories: many(postsCategories),
	postsTags: many(postsTags),
	bookmarks: many(bookmarks),
}));

export const usersRelations = relations(users, ({many}) => ({
	posts: many(posts),
	comments: many(comments),
	likes: many(likes),
	bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	likes: many(likes),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [likes.postId],
		references: [posts.id]
	}),
	comment: one(comments, {
		fields: [likes.commentId],
		references: [comments.id]
	}),
}));

export const postsCategoriesRelations = relations(postsCategories, ({one}) => ({
	post: one(posts, {
		fields: [postsCategories.postId],
		references: [posts.id]
	}),
	category: one(categories, {
		fields: [postsCategories.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	postsCategories: many(postsCategories),
}));

export const postsTagsRelations = relations(postsTags, ({one}) => ({
	post: one(posts, {
		fields: [postsTags.postId],
		references: [posts.id]
	}),
	tag: one(tags, {
		fields: [postsTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	postsTags: many(postsTags),
}));

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	user: one(users, {
		fields: [bookmarks.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [bookmarks.postId],
		references: [posts.id]
	}),
}));