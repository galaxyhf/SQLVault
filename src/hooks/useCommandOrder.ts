"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "sqlvault:command-order";
const CHANGE_EVENT = "sqlvault:command-order-change";

function readSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function parseOrder(snapshot: string) {
  if (!snapshot) return [];

  try {
    const parsed = JSON.parse(snapshot) as unknown;
    if (!Array.isArray(parsed)) return [];

    return Array.from(new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0)));
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useCommandOrder() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => "");
  const order = useMemo(() => parseOrder(snapshot), [snapshot]);

  const setOrder = useCallback((nextOrder: string[]) => {
    const uniqueOrder = Array.from(new Set(nextOrder.filter(Boolean)));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueOrder));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return useMemo(() => ({ order, setOrder }), [order, setOrder]);
}
