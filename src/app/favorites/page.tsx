import { FavoritesList } from "@/components/favorites-list";
import { listCommands } from "@/db";

export default async function FavoritesPage() {
  const result = await listCommands({ pageSize: 500 });

  return <FavoritesList commands={result.commands} />;
}
