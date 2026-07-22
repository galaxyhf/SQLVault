"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, FileCheck2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCommandAction, updateCommandAction, type CommandActionState } from "@/actions/commands";
import { SqlCodeTextarea } from "@/components/sql-code-textarea";
import type { Command, CommandTag } from "@/db/schema";
import { useLocalIdentity } from "@/hooks/useLocalIdentity";
import {
  COMMAND_IMPORT_STORAGE_KEY,
  isImportedCommandDraft,
  type ImportedCommandDraft,
} from "@/lib/command-import";
import { tagLabel } from "@/lib/utils";

const initialState: CommandActionState = { ok: false };
const tagOptions: CommandTag[] = ["conferencia", "conversao", "geral"];

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
  const [selectedTags, setSelectedTags] = useState<CommandTag[]>(importedDraft?.tags ?? command?.tags ?? ["geral"]);
  const tagDropdownRef = useRef<HTMLDetailsElement>(null);
  const { name, setName } = useLocalIdentity();

  useEffect(() => {
    function closeTagDropdown(event: PointerEvent) {
      const dropdown = tagDropdownRef.current;
      if (!dropdown?.open || !(event.target instanceof Node) || dropdown.contains(event.target)) return;

      dropdown.removeAttribute("open");
    }

    document.addEventListener("pointerdown", closeTagDropdown);
    return () => document.removeEventListener("pointerdown", closeTagDropdown);
  }, []);

  function toggleTag(tag: CommandTag) {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag) ? currentTags.filter((currentTag) => currentTag !== tag) : [...currentTags, tag],
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => {
        if (storageKey) window.sessionStorage.removeItem(storageKey);
      }}
      className="max-w-4xl space-y-8"
    >
      {command ? <input type="hidden" name="id" value={command.id} /> : null}

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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Tags</legend>
        <p className="text-xs text-muted-foreground">Selecione uma ou mais tags para classificar o comando.</p>
        <details ref={tagDropdownRef} className="group relative max-w-md">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className={selectedTags.length > 0 ? "text-foreground" : "text-muted-foreground"}>
              {selectedTags.length > 0 ? selectedTags.map(tagLabel).join(", ") : "Selecionar tags"}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            {tagOptions.map((tag) => (
              <label
                key={tag}
                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={tag}
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="size-4 accent-primary"
                />
                <span>{tagLabel(tag)}</span>
              </label>
            ))}
          </div>
        </details>
        {state.errors?.tags ? <p className="text-sm text-destructive">{state.errors.tags[0]}</p> : null}
      </fieldset>

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
