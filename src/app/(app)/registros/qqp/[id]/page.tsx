import { notFound } from "next/navigation";
import Link from "next/link";
import { getQqpDetalhado } from "@/lib/services/qqp";
import { getOrcamentoExecutivoTree } from "@/lib/services/orcamento";
import { listModelosAtivos, listExportacoes } from "@/lib/services/modelo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelecaoPanel } from "@/components/qqp/SelecaoPanel";
import { QuantidadesPanel } from "@/components/qqp/QuantidadesPanel";
import { CabecasPanel } from "@/components/qqp/CabecasPanel";
import { RevisaoPanel } from "@/components/qqp/RevisaoPanel";
import { ExportacaoPanel } from "@/components/qqp/ExportacaoPanel";
import { STATUS_REGISTRO_LABEL } from "@/lib/status-labels";
import { ChevronLeft } from "lucide-react";

export default async function QqpDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qqp = await getQqpDetalhado(id);
  if (!qqp) notFound();

  const [grupos, modelos, exportacoes] = await Promise.all([
    getOrcamentoExecutivoTree(qqp.revisaoOrcamentoId),
    listModelosAtivos(),
    listExportacoes(qqp.registro.id),
  ]);
  const itensAdicionados = qqp.itens.map((i) => ({
    tarefaExecutivaId: i.tarefaExecutivaId,
    itemComposicaoId: i.itemComposicaoId,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/registros" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar para Registros
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-lg font-semibold">{qqp.registro.numero}</h1>
          <Badge variant="secondary">{STATUS_REGISTRO_LABEL[qqp.registro.status] ?? qqp.registro.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {qqp.registro.obraNome} · {qqp.registro.descricao}
        </p>
      </div>

      <Tabs defaultValue="selecao">
        <TabsList>
          <TabsTrigger value="selecao">1. Seleção de tarefas/insumos</TabsTrigger>
          <TabsTrigger value="quantidades">2. Ajuste de quantidades</TabsTrigger>
          <TabsTrigger value="cabecas">3. Cabeças de contratação</TabsTrigger>
          <TabsTrigger value="revisao">4. Revisão</TabsTrigger>
          <TabsTrigger value="exportacao">5. Exportação</TabsTrigger>
        </TabsList>

        <TabsContent value="selecao" className="mt-4">
          <SelecaoPanel qqpId={qqp.id} grupos={grupos} itensAdicionados={itensAdicionados} />
        </TabsContent>

        <TabsContent value="quantidades" className="mt-4">
          <QuantidadesPanel itens={qqp.itens} />
        </TabsContent>

        <TabsContent value="cabecas" className="mt-4">
          <CabecasPanel qqpId={qqp.id} itens={qqp.itens} cabecas={qqp.cabecas} />
        </TabsContent>

        <TabsContent value="revisao" className="mt-4">
          <RevisaoPanel
            registroId={qqp.registro.id}
            status={qqp.registro.status}
            observacoesIniciais={qqp.observacoes}
            qqpId={qqp.id}
            itens={qqp.itens}
            cabecas={qqp.cabecas}
          />
        </TabsContent>

        <TabsContent value="exportacao" className="mt-4">
          <ExportacaoPanel qqpId={qqp.id} modelos={modelos} exportacoes={exportacoes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
