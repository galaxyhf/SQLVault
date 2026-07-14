CREATE TYPE "public"."audit_action" AS ENUM('command_created', 'command_updated', 'command_deleted');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "audit_action" NOT NULL,
	"actor_name" text NOT NULL,
	"command_id" uuid NOT NULL,
	"command_title" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_command_id_idx" ON "audit_logs" USING btree ("command_id");--> statement-breakpoint
INSERT INTO "audit_logs" ("action", "actor_name", "command_id", "command_title", "details", "created_at")
SELECT
	'command_created'::"audit_action",
	"commands"."created_by",
	"commands"."id",
	"commands"."title",
	jsonb_build_object(
		'after', jsonb_build_object(
			'title', "commands"."title",
			'databaseType', "commands"."database_type",
			'sqlCode', "commands"."sql_code"
		),
		'imported', true
	),
	"commands"."created_at"
FROM "commands"
WHERE NOT EXISTS (
	SELECT 1
	FROM "audit_logs"
	WHERE "audit_logs"."command_id" = "commands"."id"
		AND "audit_logs"."action" = 'command_created'
);
