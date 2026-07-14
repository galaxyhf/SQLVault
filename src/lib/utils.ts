import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DatabaseType } from "@/db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function databaseLabel(databaseType: DatabaseType) {
  return databaseType === "postgresql" ? "PostgreSQL" : "SQL Server";
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}
