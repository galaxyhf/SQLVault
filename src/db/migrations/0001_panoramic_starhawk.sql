ALTER TABLE "commands" ADD COLUMN "created_by" text DEFAULT 'Não informado' NOT NULL;--> statement-breakpoint
ALTER TABLE "commands" ADD COLUMN "updated_by" text;