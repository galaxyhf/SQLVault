import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Comando não encontrado</h1>
      <p className="text-sm text-muted-foreground">O item solicitado não existe ou foi removido.</p>
      <Button asChild>
        <Link href="/commands">Voltar para biblioteca</Link>
      </Button>
    </div>
  );
}
