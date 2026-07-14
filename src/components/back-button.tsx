import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = "Voltar" }: BackButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
      <Link href={href}>
        <ArrowLeft />
        {label}
      </Link>
    </Button>
  );
}
