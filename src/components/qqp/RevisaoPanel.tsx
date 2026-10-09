"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { CabecaView, ItemQqpView } from "@/lib/services/qqp";
import { atualizarObservacoesQqp, atualizarStatusRegistro } from "@/app/actions/qqp-actions";
import { STATUS_REGISTRO_LABEL } from "@/lib/status-labels";

const FLUXO_STATUS = [
  "RASCUNHO",
  "EM_VALIDACAO",
  "VALIDADO",
  "ENVIADO_SUPRIMENTOS",
  "EM_COTACAO",
  "CONTRATADO",
] as const;

export function RevisaoPanel({
  registroId,
  status,
  observacoesIniciais,
  qqpId,
  itens,
  cabecas,
}: {
  registroId: string;
  status: string;
  observacoesIniciais: string | null;
  qqpId: string;
  itens: ItemQqpView[];
  cabecas: CabecaView[];
}) {
  const [observacoes, setObservacoes] = useState(observacoesIniciais ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = itens.reduce((acc, i) => acc + i.quantidadeSolicitada * i.precoUnitario, 0);
  const itensSemApropriacao = itens.filter((i) => i.apropriacoes.length === 0);
  const itensAcimaDoBase = itens.filter(
    (i) => i.quantidadeSolicitada * i.precoUnitario > ((i.quantidadeBase * i.fatorEscopo) / 100) * i.precoUnitario
  );

  const indiceAtual = FLUXO_STATUS.indexOf(status as (typeof FLUXO_STATUS)[number]);
  const proximoStatus = indiceAtual >= 0 ? FLUXO_STATUS[indiceAtual + 1] : undefined;

  function avancarStatus() {
    if (!proximoStatus) return;
    startTransition(async () => {
      await atualizarStatusRegistro(registroId, proximoStatus);
      router.refresh();
    });
  }

  function salvarObservacoes() {
    startTransition(async () => {
      await atualizarObservacoesQqp(qqpId, observacoes);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total solicitado</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold text-emerald-700">{formatCurrency(total)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Itens</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{itens.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cabeças criadas</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{cabecas.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-emerald-600">{STATUS_REGISTRO_LABEL[status] ?? status}</Badge>
          </CardContent>
        </Card>
      </div>

      {(itensSemApropriacao.length > 0 || itensAcimaDoBase.length > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="space-y-1 py-3 text-sm text-amber-800">
            {itensSemApropriacao.length > 0 && (
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {itensSemApropriacao.length} item(ns) sem apropriação RM
                (o orçamento executivo de origem não tem DE-PARA cadastrado).
              </p>
            )}
            {itensAcimaDoBase.length > 0 && (
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {itensAcimaDoBase.length} item(ns) acima da fatia orçada
                (quantidade orçada × fator de escopo).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          <Button size="sm" variant="outline" onClick={salvarObservacoes} disabled={isPending}>
            Salvar observações
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={avancarStatus}
          disabled={isPending || !proximoStatus || itens.length === 0}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          {proximoStatus ? `Avançar para "${STATUS_REGISTRO_LABEL[proximoStatus]}"` : "Fluxo concluído"}
        </Button>
      </div>
    </div>
  );
}
