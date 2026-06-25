"use client";

import { CommandCard } from "@/components/command-card";
import { useFavorites } from "@/hooks/useFavorites";
import type { Command } from "@/db/schema";

export function FavoritesList({ commands }: { commands: Command[] }) {
  const { favorites } = useFavorites();
  const filtered = commands.filter((command) => favorites.includes(command.id));

  if (filtered.length === 0) {
    return <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum comando favoritado.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((command) => (
        <CommandCard key={command.id} command={command} />
      ))}
    </div>
  );
}
