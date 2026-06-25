import { Badge } from "@/components/ui/badge";
import type { DatabaseType } from "@/db/schema";
import { databaseLabel } from "@/lib/utils";

export function DatabaseBadge({ databaseType }: { databaseType: DatabaseType }) {
  return <Badge variant={databaseType === "postgresql" ? "default" : "secondary"}>{databaseLabel(databaseType)}</Badge>;
}
