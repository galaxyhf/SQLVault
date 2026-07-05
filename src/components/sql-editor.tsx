import { CopyButton } from "@/components/copy-button";
import { highlightSqlLine } from "@/lib/sql-highlight";
import { cn } from "@/lib/utils";

export function SqlEditor({ sql, className }: { sql: string; className?: string }) {
  const lines = sql.split("\n");

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">SQL</span>
        <CopyButton value={sql} />
      </div>
      <div className="max-h-[68vh] overflow-auto">
        <pre className="min-w-max p-0 font-mono text-sm leading-6">
          <code>
            {lines.map((line, index) => (
              <div key={`${index}-${line}`} className="grid grid-cols-[3.5rem_1fr]">
                <span className="select-none border-r bg-secondary/40 px-4 text-right text-muted-foreground">
                  {index + 1}
                </span>
                <span className="px-4" dangerouslySetInnerHTML={{ __html: highlightSqlLine(line) || "&nbsp;" }} />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
