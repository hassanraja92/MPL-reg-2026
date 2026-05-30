CREATE TABLE "admins" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY,
	"full_name" text NOT NULL,
	"mobile_number" text NOT NULL UNIQUE,
	"email" text DEFAULT '',
	"date_of_birth" text DEFAULT '',
	"age" integer,
	"gender" text DEFAULT '',
	"address" text DEFAULT '',
	"district" text DEFAULT '',
	"state" text DEFAULT '',
	"playing_role" text DEFAULT '',
	"batting_style" text DEFAULT '',
	"bowling_style" text DEFAULT '',
	"profile_photo_url" text DEFAULT '',
	"emergency_contact_name" text DEFAULT '',
	"emergency_contact_number" text DEFAULT '',
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
