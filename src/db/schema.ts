import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const databaseTypeEnum = pgEnum("database_type", [
  "postgresql",
  "sqlserver",
]);

export const commands = pgTable("commands", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  databaseType: databaseTypeEnum("database_type").notNull(),
  sqlCode: text("sql_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;
export type DatabaseType = (typeof databaseTypeEnum.enumValues)[number];
