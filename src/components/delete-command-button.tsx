"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCommandWithStateAction, type CommandActionState } from "@/actions/commands";

const initialState: CommandActionState = { ok: false };

export function DeleteCommandButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCommandWithStateAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir este comando?")) {
          event.preventDefault();
        }
      }}
      className="space-y-3 border-t pt-8"
    >
      <input type="hidden" name="id" value={id} />
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir comando
      </Button>
    </form>
  );
}
