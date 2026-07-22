import { sql } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const commandTagEnum = pgEnum("command_tag", ["conferencia", "conversao", "geral"]);

export const auditActionEnum = pgEnum("audit_action", [
  "command_created",
  "command_updated",
  "command_deleted",
]);

export type CommandAuditSnapshot = {
  title: string;
  tags: CommandTag[];
  sqlCode: string;
};

export type StoredCommandAuditSnapshot = {
  title: string;
  tags?: CommandTag[];
  databaseType?: "postgresql" | "sqlserver";
  sqlCode: string;
};

export type AuditDetails = {
  before?: StoredCommandAuditSnapshot;
  after?: StoredCommandAuditSnapshot;
  changedFields?: Array<keyof StoredCommandAuditSnapshot>;
  imported?: boolean;
};

export const commands = pgTable("commands", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  tags: commandTagEnum("tags").array().default(sql`ARRAY['geral']::command_tag[]`).notNull(),
  sqlCode: text("sql_code").notNull(),
  createdBy: text("created_by").default("Não informado").notNull(),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: auditActionEnum("action").notNull(),
    actorName: text("actor_name").notNull(),
    commandId: uuid("command_id").notNull(),
    commandTitle: text("command_title").notNull(),
    details: jsonb("details").$type<AuditDetails>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_command_id_idx").on(table.commandId),
  ],
);

export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;
export type CommandTag = (typeof commandTagEnum.enumValues)[number];
export type AuditLog = typeof auditLogs.$inferSelect;
export type AuditAction = (typeof auditActionEnum.enumValues)[number];
