"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const userChangedQuery = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!userChangedQuery.current) return;
    const timeout = window.setTimeout(() => {
      userChangedQuery.current = false;
      const next = new URLSearchParams();
      if (query.trim()) {
        next.set("q", query.trim());
      }

      const search = next.toString();
      const target = search ? `/commands?${search}` : "/commands";
      const currentPath = pathname === "/commands" && searchParams.toString() ? `${pathname}?${searchParams}` : pathname;

      if (target !== currentPath) {
        startTransition(() => {
          router.push(target);
        });
      }
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    userChangedQuery.current = true;
    setQuery(event.target.value);
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-center gap-3 px-4 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold lg:hidden">
          <BookOpen className="size-4 text-primary" />
          SQLVault
        </Link>

        <div className="relative min-w-0 flex-1 lg:max-w-3xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Pesquisar comandos"
            className="pl-9"
          />
        </div>

        <Button asChild className="hidden sm:inline-flex">
          <Link href="/commands/new">
            <Plus className="size-4" />
            Novo
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
