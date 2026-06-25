import * as React from "react";
import { Suspense } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Suspense>
            <Topbar />
          </Suspense>
          <MobileNav />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
