"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id }: { id: string }) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const active = isFavorite(id);

  function toggleFavorite() {
    if (active) {
      removeFavorite(id);
      toast.message("Favorito removido.");
      return;
    }

    addFavorite(id);
    toast.success("Favorito salvo.");
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleFavorite}>
      <Star className={cn("size-4", active && "fill-primary text-primary")} />
      Favoritar
    </Button>
  );
}
