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
      CREATE TYPE database_type AS ENUM ('postgresql', 'sqlserver');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS commands (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      database_type database_type NOT NULL,
      sql_code text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;

  console.log("Database schema is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
