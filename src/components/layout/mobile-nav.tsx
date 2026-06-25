"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/commands", label: "Biblioteca", icon: BookOpen },
  { href: "/favorites", label: "Favoritos", icon: Star },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-10 flex gap-2 overflow-x-auto border-b bg-background px-4 py-3 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground",
              active && "border-primary bg-accent text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
