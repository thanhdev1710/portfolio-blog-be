import { pgTable, unique, serial, varchar, timestamp, foreignKey, integer, index, text, check, char, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const roleEnum = pgEnum("role_enum", ['admin', 'author', 'editor', 'subscriber'])


export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		categoriesNameKey: unique("categories_name_key").on(table.name),
		categoriesSlugKey: unique("categories_slug_key").on(table.slug),
	}
});

export const tags = pgTable("tags", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
}, (table) => {
	return {
		tagsNameKey: unique("tags_name_key").on(table.name),
	}
});

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: integer("user_id").notNull(),
	parentId: integer("parent_id"),
	content: varchar({ length: 200 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		fkCommentsParent: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fk_comments_parent"
		}).onDelete("cascade"),
		fkCommentsUsers: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_comments_users"
		}).onDelete("cascade"),
	}
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	image: text(),
	password: varchar({ length: 300 }).notNull(),
	role: roleEnum().default('subscriber').notNull(),
	passwordChangedAt: timestamp("password_changed_at", { withTimezone: true, mode: 'string' }),
	passwordResetToken: varchar("password_reset_token", { length: 255 }),
	passwordResetExpires: timestamp("password_reset_expires", { withTimezone: true, mode: 'string' }),
}, (table) => {
	return {
		nameIdx: index("users_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
		usersEmailKey: unique("users_email_key").on(table.email),
	}
});

export const postSections = pgTable("post_sections", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	title: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	imageUrl: text("image_url"),
	altText: varchar("alt_text", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	position: integer().default(0).notNull(),
}, (table) => {
	return {
		fkPost: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_post"
		}).onDelete("cascade"),
		imageAltCheck: check("image_alt_check", sql`((image_url IS NOT NULL) AND (alt_text IS NOT NULL)) OR ((image_url IS NULL) AND (alt_text IS NULL))`),
	}
});

export const likes = pgTable("likes", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	userId: integer("user_id").notNull(),
	postId: integer("post_id"),
	commentId: integer("comment_id"),
	status: varchar({ length: 7 }).default('like'),
}, (table) => {
	return {
		fkLikesUser: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_likes_user"
		}).onDelete("cascade"),
		fkLikesPost: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_likes_post"
		}).onDelete("cascade"),
		fkLikesComment: foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "fk_likes_comment"
		}).onDelete("cascade"),
		likesUnique: unique("likes_unique").on(table.userId, table.postId, table.commentId),
		likesCheck: check("likes_check", sql`(COALESCE(((post_id)::boolean)::integer, 0) + COALESCE(((comment_id)::boolean)::integer, 0)) = 1`),
		likesStatusCheck: check("likes_status_check", sql`(status)::bpchar = ANY (ARRAY['like'::bpchar, 'dislike'::bpchar])`),
	}
});

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	content: text().notNull(),
	summary: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	status: char({ length: 7 }).default('public'),
	views: integer().default(0),
	userId: integer("user_id").notNull(),
	imageUrl: text("image_url"),
}, (table) => {
	return {
		fkPostsUsers: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_posts_users"
		}).onDelete("cascade"),
		postsSlugKey: unique("posts_slug_key").on(table.slug),
		postsStatusCheck: check("posts_status_check", sql`status = ANY (ARRAY['private'::bpchar, 'public'::bpchar])`),
	}
});

export const postsCategories = pgTable("posts_categories", {
	postId: integer("post_id").notNull(),
	categoryId: integer("category_id").notNull(),
}, (table) => {
	return {
		fkPostsCategoriesCategories: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "fk_posts_categories_categories"
		}).onDelete("cascade"),
		pkPostsCategories: primaryKey({ columns: [table.postId, table.categoryId], name: "pk_posts_categories"}),
	}
});

export const postsTags = pgTable("posts_tags", {
	postId: integer("post_id").notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => {
	return {
		fkPostsTagsTags: foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "fk_posts_tags_tags"
		}).onDelete("cascade"),
		pkPostsTags: primaryKey({ columns: [table.postId, table.tagId], name: "pk_posts_tags"}),
	}
});
