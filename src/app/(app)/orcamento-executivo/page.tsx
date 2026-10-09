import { getObraAtiva, getRevisaoAtiva } from "@/lib/obra";
import { getOrcamentoExecutivoTree } from "@/lib/services/orcamento";
import { OrcamentoTree } from "@/components/orcamento/OrcamentoTree";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function OrcamentoExecutivoPage() {
  const obra = await getObraAtiva();
  if (!obra) {
    return <p className="text-sm text-muted-foreground">Nenhuma obra selecionada.</p>;
  }

  const revisao = await getRevisaoAtiva(obra.id, "EXECUTIVO");
  if (!revisao) {
    return <p className="text-sm text-muted-foreground">Esta obra ainda não tem orçamento executivo importado.</p>;
  }

  const grupos = await getOrcamentoExecutivoTree(revisao.id);
  const totalGeral = grupos.reduce((acc, g) => acc + g.totalGrupo, 0);
  const totalTarefas = grupos.reduce((acc, g) => acc + g.tarefas.length, 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Orçamento Executivo</h1>
          <p className="text-sm text-muted-foreground">
            {obra.nome} · Revisão {revisao.numeroRevisao} · {totalTarefas} tarefas
          </p>
        </div>
        <Card className="px-4 py-2">
          <CardContent className="p-0 text-right">
            <p className="text-xs text-muted-foreground">Total do orçamento</p>
            <p className="text-lg font-semibold text-emerald-700">{formatCurrency(totalGeral)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 overflow-hidden p-0">
        <OrcamentoTree grupos={grupos} />
      </Card>
    </div>
  );
}
