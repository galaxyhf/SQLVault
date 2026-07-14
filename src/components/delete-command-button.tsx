"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCommandWithStateAction, type CommandActionState } from "@/actions/commands";
import { useLocalIdentity } from "@/hooks/useLocalIdentity";

const initialState: CommandActionState = { ok: false };

export function DeleteCommandButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCommandWithStateAction, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { name } = useLocalIdentity();

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border-t pt-8">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="actorName" value={name} />
      <p className="text-xs text-muted-foreground">A exclusão ficará registrada com o nome informado acima.</p>
      {state.errors?.actorName ? <p className="text-sm text-destructive">{state.errors.actorName[0]}</p> : null}
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="button" variant="destructive" disabled={pending} onClick={() => setConfirmOpen(true)}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir comando
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir este comando?"
        description="Esta ação não pode ser desfeita. Uma cópia do comando removido será mantida na auditoria."
        confirmLabel="Excluir comando"
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
