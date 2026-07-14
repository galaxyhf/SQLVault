"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CommandCard } from "@/components/command-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Command, DatabaseType } from "@/db/schema";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { value: "all", label: "Todos" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlserver", label: "SQL Server" },
] as const;

const pageSize = 9;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getInitialType(value?: string): DatabaseType | "all" {
  return value === "postgresql" || value === "sqlserver" ? value : "all";
}

type CommandsLibraryProps = {
  commands: Command[];
  initialQuery?: string;
  initialDatabaseType?: string;
  initialPage?: number;
};

export function CommandsLibrary({ commands, initialQuery = "", initialDatabaseType, initialPage = 1 }: CommandsLibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [databaseType, setDatabaseType] = useState<DatabaseType | "all">(getInitialType(initialDatabaseType));
  const [page, setPage] = useState(Math.max(initialPage, 1));

  const filteredCommands = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());

    return commands.filter((command) => {
      const searchableContent = normalizeSearchText(`${command.title}\n${command.sqlCode}`);
      const matchesQuery = normalizedQuery ? searchableContent.includes(normalizedQuery) : true;
      const matchesType = databaseType === "all" ? true : command.databaseType === databaseType;

      return matchesQuery && matchesType;
    });
  }, [commands, databaseType, query]);

  const pageCount = Math.max(Math.ceil(filteredCommands.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const visibleCommands = filteredCommands.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateFilter(value: DatabaseType | "all") {
    setDatabaseType(value);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pesquise, copie e favorite comandos SQL.</p>
        </div>
        <Button asChild>
          <Link href="/commands/new">
            <Plus className="size-4" />
            Novo comando
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Pesquisar por título ou trecho do SQL"
            aria-label="Pesquisar comandos por título ou trecho do SQL"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateFilter(filter.value)}
              className={cn(databaseType === filter.value && "border-primary bg-accent")}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {visibleCommands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCommands.map((command) => (
            <CommandCard key={command.id} command={command} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum comando encontrado.</p>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </div>
  );
}
