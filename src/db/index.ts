import { neon } from "@neondatabase/serverless";
import { and, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { commands, type DatabaseType, type NewCommand } from "@/db/schema";
import { loadEnvFile } from "@/db/load-env";

loadEnvFile();

let db: NeonHttpDatabase<typeof schema> | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!db) {
    db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }

  return db;
}

export type CommandFilters = {
  query?: string;
  databaseType?: DatabaseType | "all";
  page?: number;
  pageSize?: number;
};

export async function listCommands(filters: CommandFilters = {}) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 9, 1), 500);
  const offset = (page - 1) * pageSize;

  if (!hasDatabaseUrl()) {
    return {
      commands: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
    };
  }

  const clauses = [];
  if (filters.query?.trim()) {
    clauses.push(ilike(commands.title, `%${filters.query.trim()}%`));
  }
  if (filters.databaseType && filters.databaseType !== "all") {
    clauses.push(eq(commands.databaseType, filters.databaseType));
  }

  const where = clauses.length === 1 ? clauses[0] : clauses.length > 1 ? and(...clauses) : undefined;
  const database = getDb();
  const [rows, totalRows] = await Promise.all([
    database.query.commands.findMany({
      where,
      orderBy: [desc(commands.createdAt)],
      limit: pageSize,
      offset,
    }),
    database.select({ value: count() }).from(commands).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;

  return {
    commands: rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function listLatestCommands(limit = 5) {
  if (!hasDatabaseUrl()) {
    return [];
  }

  return getDb().query.commands.findMany({
    orderBy: [desc(commands.createdAt)],
    limit,
  });
}

export async function getCommandById(id: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }

  return getDb().query.commands.findFirst({
    where: eq(commands.id, id),
  });
}

export async function getCommandsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  if (!hasDatabaseUrl()) {
    return [];
  }

  return getDb().query.commands.findMany({
    where: inArray(commands.id, ids),
    orderBy: [desc(commands.createdAt)],
  });
}

export async function getCommandStats() {
  if (!hasDatabaseUrl()) {
    return {
      total: 0,
      postgresql: 0,
      sqlserver: 0,
    };
  }

  const database = getDb();
  const [totalRows, postgresRows, sqlServerRows] = await Promise.all([
    database.select({ value: count() }).from(commands),
    database.select({ value: count() }).from(commands).where(eq(commands.databaseType, "postgresql")),
    database.select({ value: count() }).from(commands).where(eq(commands.databaseType, "sqlserver")),
  ]);

  return {
    total: totalRows[0]?.value ?? 0,
    postgresql: postgresRows[0]?.value ?? 0,
    sqlserver: sqlServerRows[0]?.value ?? 0,
  };
}

export async function createCommand(input: NewCommand) {
  const [created] = await getDb().insert(commands).values(input).returning();
  return created;
}

export async function updateCommand(id: string, input: Omit<NewCommand, "id" | "createdAt">) {
  const [updated] = await getDb()
    .update(commands)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(commands.id, id))
    .returning();
  return updated;
}

export async function deleteCommand(id: string) {
  await getDb().delete(commands).where(eq(commands.id, id));
}
