import { z } from "zod";

export const databaseTypeSchema = z.enum(["postgresql", "sqlserver"]);
export const actorNameSchema = z.string().trim().min(2, "Informe seu nome.").max(80, "Use até 80 caracteres.");

export const commandSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(120, "Use até 120 caracteres."),
  databaseType: databaseTypeSchema,
  sqlCode: z.string().trim().min(5, "Informe o SQL."),
  actorName: actorNameSchema,
});

export type CommandInput = z.infer<typeof commandSchema>;
