"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  COMMAND_IMPORT_STORAGE_KEY,
  MAX_COMMAND_FILE_SIZE,
  parseCommandFile,
} from "@/lib/command-import";

export function ImportCommandButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (file.size > MAX_COMMAND_FILE_SIZE) {
      toast.error("O arquivo deve ter no máximo 1 MB.");
      return;
    }

    setReading(true);

    try {
      const content = await file.text();
      const draft = parseCommandFile(file.name, content);
      const importId = window.crypto.randomUUID();

      window.sessionStorage.setItem(`${COMMAND_IMPORT_STORAGE_KEY}:${importId}`, JSON.stringify(draft));
      router.push(`/commands/new?imported=${encodeURIComponent(importId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar o arquivo.");
      setReading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".sql,.txt,.json,application/json,text/plain,application/sql"
        onChange={handleFile}
        className="sr-only"
        aria-label="Selecionar arquivo de comando"
      />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={reading}>
        {reading ? <Loader2 className="animate-spin" /> : <FileUp />}
        {reading ? "Lendo arquivo" : "Importar arquivo"}
      </Button>
    </>
  );
}
