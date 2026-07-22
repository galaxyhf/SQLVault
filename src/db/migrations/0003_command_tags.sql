CREATE TYPE "public"."command_tag" AS ENUM('conferencia', 'conversao', 'geral');--> statement-breakpoint
ALTER TABLE "commands" ADD COLUMN "tags" "command_tag"[] DEFAULT ARRAY['geral']::command_tag[] NOT NULL;--> statement-breakpoint
ALTER TABLE "commands" DROP COLUMN "database_type";--> statement-breakpoint
DROP TYPE "public"."database_type";