import { sql } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const databaseTypeEnum = pgEnum("database_type", [
  "postgresql",
  "sqlserver",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "command_created",
  "command_updated",
  "command_deleted",
]);

export type CommandAuditSnapshot = {
  title: string;
  databaseType: DatabaseType;
  sqlCode: string;
};

export type AuditDetails = {
  before?: CommandAuditSnapshot;
  after?: CommandAuditSnapshot;
  changedFields?: Array<keyof CommandAuditSnapshot>;
  imported?: boolean;
};

export const commands = pgTable("commands", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  databaseType: databaseTypeEnum("database_type").notNull(),
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
export type DatabaseType = (typeof databaseTypeEnum.enumValues)[number];
export type AuditLog = typeof auditLogs.$inferSelect;
export type AuditAction = (typeof auditActionEnum.enumValues)[number];
