import { FavoritesList } from "@/components/favorites-list";
import { listCommands } from "@/db";

export default async function FavoritesPage() {
  const result = await listCommands({ pageSize: 100 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favoritos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Comandos salvos apenas neste navegador.</p>
      </div>
      <FavoritesList commands={result.commands} />
    </div>
  );
}
