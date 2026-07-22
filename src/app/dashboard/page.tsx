import Link from "next/link";
import { Database, Plus, Rows3, Server } from "lucide-react";
import { getCommandStats, listLatestCommands } from "@/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandCard } from "@/components/command-card";
import { Button } from "@/components/ui/button";
import { ImportCommandButton } from "@/components/import-command-button";

export default async function DashboardPage() {
  const [stats, latestCommands] = await Promise.all([getCommandStats(), listLatestCommands(3)]);

  const cards = [
    { label: "Total de comandos", value: stats.total, icon: Rows3 },
    { label: "Total PostgreSQL", value: stats.postgresql, icon: Database },
    { label: "Total SQL Server", value: stats.sqlserver, icon: Server },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Resumo da biblioteca SQLVault.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportCommandButton />
          <Button asChild>
            <Link href="/commands/new">
              <Plus className="size-4" />
              Novo comando
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
                <Icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-mono text-3xl font-semibold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Últimos comandos</h2>
          <Link href="/commands" className="text-sm text-primary hover:underline">
            Ver biblioteca
          </Link>
        </div>

        {latestCommands.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestCommands.map((command) => (
              <CommandCard key={command.id} command={command} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum comando cadastrado.</p>
        )}
      </section>
    </div>
  );
}
