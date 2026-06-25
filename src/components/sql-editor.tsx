import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const keywordPattern =
  /\b(select|from|where|join|inner|left|right|full|outer|on|group|by|order|limit|offset|insert|into|values|update|set|delete|create|alter|drop|table|index|view|with|as|and|or|not|null|is|in|exists|case|when|then|else|end|distinct|having|union|all|top)\b/gi;

function highlight(line: string) {
  const escaped = line
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped
    .replace(/(--.*)$/g, '<span class="text-muted-foreground">$1</span>')
    .replace(/('[^']*')/g, '<span class="text-emerald-300">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-amber-300">$1</span>')
    .replace(keywordPattern, '<span class="text-primary">$1</span>');
}

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
                <span className="px-4" dangerouslySetInnerHTML={{ __html: highlight(line) || "&nbsp;" }} />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
