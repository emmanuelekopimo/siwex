CREATE TYPE "public"."application_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'hub');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"student_user_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"note" text NOT NULL,
	"applied_on" date NOT NULL,
	"decided_on" date
);
--> statement-breakpoint
CREATE TABLE "hubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"address" text NOT NULL,
	"address_verified" boolean DEFAULT false NOT NULL,
	"about" text NOT NULL,
	"phone" text,
	"website" text,
	"tracks" text[] NOT NULL,
	"color" text DEFAULT '#7d2ae8' NOT NULL,
	CONSTRAINT "hubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "openings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hub_id" integer NOT NULL,
	"title" text NOT NULL,
	"track" text NOT NULL,
	"description" text NOT NULL,
	"slots" integer NOT NULL,
	"duration_weeks" integer NOT NULL,
	"start_date" date NOT NULL,
	"deadline" date NOT NULL,
	"stipend_naira" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"school" text NOT NULL,
	"course" text NOT NULL,
	"level" integer NOT NULL,
	"city" text NOT NULL,
	"required_weeks" integer NOT NULL,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hubs" ADD CONSTRAINT "hubs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openings" ADD CONSTRAINT "openings_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_opening_student_idx" ON "applications" USING btree ("opening_id","student_user_id");--> statement-breakpoint
CREATE INDEX "applications_student_idx" ON "applications" USING btree ("student_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hubs_owner_idx" ON "hubs" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "hubs_city_idx" ON "hubs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "openings_hub_idx" ON "openings" USING btree ("hub_id");