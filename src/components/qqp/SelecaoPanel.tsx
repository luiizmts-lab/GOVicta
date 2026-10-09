"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrcamentoTree, type ItemJaAdicionado } from "@/components/orcamento/OrcamentoTree";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { GrupoNode, TarefaNode, InsumoNode } from "@/lib/services/orcamento";
import { adicionarInsumo, adicionarTarefaCompleta } from "@/app/actions/qqp-actions";

export function SelecaoPanel({
  qqpId,
  grupos,
  itensAdicionados,
}: {
  qqpId: string;
  grupos: GrupoNode[];
  itensAdicionados: ItemJaAdicionado[];
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function adicionarTarefa(tarefa: TarefaNode) {
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarTarefaCompleta(qqpId, tarefa.id);
      if (!resultado.ok) setErro(resultado.error);
      else router.refresh();
    });
  }

  function adicionarInsumoItem(tarefa: TarefaNode, insumo: InsumoNode) {
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarInsumo(qqpId, tarefa.id, insumo.itemComposicaoId);
      if (!resultado.ok) setErro(resultado.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex h-[65vh] flex-col gap-3">
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Card className="flex-1 overflow-hidden p-0">
        <OrcamentoTree
          grupos={grupos}
          selectable
          itensAdicionados={itensAdicionados}
          onAdicionarTarefa={adicionarTarefa}
          onAdicionarInsumo={adicionarInsumoItem}
          busy={isPending}
        />
      </Card>
    </div>
  );
}
