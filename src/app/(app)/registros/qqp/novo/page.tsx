import { getObraAtiva } from "@/lib/obra";
import { criarRegistroQqp } from "@/app/actions/qqp-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function NovoQqpPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const obra = await getObraAtiva();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Novo QQP — Identificação</h1>
        <p className="text-sm text-muted-foreground">
          Obra: {obra ? `${obra.codigo} — ${obra.nome}` : "nenhuma obra selecionada"}
        </p>
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={criarRegistroQqp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input id="descricao" name="descricao" required placeholder="Ex.: Contratação de terraplenagem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Textarea id="objetivo" name="objetivo" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumoObjeto">Resumo do objeto</Label>
              <Textarea id="resumoObjeto" name="resumoObjeto" rows={2} />
            </div>
            <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800" disabled={!obra}>
              Criar e continuar seleção de itens
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
