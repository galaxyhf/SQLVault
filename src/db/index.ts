import { neon } from "@neondatabase/serverless";
import { and, arrayContains, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import {
  auditLogs,
  commands,
  type AuditDetails,
  type Command,
  type CommandAuditSnapshot,
  type CommandTag,
  type NewCommand,
} from "@/db/schema";
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
  tag?: CommandTag | "all";
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
  if (filters.tag && filters.tag !== "all") {
    clauses.push(arrayContains(commands.tags, [filters.tag]));
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
      conferencia: 0,
      conversao: 0,
      geral: 0,
    };
  }

  const database = getDb();
  const [totalRows, conferenciaRows, conversaoRows, geralRows] = await Promise.all([
    database.select({ value: count() }).from(commands),
    database.select({ value: count() }).from(commands).where(arrayContains(commands.tags, ["conferencia"])),
    database.select({ value: count() }).from(commands).where(arrayContains(commands.tags, ["conversao"])),
    database.select({ value: count() }).from(commands).where(arrayContains(commands.tags, ["geral"])),
  ]);

  return {
    total: totalRows[0]?.value ?? 0,
    conferencia: conferenciaRows[0]?.value ?? 0,
    conversao: conversaoRows[0]?.value ?? 0,
    geral: geralRows[0]?.value ?? 0,
  };
}

function commandSnapshot(command: Pick<Command, "title" | "tags" | "sqlCode">): CommandAuditSnapshot {
  return {
    title: command.title,
    tags: command.tags,
    sqlCode: command.sqlCode,
  };
}

function changedFields(before: CommandAuditSnapshot, after: CommandAuditSnapshot) {
  return (Object.keys(before) as Array<keyof CommandAuditSnapshot>).filter(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  );
}

export async function createCommand(input: NewCommand & { tags: CommandTag[] }) {
  const id = crypto.randomUUID();
  const after = commandSnapshot(input);
  const database = getDb();
  const [createdRows] = await database.batch([
    database.insert(commands).values({ ...input, id }).returning(),
    database.insert(auditLogs).values({
      action: "command_created",
      actorName: input.createdBy ?? "Não informado",
      commandId: id,
      commandTitle: input.title,
      details: { after },
    }),
  ]);

  return createdRows[0];
}

export async function updateCommand(
  id: string,
  input: Omit<NewCommand, "id" | "createdAt" | "tags"> & { tags: CommandTag[] },
) {
  const existing = await getCommandById(id);
  if (!existing) return null;

  const before = commandSnapshot(existing);
  const after = commandSnapshot({
    title: input.title,
    tags: input.tags,
    sqlCode: input.sqlCode,
  });
  const details: AuditDetails = { before, after, changedFields: changedFields(before, after) };
  const database = getDb();
  const [updatedRows] = await database.batch([
    database
      .update(commands)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(commands.id, id))
      .returning(),
    database.insert(auditLogs).values({
      action: "command_updated",
      actorName: input.updatedBy ?? "Não informado",
      commandId: id,
      commandTitle: input.title,
      details,
    }),
  ]);

  return updatedRows[0] ?? null;
}

export async function deleteCommand(id: string, actorName: string) {
  const existing = await getCommandById(id);
  if (!existing) return false;

  const database = getDb();
  await database.batch([
    database.delete(commands).where(eq(commands.id, id)),
    database.insert(auditLogs).values({
      action: "command_deleted",
      actorName,
      commandId: id,
      commandTitle: existing.title,
      details: { before: commandSnapshot(existing) },
    }),
  ]);

  return true;
}

export async function listAuditLogs() {
  if (!hasDatabaseUrl()) return [];

  return getDb().query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
  });
}
