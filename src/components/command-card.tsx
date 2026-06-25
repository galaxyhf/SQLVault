import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
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
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/commands/${command.id}`}>
            <ExternalLink className="size-4" />
            Abrir
          </Link>
        </Button>
        <CopyButton value={command.sqlCode} />
        <FavoriteButton id={command.id} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/commands/${command.id}/edit`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
