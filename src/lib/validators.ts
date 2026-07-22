import { z } from "zod";

export const commandTagSchema = z.enum(["conferencia", "conversao", "geral"]);
export const actorNameSchema = z.string().trim().min(2, "Informe seu nome.").max(80, "Use até 80 caracteres.");

export const commandSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(120, "Use até 120 caracteres."),
  tags: z.array(commandTagSchema).min(1, "Selecione pelo menos uma tag."),
  sqlCode: z.string().trim().min(5, "Informe o SQL."),
  actorName: actorNameSchema,
});

export type CommandInput = z.infer<typeof commandSchema>;
