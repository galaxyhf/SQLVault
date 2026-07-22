import { neon } from "@neondatabase/serverless";
import { loadEnvFile } from "@/db/load-env";

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return process.env.DATABASE_URL;
}

async function main() {
  loadEnvFile();

  const sql = neon(getDatabaseUrl());

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
  await sql`
    DO $$
    BEGIN
      CREATE TYPE command_tag AS ENUM ('conferencia', 'conversao', 'geral');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$
    BEGIN
      CREATE TYPE audit_action AS ENUM ('command_created', 'command_updated', 'command_deleted');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS commands (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      tags command_tag[] DEFAULT ARRAY['geral']::command_tag[] NOT NULL,
      sql_code text NOT NULL,
      created_by text DEFAULT 'Não informado' NOT NULL,
      updated_by text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`
    ALTER TABLE commands
      ADD COLUMN IF NOT EXISTS tags command_tag[] DEFAULT ARRAY['geral']::command_tag[] NOT NULL,
      ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'Não informado' NOT NULL,
      ADD COLUMN IF NOT EXISTS updated_by text
  `;
  await sql`ALTER TABLE commands DROP COLUMN IF EXISTS database_type`;
  await sql`DROP TYPE IF EXISTS database_type`;
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      action audit_action NOT NULL,
      actor_name text NOT NULL,
      command_id uuid NOT NULL,
      command_title text NOT NULL,
      details jsonb DEFAULT '{}'::jsonb NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_logs_command_id_idx ON audit_logs (command_id)`;
  await sql`
    INSERT INTO audit_logs (action, actor_name, command_id, command_title, details, created_at)
    SELECT
      'command_created'::audit_action,
      commands.created_by,
      commands.id,
      commands.title,
      jsonb_build_object(
        'after', jsonb_build_object(
          'title', commands.title,
          'tags', commands.tags,
          'sqlCode', commands.sql_code
        ),
        'imported', true
      ),
      commands.created_at
    FROM commands
    WHERE NOT EXISTS (
      SELECT 1
      FROM audit_logs
      WHERE audit_logs.command_id = commands.id
        AND audit_logs.action = 'command_created'
    )
  `;

  console.log("Database schema is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
