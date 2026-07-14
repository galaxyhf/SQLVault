"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sqlvault:identity";
const CHANGE_EVENT = "sqlvault:identity-change";

type IdentityPayload = {
  name: string;
};

function readName() {
  if (typeof window === "undefined") return "";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";

    const parsed = JSON.parse(raw) as IdentityPayload;
    return typeof parsed.name === "string" ? parsed.name : "";
  } catch {
    return "";
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

export function useLocalIdentity() {
  const name = useSyncExternalStore(subscribe, readName, () => "");

  const setName = useCallback((nextName: string) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: nextName }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { name, setName };
}
