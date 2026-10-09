import Link from "next/link";
import { getObraAtiva } from "@/lib/obra";
import { getDashboardData } from "@/lib/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format";
import { OrcamentoPorGrupoChart, QqpPorStatusChart } from "@/components/dashboard/DashboardCharts";
import { AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const obra = await getObraAtiva();

  if (!obra) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Nenhuma obra cadastrada ainda.</p>
        <Button
          render={<Link href="/administracao/obras" />}
          nativeButton={false}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          Cadastrar a primeira obra
        </Button>
      </div>
    );
  }

  const dados = await getDashboardData(obra.id);

  if (!dados) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">{obra.nome} ainda não tem orçamento importado.</p>
        <p className="text-sm text-muted-foreground">
          Cadastre uma revisão orçamentária executiva para esta obra para ver o dashboard.
        </p>
      </div>
    );
  }

  const percentualConciliado =
    dados.totalTarefas === 0 ? 0 : ((dados.totalTarefas - dados.tarefasSemDePara) / dados.totalTarefas) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{obra.nome}</h1>
        <p className="text-sm text-muted-foreground">Código {obra.codigo} · Visão gerencial</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento executivo total
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-700">
            {formatCurrency(dados.totalExecutivo)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total solicitado em QQPs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(dados.totalSolicitado)}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">QQPs criados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{dados.qtdQqps}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conciliação DE-PARA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatPercent(percentualConciliado)}</div>
            {dados.tarefasSemDePara > 0 && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {dados.tarefasSemDePara} tarefa(s) sem apropriação RM
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orçamento por grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <OrcamentoPorGrupoChart data={dados.porGrupo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QQPs por status</CardTitle>
          </CardHeader>
          <CardContent>
            <QqpPorStatusChart data={dados.porStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
