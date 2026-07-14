"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FileClock, Loader2, LockKeyhole, LogOut, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { unlockAuditLogsAction, type AuditAccessState, type AuditLogEntry } from "@/actions/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AuditAction, CommandAuditSnapshot } from "@/db/schema";
import { cn, databaseLabel, formatDateTime } from "@/lib/utils";

const initialState: AuditAccessState = { ok: false };

const actionInfo: Record<
  AuditAction,
  { label: string; description: string; icon: typeof Plus; iconClassName: string; labelClassName: string }
> = {
  command_created: {
    label: "Comando criado",
    description: "adicionou um novo comando",
    icon: Plus,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    labelClassName: "text-emerald-700 dark:text-emerald-400",
  },
  command_updated: {
    label: "Comando atualizado",
    description: "atualizou o comando",
    icon: Pencil,
    iconClassName: "bg-primary/10 text-primary",
    labelClassName: "text-primary",
  },
  command_deleted: {
    label: "Comando excluído",
    description: "excluiu o comando",
    icon: Trash2,
    iconClassName: "bg-destructive/10 text-destructive",
    labelClassName: "text-destructive",
  },
};

const fieldLabels: Record<keyof CommandAuditSnapshot, string> = {
  title: "Título",
  databaseType: "Banco",
  sqlCode: "SQL",
};

function formatValue(field: keyof CommandAuditSnapshot, value: string) {
  return field === "databaseType" ? databaseLabel(value as CommandAuditSnapshot["databaseType"]) : value;
}

function AuditValue({ field, value }: { field: keyof CommandAuditSnapshot; value: string }) {
  if (field === "sqlCode") {
    return (
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
        {value}
      </pre>
    );
  }

  return <p className="text-sm">{formatValue(field, value)}</p>;
}

function SnapshotDetails({ snapshot }: { snapshot: CommandAuditSnapshot }) {
  return (
    <div className="space-y-4">
      {(Object.keys(fieldLabels) as Array<keyof CommandAuditSnapshot>).map((field) => (
        <div key={field} className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{fieldLabels[field]}</p>
          <AuditValue field={field} value={snapshot[field]} />
        </div>
      ))}
    </div>
  );
}

function EventDetails({ entry }: { entry: AuditLogEntry }) {
  const { before, after, changedFields = [] } = entry.details;

  if (entry.action === "command_updated" && before && after) {
    return (
      <div className="space-y-5">
        {changedFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum conteúdo mudou; a tentativa de atualização foi registrada.</p>
        ) : (
          changedFields.map((field) => (
            <div key={field} className="space-y-2">
              <p className="text-sm font-medium">{fieldLabels[field]}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 rounded-md bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Antes</p>
                  <AuditValue field={field} value={before[field]} />
                </div>
                <div className="space-y-1.5 rounded-md bg-accent/60 p-3">
                  <p className="text-xs text-muted-foreground">Depois</p>
                  <AuditValue field={field} value={after[field]} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  const snapshot = entry.action === "command_created" ? after : before;
  return snapshot ? <SnapshotDetails snapshot={snapshot} /> : null;
}

function AuditList({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center">
        <FileClock className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-3 font-medium">Nenhum movimento registrado</p>
        <p className="mt-1 text-sm text-muted-foreground">Novas criações, atualizações e exclusões aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {entries.map((entry) => {
        const info = actionInfo[entry.action];
        const Icon = info.icon;

        return (
          <article key={entry.id} className="border-b p-4 transition-colors hover:bg-muted/25 last:border-b-0 md:p-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
                  info.iconClassName,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className={cn("text-sm font-semibold", info.labelClassName)}>{info.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{entry.actorName}</span> {info.description}{" "}
                      <span className="font-medium text-foreground">{entry.commandTitle}</span>.
                    </p>
                    {entry.details.imported ? (
                      <p className="mt-1 text-xs text-muted-foreground">Registro inicial importado ao ativar a auditoria.</p>
                    ) : null}
                  </div>
                  <time className="shrink-0 font-mono text-xs text-muted-foreground" dateTime={entry.createdAt}>
                    {formatDateTime(entry.createdAt)}
                  </time>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="size-3.5" />
                    {entry.actorName}
                  </span>
                  <span className="font-mono">ID {entry.commandId}</span>
                </div>

                <details className="mt-4 rounded-md border border-transparent bg-muted/35 p-3 transition-colors open:border-border open:bg-muted/50">
                  <summary className="cursor-pointer text-sm font-medium marker:text-muted-foreground">
                    Ver detalhes do movimento
                  </summary>
                  <div className="mt-4 border-t pt-4">
                    <EventDetails entry={entry} />
                  </div>
                </details>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AuditLogsPanel() {
  const [state, formAction, pending] = useActionState(unlockAuditLogsAction, initialState);

  if (!state.ok) {
    return (
      <div className="mx-auto max-w-md space-y-6 pt-8 md:pt-16">
        <div className="text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Auditoria protegida</h1>
          <p className="mt-2 text-sm text-muted-foreground">Informe a senha de administrador para consultar os movimentos do sistema.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="auditPassword" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="auditPassword"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </div>
              {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Acessar auditoria
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entries = state.entries ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <span className="text-sm font-medium">Acesso autorizado</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Histórico completo de criações, atualizações e exclusões de comandos.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <LogOut className="size-4" />
            Sair e bloquear
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 border-y py-3">
        <p className="text-sm text-muted-foreground">Movimentos registrados</p>
        <p className="font-mono text-sm font-medium">{entries.length}</p>
      </div>

      <AuditList entries={entries} />
    </div>
  );
}
