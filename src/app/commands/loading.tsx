import { Skeleton } from "@/components/ui/skeleton";

export default function CommandsLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-full max-w-lg" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
