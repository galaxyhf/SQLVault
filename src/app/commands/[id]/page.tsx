import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getCommandById } from "@/db";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { CommandTags } from "@/components/command-tags";
import { CommandMetadata } from "@/components/command-metadata";
import { SqlEditor } from "@/components/sql-editor";

type CommandPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CommandPage({ params }: CommandPageProps) {
  const { id } = await params;
  const command = await getCommandById(id);

  if (!command) notFound();

  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-4">
        <BackButton href="/commands" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">{command.title}</h1>
            <CommandTags tags={command.tags} />
            <CommandMetadata command={command} showUpdate />
          </div>
          <Button asChild variant="outline">
            <Link href={`/commands/${command.id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <SqlEditor sql={command.sqlCode} />
    </div>
  );
}
