import { CommandsLibrary } from "@/components/commands-library";
import { listCommands } from "@/db";

type CommandsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CommandsPage({ searchParams }: CommandsPageProps) {
  const params = await searchParams;
  const result = await listCommands({ pageSize: 500 });

  return (
    <CommandsLibrary
      commands={result.commands}
      initialQuery={first(params.q)}
      initialTag={first(params.tag)}
      initialPage={Number(first(params.page) ?? 1) || 1}
    />
  );
}
