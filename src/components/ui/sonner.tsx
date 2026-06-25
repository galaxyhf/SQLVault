"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return <Sonner position="bottom-right" toastOptions={{ className: "border-border bg-card text-card-foreground" }} />;
}
