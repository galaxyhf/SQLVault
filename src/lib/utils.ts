import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CommandTag } from "@/db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tagLabel(tag: CommandTag) {
  if (tag === "conferencia") return "Conferência";
  if (tag === "conversao") return "Conversão";
  return "Geral";
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}
