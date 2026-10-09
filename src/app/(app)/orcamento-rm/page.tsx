import { getObraAtiva, getRevisaoAtiva } from "@/lib/obra";
import { getOrcamentoRmTree } from "@/lib/services/orcamento-rm";
import { RmTree } from "@/components/orcamento/RmTree";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function OrcamentoRmPage() {
  const obra = await getObraAtiva();
  if (!obra) {
    return <p className="text-sm text-muted-foreground">Nenhuma obra selecionada.</p>;
  }

  const revisao = await getRevisaoAtiva(obra.id, "RM");
  if (!revisao) {
    return <p className="text-sm text-muted-foreground">Esta obra ainda não tem orçamento RM importado.</p>;
  }

  const nodes = await getOrcamentoRmTree(revisao.id);
  const totalGeral = nodes.reduce((acc, n) => acc + n.custoTotal, 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Orçamento RM (consolidado)</h1>
          <p className="text-sm text-muted-foreground">
            {obra.nome} · Revisão {revisao.numeroRevisao} · Consulta somente leitura
          </p>
        </div>
        <Card className="px-4 py-2">
          <CardContent className="p-0 text-right">
            <p className="text-xs text-muted-foreground">Total orçamento RM</p>
            <p className="text-lg font-semibold text-emerald-700">{formatCurrency(totalGeral)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 overflow-hidden p-0">
        <RmTree nodes={nodes} />
      </Card>
    </div>
  );
}
