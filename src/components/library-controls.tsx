"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const filters = [
  { value: "all", label: "Todos" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlserver", label: "SQL Server" },
];

export function LibraryControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();
  const activeType = searchParams.get("type") ?? "all";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      next.delete("page");

      const current = searchParams.toString();
      const target = next.toString();
      if (target !== current) {
        startTransition(() => router.push(target ? `/commands?${target}` : "/commands"));
      }
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [query, router, searchParams]);

  function setFilter(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") next.delete("type");
    else next.set("type", value);
    next.delete("page");
    const target = next.toString();
    router.push(target ? `/commands?${target}` : "/commands");
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por título" className="pl-9" />
      </div>
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilter(filter.value)}
            className={cn((activeType === filter.value || (!searchParams.get("type") && filter.value === "all")) && "border-primary bg-accent")}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
