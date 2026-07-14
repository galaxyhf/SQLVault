"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCommandWithStateAction, type CommandActionState } from "@/actions/commands";
import { useLocalIdentity } from "@/hooks/useLocalIdentity";

const initialState: CommandActionState = { ok: false };

export function DeleteCommandButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCommandWithStateAction, initialState);
  const { name, setName } = useLocalIdentity();

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
      <div className="max-w-sm space-y-2">
        <label htmlFor="deleteActorName" className="text-sm font-medium">
          Seu nome
        </label>
        <Input
          id="deleteActorName"
          name="actorName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Caio Silva"
          autoComplete="name"
        />
        <p className="text-xs text-muted-foreground">A exclusão ficará registrada na auditoria.</p>
        {state.errors?.actorName ? <p className="text-sm text-destructive">{state.errors.actorName[0]}</p> : null}
      </div>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir comando
      </Button>
    </form>
  );
}
