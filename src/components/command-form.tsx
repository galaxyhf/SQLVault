"use client";

import { useActionState, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCommandAction, updateCommandAction, type CommandActionState } from "@/actions/commands";
import { SqlCodeTextarea } from "@/components/sql-code-textarea";
import type { Command, DatabaseType } from "@/db/schema";
import { useLocalIdentity } from "@/hooks/useLocalIdentity";
import { cn, databaseLabel } from "@/lib/utils";

const initialState: CommandActionState = { ok: false };

export function CommandForm({ command }: { command?: Command }) {
  const action = command ? updateCommandAction : saveCommandAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [databaseType, setDatabaseType] = useState<DatabaseType>(command?.databaseType ?? "postgresql");
  const { name, setName } = useLocalIdentity();

  return (
    <form action={formAction} className="max-w-4xl space-y-8">
      {command ? <input type="hidden" name="id" value={command.id} /> : null}
      <input type="hidden" name="databaseType" value={databaseType} />

      <div className="space-y-2">
        <label htmlFor="actorName" className="text-sm font-medium">
          Seu nome
        </label>
        <Input
          id="actorName"
          name="actorName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Caio Silva"
          autoComplete="name"
        />
        <p className="text-xs text-muted-foreground">
          O nome será lembrado neste navegador e registrado {command ? "nesta edição" : "no comando"}.
        </p>
        {state.errors?.actorName ? <p className="text-sm text-destructive">{state.errors.actorName[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <Input id="title" name="title" defaultValue={command?.title} placeholder="Ex: Consultar locks ativos" />
        {state.errors?.title ? <p className="text-sm text-destructive">{state.errors.title[0]}</p> : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Banco</p>
        <div className="flex flex-wrap gap-2">
          {(["postgresql", "sqlserver"] as DatabaseType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDatabaseType(type)}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors",
                databaseType === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:border-primary/60",
              )}
            >
              {databaseLabel(type)}
            </button>
          ))}
        </div>
        {state.errors?.databaseType ? <p className="text-sm text-destructive">{state.errors.databaseType[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="sqlCode" className="sr-only">
          SQL
        </label>
        <SqlCodeTextarea
          id="sqlCode"
          name="sqlCode"
          defaultValue={command?.sqlCode}
          placeholder="SELECT * FROM ..."
        />
        {state.errors?.sqlCode ? <p className="text-sm text-destructive">{state.errors.sqlCode[0]}</p> : null}
      </div>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar
      </Button>
    </form>
  );
}
