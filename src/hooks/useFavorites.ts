"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "sqlvault:favorites";

type FavoritesPayload = {
  favorites: string[];
};

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoritesPayload;
    return Array.isArray(parsed.favorites) ? parsed.favorites.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites }));
  window.dispatchEvent(new Event("sqlvault:favorites-change"));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sqlvault:favorites-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sqlvault:favorites-change", callback);
  };
}

function getSnapshot() {
  return readFavorites().join("|");
}

export function useFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const favorites = useMemo(() => (snapshot ? snapshot.split("|").filter(Boolean) : []), [snapshot]);

  const addFavorite = useCallback((id: string) => {
    const current = readFavorites();
    const next = current.includes(id) ? current : [...current, id];
    writeFavorites(next);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    writeFavorites(readFavorites().filter((favorite) => favorite !== id));
  }, []);

  const setFavoritesOrder = useCallback((ids: string[]) => {
    writeFavorites(Array.from(new Set(ids.filter(Boolean))));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      setFavoritesOrder,
    }),
    [addFavorite, favorites, isFavorite, removeFavorite, setFavoritesOrder],
  );
}
