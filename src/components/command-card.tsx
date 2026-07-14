import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { CommandMetadata } from "@/components/command-metadata";
import { DatabaseBadge } from "@/components/database-badge";
import { FavoriteButton } from "@/components/favorite-button";
import type { Command } from "@/db/schema";

export function CommandCard({ command }: { command: Command }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="line-clamp-2 leading-snug">{command.title}</CardTitle>
          <DatabaseBadge databaseType={command.databaseType} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CommandMetadata command={command} />
        <div className="flex items-start gap-2">
          <pre className="line-clamp-3 min-w-0 flex-1 overflow-hidden whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">{command.sqlCode}</pre>
          <CopyButton value={command.sqlCode} iconOnly />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/commands/${command.id}`}>
              <ExternalLink className="size-4" />
              Abrir
            </Link>
          </Button>
          <FavoriteButton id={command.id} iconOnly />
          <Button asChild variant="ghost" size="icon" aria-label="Editar comando">
            <Link href={`/commands/${command.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
