import { getObraAtiva } from "@/lib/obra";
import { getDeParaData } from "@/lib/services/depara";
import { DeParaExplorer } from "@/components/depara/DeParaExplorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export default async function DeParaPage() {
  const obra = await getObraAtiva();
  if (!obra) {
    return <p className="text-sm text-muted-foreground">Nenhuma obra selecionada.</p>;
  }

  const dados = await getDeParaData(obra.id);
  if (!dados) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta obra precisa ter orçamento executivo e orçamento RM importados para conciliar o DE-PARA.
      </p>
    );
  }

  const { indicadores } = dados;
  const diferencaNegativa = indicadores.diferencaAbsoluta < 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">DE-PARA Orçamentário</h1>
        <p className="text-sm text-muted-foreground">{obra.nome} · Executivo × RM</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total executivo</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatCurrency(indicadores.totalExecutivo)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total RM</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatCurrency(indicadores.totalRm)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Diferença</CardTitle>
          </CardHeader>
          <CardContent className={`text-lg font-semibold ${diferencaNegativa ? "text-red-600" : "text-amber-600"}`}>
            {formatCurrency(indicadores.diferencaAbsoluta)}
            {indicadores.diferencaPercentual !== null && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({formatPercent(indicadores.diferencaPercentual)})
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatPercent(indicadores.percentualConciliado)}</p>
            {indicadores.tarefasSemDePara > 0 && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" /> {indicadores.tarefasSemDePara} sem DE-PARA
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Diferenças podem decorrer de escopo, classificação ou revisão distintos entre as bases — não representam
        necessariamente um erro de cadastro.
      </p>

      <Card className="flex-1 overflow-hidden p-0">
        <DeParaExplorer executivas={dados.executivas} rms={dados.rms} />
      </Card>
    </div>
  );
}
