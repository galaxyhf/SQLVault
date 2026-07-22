"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCommand, deleteCommand, hasDatabaseUrl, updateCommand } from "@/db";
import { actorNameSchema, commandSchema } from "@/lib/validators";

export type CommandActionState = {
  ok: boolean;
  message?: string;
  errors?: {
    title?: string[];
    tags?: string[];
    sqlCode?: string[];
    actorName?: string[];
  };
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    return {
      ok: false,
      message: "Configure DATABASE_URL para salvar alterações no Neon PostgreSQL.",
    } satisfies CommandActionState;
  }

  return null;
}

export async function saveCommandAction(_: CommandActionState, formData: FormData): Promise<CommandActionState> {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const parsed = commandSchema.safeParse({
    title: formData.get("title"),
    tags: formData.getAll("tags"),
    sqlCode: formData.get("sqlCode"),
    actorName: formData.get("actorName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const command = await createCommand({
    title: parsed.data.title,
    tags: parsed.data.tags,
    sqlCode: parsed.data.sqlCode,
    createdBy: parsed.data.actorName,
  });

  revalidatePath("/dashboard");
  revalidatePath("/commands");
  revalidatePath("/logs");
  redirect(`/commands/${command.id}`);
}

export async function updateCommandAction(_: CommandActionState, formData: FormData): Promise<CommandActionState> {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const id = String(formData.get("id") ?? "");
  const parsed = commandSchema.safeParse({
    title: formData.get("title"),
    tags: formData.getAll("tags"),
    sqlCode: formData.get("sqlCode"),
    actorName: formData.get("actorName"),
  });

  if (!id) {
    return { ok: false, message: "Comando inválido." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await updateCommand(id, {
    title: parsed.data.title,
    tags: parsed.data.tags,
    sqlCode: parsed.data.sqlCode,
    updatedBy: parsed.data.actorName,
  });

  revalidatePath("/dashboard");
  revalidatePath("/commands");
  revalidatePath(`/commands/${id}`);
  revalidatePath("/logs");
  redirect(`/commands/${id}`);
}

export async function deleteCommandWithStateAction(
  _: CommandActionState,
  formData: FormData,
): Promise<CommandActionState> {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const id = String(formData.get("id") ?? "");
  const actor = actorNameSchema.safeParse(formData.get("actorName"));
  if (!id) return { ok: false, message: "Comando inválido." };
  if (!actor.success) {
    return {
      ok: false,
      message: "Informe seu nome antes de excluir.",
      errors: { actorName: actor.error.flatten().formErrors },
    };
  }

  await deleteCommand(id, actor.data);
  revalidatePath("/dashboard");
  revalidatePath("/commands");
  revalidatePath("/logs");
  redirect("/commands");
}
