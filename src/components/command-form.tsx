"use client";

import { useActionState, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { FileCheck2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCommandAction, updateCommandAction, type CommandActionState } from "@/actions/commands";
import { SqlCodeTextarea } from "@/components/sql-code-textarea";
import type { Command, DatabaseType } from "@/db/schema";
import { useLocalIdentity } from "@/hooks/useLocalIdentity";
import {
  COMMAND_IMPORT_STORAGE_KEY,
  isImportedCommandDraft,
  type ImportedCommandDraft,
} from "@/lib/command-import";
import { cn, databaseLabel } from "@/lib/utils";

const initialState: CommandActionState = { ok: false };

function subscribeToImportDraft() {
  return () => undefined;
}

function useImportedCommandDraft(importId?: string) {
  const storageKey = importId ? `${COMMAND_IMPORT_STORAGE_KEY}:${importId}` : undefined;
  const getSnapshot = useCallback(
    () => (storageKey ? window.sessionStorage.getItem(storageKey) ?? "" : ""),
    [storageKey],
  );
  const rawDraft = useSyncExternalStore(subscribeToImportDraft, getSnapshot, () => "");

  const importedDraft = useMemo(() => {
    if (!rawDraft) return null;

    try {
      const draft: unknown = JSON.parse(rawDraft);
      return isImportedCommandDraft(draft) ? draft : null;
    } catch {
      return null;
    }
  }, [rawDraft]);

  return { importedDraft, storageKey };
}

export function CommandForm({ command, importId }: { command?: Command; importId?: string }) {
  const { importedDraft, storageKey } = useImportedCommandDraft(command ? undefined : importId);

  return (
    <CommandFormContent
      key={importedDraft ? `${importId}-${importedDraft.fileName}` : "default-command-form"}
      command={command}
      importedDraft={importedDraft}
      storageKey={storageKey}
    />
  );
}

type CommandFormContentProps = {
  command?: Command;
  importedDraft: ImportedCommandDraft | null;
  storageKey?: string;
};

function CommandFormContent({ command, importedDraft, storageKey }: CommandFormContentProps) {
  const action = command ? updateCommandAction : saveCommandAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [databaseType, setDatabaseType] = useState<DatabaseType>(
    importedDraft?.databaseType ?? command?.databaseType ?? "postgresql",
  );
  const { name, setName } = useLocalIdentity();

  return (
    <form
      action={formAction}
      onSubmit={() => {
        if (storageKey) window.sessionStorage.removeItem(storageKey);
      }}
      className="max-w-4xl space-y-8"
    >
      {command ? <input type="hidden" name="id" value={command.id} /> : null}
      <input type="hidden" name="databaseType" value={databaseType} />

      {importedDraft ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-accent/50 px-4 py-3 text-sm text-accent-foreground">
          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Arquivo importado</p>
            <p className="mt-1 text-muted-foreground">
              {importedDraft.fileName} foi carregado. Revise os dados antes de salvar.
            </p>
          </div>
        </div>
      ) : null}

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
        <Input
          key={importedDraft ? `imported-title-${importedDraft.fileName}` : "default-title"}
          id="title"
          name="title"
          defaultValue={importedDraft?.title ?? command?.title}
          placeholder="Ex: Consultar locks ativos"
        />
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
          key={importedDraft ? `imported-sql-${importedDraft.fileName}` : "default-sql"}
          id="sqlCode"
          name="sqlCode"
          defaultValue={importedDraft?.sqlCode ?? command?.sqlCode}
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
