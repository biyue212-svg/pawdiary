import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull(),
  category: text('category').notNull(),
  species: text('species').notNull(),
  message: text('message').notNull(),
  contact: text('contact').notNull().default(''),
  createdAt: integer('created_at').notNull(),
}, table => [index('feedback_client_created_idx').on(table.clientId, table.createdAt)]);

export const cloudSpaces=sqliteTable('cloud_spaces',{owner:text('owner').primaryKey(),revision:integer('revision').notNull(),objectKey:text('object_key').notNull(),updatedAt:integer('updated_at').notNull()});
export const publicPets=sqliteTable('public_pets',{id:text('id').primaryKey(),owner:text('owner').notNull(),data:text('data').notNull(),visible:integer('visible').notNull().default(1),updatedAt:integer('updated_at').notNull()},t=>[index('public_pets_owner_idx').on(t.owner)]);
export const socialPosts=sqliteTable('social_posts',{id:text('id').primaryKey(),owner:text('owner').notNull(),authorId:text('author_id').notNull(),data:text('data').notNull(),createdAt:integer('created_at').notNull(),deleted:integer('deleted').notNull().default(0)},t=>[index('social_posts_created_idx').on(t.createdAt)]);
export const socialComments=sqliteTable('social_comments',{id:text('id').primaryKey(),postId:text('post_id').notNull(),owner:text('owner').notNull(),name:text('name').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull()},t=>[index('social_comments_post_idx').on(t.postId)]);
export const socialLikes=sqliteTable('social_likes',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),postId:text('post_id').notNull()},t=>[uniqueIndex('social_likes_unique').on(t.owner,t.postId)]);
export const socialBookmarks=sqliteTable('social_bookmarks',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),postId:text('post_id').notNull()},t=>[uniqueIndex('social_bookmarks_unique').on(t.owner,t.postId)]);
export const socialFollows=sqliteTable('social_follows',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),target:text('target').notNull()},t=>[uniqueIndex('social_follows_unique').on(t.owner,t.target)]);
export const socialBlocks=sqliteTable('social_blocks',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),target:text('target').notNull()},t=>[uniqueIndex('social_blocks_unique').on(t.owner,t.target)]);
export const socialReports=sqliteTable('social_reports',{id:text('id').primaryKey(),owner:text('owner').notNull(),postId:text('post_id').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull()});
export const socialInvites=sqliteTable('social_invites',{id:text('id').primaryKey(),sender:text('sender').notNull(),receiver:text('receiver').notNull(),data:text('data').notNull(),status:text('status').notNull(),createdAt:integer('created_at').notNull()},t=>[index('social_invites_receiver_idx').on(t.receiver)]);
export const socialMessages=sqliteTable('social_messages',{id:text('id').primaryKey(),inviteId:text('invite_id').notNull(),owner:text('owner').notNull(),name:text('name').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull()},t=>[index('social_messages_invite_idx').on(t.inviteId)]);
export const familyMembers=sqliteTable('family_members',{user:text('user').primaryKey(),owner:text('owner').notNull()});
export const familyCodes=sqliteTable('family_codes',{code:text('code').primaryKey(),owner:text('owner').notNull(),expiresAt:integer('expires_at').notNull()});
export const hubLimits=sqliteTable('hub_limits',{owner:text('owner').primaryKey(),window:integer('window').notNull(),count:integer('count').notNull()});
