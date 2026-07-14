import { CalendarClock, UserRound } from "lucide-react";
import type { Command } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

type CommandMetadataProps = {
  command: Pick<Command, "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;
  showUpdate?: boolean;
};

export function CommandMetadata({ command, showUpdate = false }: CommandMetadataProps) {
  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="size-3.5" />
          Criado por {command.createdBy}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5" />
          {formatDateTime(command.createdAt)}
        </span>
      </div>

      {showUpdate && command.updatedBy ? (
        <p>
          Atualizado por {command.updatedBy} em {formatDateTime(command.updatedAt)}
        </p>
      ) : null}
    </div>
  );
}
