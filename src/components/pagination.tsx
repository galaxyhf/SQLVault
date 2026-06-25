import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function pageHref(searchParams: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value) {
      params.set(key, value);
    }
  });
  params.set("page", String(page));
  return `/commands?${params.toString()}`;
}

export function Pagination({
  page,
  pageCount,
  searchParams,
}: {
  page: number;
  pageCount: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-6">
      <p className="text-sm text-muted-foreground">
        Página {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
          <Link href={pageHref(searchParams, Math.max(page - 1, 1))}>
            <ChevronLeft className="size-4" />
            Anterior
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}>
          <Link href={pageHref(searchParams, Math.min(page + 1, pageCount))}>
            Próxima
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
