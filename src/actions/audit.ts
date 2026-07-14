"use server";

import { timingSafeEqual } from "node:crypto";
import { hasDatabaseUrl, listAuditLogs } from "@/db";
import type { AuditAction, AuditDetails } from "@/db/schema";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actorName: string;
  commandId: string;
  commandTitle: string;
  details: AuditDetails;
  createdAt: string;
};

export type AuditAccessState = {
  ok: boolean;
  message?: string;
  entries?: AuditLogEntry[];
};

function passwordMatches(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function unlockAuditLogsAction(_: AuditAccessState, formData: FormData): Promise<AuditAccessState> {
  const expectedPassword = process.env.SQLVAULT_ADMIN_PASSWORD;

  if (!expectedPassword) {
    return {
      ok: false,
      message: "Configure SQLVAULT_ADMIN_PASSWORD no ambiente para acessar a auditoria.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password, expectedPassword)) {
    return { ok: false, message: "Senha de administrador incorreta." };
  }

  if (!hasDatabaseUrl()) {
    return { ok: false, message: "Configure DATABASE_URL para carregar a auditoria." };
  }

  const logs = await listAuditLogs();

  return {
    ok: true,
    entries: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.actorName,
      commandId: log.commandId,
      commandTitle: log.commandTitle,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
