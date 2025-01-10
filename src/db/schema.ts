import { pgTable, foreignKey, unique, check, serial, varchar, text, integer, timestamp, char, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const roleEnum = pgEnum("role_enum", ['admin', 'author', 'editor', 'subscriber'])
export const statusEnum = pgEnum("status_enum", ['active', 'in-development', 'no-funding'])


export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	content: text().notNull(),
	summary: text().notNull(),
	duration: integer().default(1).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	status: char({ length: 7 }).default('public'),
	views: integer().default(0),
	userId: integer("user_id").notNull(),
	fileId: varchar("file_id", { length: 50 }),
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

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	image: text(),
	role: roleEnum().default('subscriber'),
	password: varchar({ length: 300 }).notNull(),
	passwordResetToken: varchar("password_reset_token", { length: 255 }),
	passwordResetExpires: timestamp("password_reset_expires", { withTimezone: true, mode: 'string' }),
	passwordChangedAt: timestamp("password_changed_at", { withTimezone: true, mode: 'string' }),
	fileId: varchar("file_id", { length: 50 }),
}, (table) => {
	return {
		usersEmailKey: unique("users_email_key").on(table.email),
	}
});

export const tags = pgTable("tags", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 20 }).notNull(),
}, (table) => {
	return {
		tagsNameKey: unique("tags_name_key").on(table.name),
	}
});

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 20 }).notNull(),
}, (table) => {
	return {
		categoriesNameKey: unique("categories_name_key").on(table.name),
	}
});

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: integer("user_id").notNull(),
	parentId: integer("parent_id"),
	body: varchar({ length: 200 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		fkCommentsParent: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fk_comments_parent"
		}).onDelete("cascade"),
		fkCommentsPosts: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_comments_posts"
		}).onDelete("cascade"),
		fkCommentsUsers: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_comments_users"
		}).onDelete("cascade"),
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
		likesCommentUnique: unique("likes_comment_unique").on(table.userId, table.commentId),
		likesPostUnique: unique("likes_post_unique").on(table.userId, table.postId),
		likesStatusCheck: check("likes_status_check", sql`(status)::text = ANY ((ARRAY['like'::character varying, 'dislike'::character varying])::text[])`),
		likesCheck: check("likes_check", sql`(COALESCE(((post_id)::boolean)::integer, 0) + COALESCE(((comment_id)::boolean)::integer, 0)) = 1`),
	}
});

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	imgMain: text("img_main").notNull(),
	imgGallery: text("img_gallery").array(),
	shortDescription: varchar("short_description", { length: 300 }),
	detailedDescription: text("detailed_description"),
	demoLink: text("demo_link"),
	status: statusEnum().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	video: text().notNull(),
}, (table) => {
	return {
		projectsSlugKey: unique("projects_slug_key").on(table.slug),
	}
});

export const postsCategories = pgTable("posts_categories", {
	postId: integer("post_id").notNull(),
	categoryId: integer("category_id").notNull(),
}, (table) => {
	return {
		fkPostsCategoriesPosts: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_posts_categories_posts"
		}).onDelete("cascade"),
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
		fkPostsTagsPosts: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_posts_tags_posts"
		}).onDelete("cascade"),
		fkPostsTagsTags: foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "fk_posts_tags_tags"
		}).onDelete("cascade"),
		pkPostsTags: primaryKey({ columns: [table.postId, table.tagId], name: "pk_posts_tags"}),
	}
});

export const bookmarks = pgTable("bookmarks", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
}, (table) => {
	return {
		fkBookmarksUsers: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_bookmarks_users"
		}).onDelete("cascade"),
		fkBookmarksPosts: foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "fk_bookmarks_posts"
		}).onDelete("cascade"),
		pkBookmarks: primaryKey({ columns: [table.userId, table.postId], name: "pk_bookmarks"}),
	}
});
