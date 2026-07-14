import type { Metadata } from "next";
import { AuditLogsPanel } from "@/components/audit-logs-panel";

export const metadata: Metadata = {
  title: "Auditoria | SQLVault",
};

export default function AuditLogsPage() {
  return <AuditLogsPanel />;
}
