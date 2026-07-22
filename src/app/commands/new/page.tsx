import { BackButton } from "@/components/back-button";
import { CommandForm } from "@/components/command-form";

type NewCommandPageProps = {
  searchParams: Promise<{ imported?: string }>;
};

export default async function NewCommandPage({ searchParams }: NewCommandPageProps) {
  const { imported } = await searchParams;
  const importId = imported && /^[0-9a-f-]{36}$/i.test(imported) ? imported : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackButton href="/commands" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novo comando</h1>
          <p className="mt-2 text-sm text-muted-foreground">Salve uma consulta de PostgreSQL ou SQL Server.</p>
        </div>
      </div>
      <CommandForm importId={importId} />
    </div>
  );
}
