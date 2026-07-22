import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { CommandForm } from "@/components/command-form";
import { DeleteCommandButton } from "@/components/delete-command-button";
import { getCommandById } from "@/db";

type EditCommandPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCommandPage({ params }: EditCommandPageProps) {
  const { id } = await params;
  const command = await getCommandById(id);

  if (!command) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackButton href={`/commands/${command.id}`} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar comando</h1>
          <p className="mt-2 text-sm text-muted-foreground">Atualize o título, as tags ou o SQL.</p>
        </div>
      </div>
      <CommandForm command={command} />
      <DeleteCommandButton id={command.id} />
    </div>
  );
}
