import type { CommandTag } from "@/db/schema";

export const COMMAND_IMPORT_STORAGE_KEY = "sqlvault:command-import";
export const MAX_COMMAND_FILE_SIZE = 1024 * 1024;

export type ImportedCommandDraft = {
  title: string;
  tags: CommandTag[];
  sqlCode: string;
  fileName: string;
};

function titleFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) return "Comando importado";

  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1);
}

function parseTag(value: unknown): CommandTag {
  if (typeof value !== "string") throw new Error("As tags precisam estar em formato de texto.");

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

  if (normalized === "conferencia" || normalized === "conversao" || normalized === "geral") return normalized;

  throw new Error("Tag inválida. Use Conferência, Conversão ou Geral.");
}

function parseTags(value: unknown): CommandTag[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const tags = [...new Set(values.map(parseTag))];

  if (tags.length === 0) throw new Error("Selecione pelo menos uma tag.");

  return tags;
}

function validateDraft(draft: ImportedCommandDraft) {
  const title = draft.title.trim();
  const sqlCode = draft.sqlCode.trim();

  if (title.length < 2) throw new Error("O arquivo precisa ter um título com pelo menos 2 caracteres.");
  if (title.length > 120) throw new Error("O título importado deve ter no máximo 120 caracteres.");
  if (sqlCode.length < 5) throw new Error("O arquivo não contém um comando SQL válido.");

  return { ...draft, title, sqlCode };
}

function parseJsonFile(fileName: string, content: string): ImportedCommandDraft {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("O arquivo JSON não é válido.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("O JSON precisa conter title, tags e sqlCode.");
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.title !== "string" || typeof data.sqlCode !== "string") {
    throw new Error("O JSON precisa conter title e sqlCode em formato de texto.");
  }

  return validateDraft({
    title: data.title,
    tags: parseTags(data.tags),
    sqlCode: data.sqlCode,
    fileName,
  });
}

function parseSqlFile(fileName: string, content: string): ImportedCommandDraft {
  const lines = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const sqlLines: string[] = [];
  let title: string | undefined;
  let tags: CommandTag[] = ["geral"];
  let reachedSql = false;

  for (const line of lines) {
    if (!reachedSql) {
      const metadata = line.match(/^\s*--\s*(title|titulo|título|tag|tags)\s*:\s*(.*?)\s*$/i);

      if (metadata) {
        const key = metadata[1].toLowerCase();
        const value = metadata[2];

        if (key === "title" || key === "titulo" || key === "título") title = value;
        else tags = parseTags(value);

        continue;
      }

      if (!line.trim()) continue;
      reachedSql = true;
    }

    sqlLines.push(line);
  }

  return validateDraft({
    title: title ?? titleFromFileName(fileName),
    tags,
    sqlCode: sqlLines.join("\n"),
    fileName,
  });
}

export function parseCommandFile(fileName: string, content: string): ImportedCommandDraft {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "json") return parseJsonFile(fileName, content);
  if (extension === "sql" || extension === "txt") return parseSqlFile(fileName, content);

  throw new Error("Formato não aceito. Selecione um arquivo .sql, .txt ou .json.");
}

export function isImportedCommandDraft(value: unknown): value is ImportedCommandDraft {
  if (!value || typeof value !== "object") return false;

  const draft = value as Partial<ImportedCommandDraft>;

  return (
    typeof draft.title === "string" &&
    typeof draft.sqlCode === "string" &&
    typeof draft.fileName === "string" &&
    Array.isArray(draft.tags) &&
    draft.tags.length > 0 &&
    draft.tags.every((tag) => tag === "conferencia" || tag === "conversao" || tag === "geral")
  );
}
