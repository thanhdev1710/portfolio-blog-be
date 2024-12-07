import { relations } from "drizzle-orm/relations";
import { comments, users, posts, postSections, likes, categories, postsCategories, tags, postsTags } from "./schema";

export const commentsRelations = relations(comments, ({one, many}) => ({
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	likes: many(likes),
}));

export const usersRelations = relations(users, ({many}) => ({
	comments: many(comments),
	likes: many(likes),
	posts: many(posts),
}));

export const postSectionsRelations = relations(postSections, ({one}) => ({
	post: one(posts, {
		fields: [postSections.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	postSections: many(postSections),
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [likes.commentId],
		references: [comments.id]
	}),
}));

export const postsCategoriesRelations = relations(postsCategories, ({one}) => ({
	category: one(categories, {
		fields: [postsCategories.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	postsCategories: many(postsCategories),
}));

export const postsTagsRelations = relations(postsTags, ({one}) => ({
	tag: one(tags, {
		fields: [postsTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	postsTags: many(postsTags),
}));