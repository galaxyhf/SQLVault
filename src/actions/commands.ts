"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCommand, deleteCommand, hasDatabaseUrl, updateCommand } from "@/db";
import { commandSchema } from "@/lib/validators";

export type CommandActionState = {
  ok: boolean;
  message?: string;
  errors?: {
    title?: string[];
    databaseType?: string[];
    sqlCode?: string[];
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
    databaseType: formData.get("databaseType"),
    sqlCode: formData.get("sqlCode"),
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
    databaseType: parsed.data.databaseType,
    sqlCode: parsed.data.sqlCode,
  });

  revalidatePath("/dashboard");
  revalidatePath("/commands");
  redirect(`/commands/${command.id}`);
}

export async function updateCommandAction(_: CommandActionState, formData: FormData): Promise<CommandActionState> {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const id = String(formData.get("id") ?? "");
  const parsed = commandSchema.safeParse({
    title: formData.get("title"),
    databaseType: formData.get("databaseType"),
    sqlCode: formData.get("sqlCode"),
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
    databaseType: parsed.data.databaseType,
    sqlCode: parsed.data.sqlCode,
  });

  revalidatePath("/dashboard");
  revalidatePath("/commands");
  revalidatePath(`/commands/${id}`);
  redirect(`/commands/${id}`);
}

export async function deleteCommandAction(formData: FormData) {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Comando inválido." };

  await deleteCommand(id);
  revalidatePath("/dashboard");
  revalidatePath("/commands");
  redirect("/commands");
}

export async function deleteCommandWithStateAction(
  _: CommandActionState,
  formData: FormData,
): Promise<CommandActionState> {
  const databaseError = requireDatabase();
  if (databaseError) return databaseError;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Comando inválido." };

  await deleteCommand(id);
  revalidatePath("/dashboard");
  revalidatePath("/commands");
  redirect("/commands");
}
