import { ObraSelector } from "./ObraSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sair } from "@/app/login/actions";
import { listObras, getObraAtiva } from "@/lib/obra";
import { LogOut } from "lucide-react";

export async function TopBar({ userEmail }: { userEmail?: string | null }) {
  const [obras, obraAtiva] = await Promise.all([listObras(), getObraAtiva()]);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <ObraSelector obras={obras} obraAtivaId={obraAtiva?.id} />
        <Badge variant="outline" className="border-amber-400 text-amber-700">
          Dados de demonstração
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {userEmail && <span className="text-sm text-muted-foreground">{userEmail}</span>}
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
