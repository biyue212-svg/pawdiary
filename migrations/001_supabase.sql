CREATE TABLE IF NOT EXISTS "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"category" text NOT NULL,
	"species" text NOT NULL,
	"message" text NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "feedback_client_created_idx" ON "feedback" ("client_id","created_at");
CREATE TABLE IF NOT EXISTS "cloud_spaces" (
	"owner" text PRIMARY KEY NOT NULL,
	"revision" bigint NOT NULL,
	"object_key" text NOT NULL,
	"updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "family_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"expires_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "family_members" (
	"user" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "hub_limits" (
	"owner" text PRIMARY KEY NOT NULL,
	"window" bigint NOT NULL,
	"count" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_pets" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"data" text NOT NULL,
	"visible" bigint DEFAULT 1 NOT NULL,
	"updated_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "public_pets_owner_idx" ON "public_pets" ("owner");
CREATE TABLE IF NOT EXISTS "social_blocks" (
	"id" bigserial PRIMARY KEY,
	"owner" text NOT NULL,
	"target" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_blocks_unique" ON "social_blocks" ("owner","target");
CREATE TABLE IF NOT EXISTS "social_bookmarks" (
	"id" bigserial PRIMARY KEY,
	"owner" text NOT NULL,
	"post_id" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_bookmarks_unique" ON "social_bookmarks" ("owner","post_id");
CREATE TABLE IF NOT EXISTS "social_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "social_comments_post_idx" ON "social_comments" ("post_id");
CREATE TABLE IF NOT EXISTS "social_follows" (
	"id" bigserial PRIMARY KEY,
	"owner" text NOT NULL,
	"target" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_follows_unique" ON "social_follows" ("owner","target");
CREATE TABLE IF NOT EXISTS "social_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"sender" text NOT NULL,
	"receiver" text NOT NULL,
	"data" text NOT NULL,
	"status" text NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "social_invites_receiver_idx" ON "social_invites" ("receiver");
CREATE TABLE IF NOT EXISTS "social_likes" (
	"id" bigserial PRIMARY KEY,
	"owner" text NOT NULL,
	"post_id" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_likes_unique" ON "social_likes" ("owner","post_id");
CREATE TABLE IF NOT EXISTS "social_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"invite_id" text NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "social_messages_invite_idx" ON "social_messages" ("invite_id");
CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"author_id" text NOT NULL,
	"data" text NOT NULL,
	"created_at" bigint NOT NULL,
	"deleted" bigint DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "social_posts_created_idx" ON "social_posts" ("created_at");
CREATE TABLE IF NOT EXISTS "social_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"post_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" bigint NOT NULL
);

ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "feedback" FROM anon, authenticated;

ALTER TABLE "cloud_spaces" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "cloud_spaces" FROM anon, authenticated;

ALTER TABLE "family_codes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "family_codes" FROM anon, authenticated;

ALTER TABLE "family_members" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "family_members" FROM anon, authenticated;

ALTER TABLE "hub_limits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "hub_limits" FROM anon, authenticated;

ALTER TABLE "public_pets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public_pets" FROM anon, authenticated;

ALTER TABLE "social_blocks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_blocks" FROM anon, authenticated;

ALTER TABLE "social_bookmarks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_bookmarks" FROM anon, authenticated;

ALTER TABLE "social_comments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_comments" FROM anon, authenticated;

ALTER TABLE "social_follows" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_follows" FROM anon, authenticated;

ALTER TABLE "social_invites" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_invites" FROM anon, authenticated;

ALTER TABLE "social_likes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_likes" FROM anon, authenticated;

ALTER TABLE "social_messages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_messages" FROM anon, authenticated;

ALTER TABLE "social_posts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_posts" FROM anon, authenticated;

ALTER TABLE "social_reports" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "social_reports" FROM anon, authenticated;

INSERT INTO storage.buckets (id,name,public) VALUES ('pawdiary-private','pawdiary-private',false) ON CONFLICT(id) DO NOTHING;
