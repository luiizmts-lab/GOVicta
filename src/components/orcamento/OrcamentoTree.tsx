"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { GrupoNode, TarefaNode, InsumoNode } from "@/lib/services/orcamento";

export type ItemJaAdicionado = { tarefaExecutivaId: string; itemComposicaoId: string | null };

type Props = {
  grupos: GrupoNode[];
  selectable?: boolean;
  itensAdicionados?: ItemJaAdicionado[];
  onAdicionarTarefa?: (tarefa: TarefaNode) => void;
  onAdicionarInsumo?: (tarefa: TarefaNode, insumo: InsumoNode) => void;
  busy?: boolean;
};

function tarefaEstaCompleta(itens: ItemJaAdicionado[], tarefaId: string) {
  return itens.some((i) => i.tarefaExecutivaId === tarefaId && i.itemComposicaoId === null);
}

function tarefaTemInsumoAdicionado(itens: ItemJaAdicionado[], tarefaId: string, itemComposicaoId?: string) {
  if (itemComposicaoId) {
    return itens.some(
      (i) => i.tarefaExecutivaId === tarefaId && i.itemComposicaoId === itemComposicaoId
    );
  }
  return itens.some((i) => i.tarefaExecutivaId === tarefaId && i.itemComposicaoId !== null);
}

export function OrcamentoTree({
  grupos,
  selectable = false,
  itensAdicionados = [],
  onAdicionarTarefa,
  onAdicionarInsumo,
  busy = false,
}: Props) {
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const termo = busca.trim().toLowerCase();

  const gruposFiltrados = useMemo(() => {
    if (!termo) return grupos;
    return grupos
      .map((grupo) => ({
        ...grupo,
        tarefas: grupo.tarefas.filter(
          (t) => t.codigo.toLowerCase().includes(termo) || t.descricao.toLowerCase().includes(termo)
        ),
      }))
      .filter((grupo) => grupo.tarefas.length > 0);
  }, [grupos, termo]);

  function toggle(id: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <Input
          placeholder="Buscar por código ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {gruposFiltrados.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
        )}

        {gruposFiltrados.map((grupo) => (
          <div key={grupo.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(grupo.id)}
              className="flex w-full items-center justify-between gap-2 bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <span className="flex items-center gap-1">
                {expandidos.has(grupo.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {grupo.codigo} — {grupo.nome}
              </span>
              <span className="text-xs font-normal text-emerald-700">
                {formatCurrency(grupo.totalGrupo)}
              </span>
            </button>

            {expandidos.has(grupo.id) &&
              grupo.tarefas.map((tarefa) => (
                <TarefaRow
                  key={tarefa.id}
                  tarefa={tarefa}
                  expandido={expandidos.has(tarefa.id)}
                  onToggle={() => toggle(tarefa.id)}
                  selectable={selectable}
                  completa={tarefaEstaCompleta(itensAdicionados, tarefa.id)}
                  temInsumoAdicionado={tarefaTemInsumoAdicionado(itensAdicionados, tarefa.id)}
                  itensAdicionados={itensAdicionados}
                  onAdicionarTarefa={onAdicionarTarefa}
                  onAdicionarInsumo={onAdicionarInsumo}
                  busy={busy}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TarefaRow({
  tarefa,
  expandido,
  onToggle,
  selectable,
  completa,
  temInsumoAdicionado,
  itensAdicionados,
  onAdicionarTarefa,
  onAdicionarInsumo,
  busy,
}: {
  tarefa: TarefaNode;
  expandido: boolean;
  onToggle: () => void;
  selectable: boolean;
  completa: boolean;
  temInsumoAdicionado: boolean;
  itensAdicionados: ItemJaAdicionado[];
  onAdicionarTarefa?: (tarefa: TarefaNode) => void;
  onAdicionarInsumo?: (tarefa: TarefaNode, insumo: InsumoNode) => void;
  busy: boolean;
}) {
  const temComposicao = tarefa.composicoes.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2 pl-8 text-sm hover:bg-muted/40">
        <button
          type="button"
          onClick={onToggle}
          disabled={!temComposicao}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          {temComposicao ? (
            expandido ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{tarefa.codigo}</span>
          <span className="truncate">{tarefa.descricao}</span>
          {!tarefa.temDePara && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Sem DE-PARA" />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span>
            {formatNumber(tarefa.quantidadeOrcada)} {tarefa.unidade}
          </span>
          <span className="w-28 text-right font-medium text-foreground">
            {formatCurrency(tarefa.valorTotal)}
          </span>
          {selectable && (
            completa ? (
              <Badge className="gap-1 bg-emerald-600">
                <Check className="h-3 w-3" /> Completa
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || temInsumoAdicionado}
                title={
                  temInsumoAdicionado
                    ? "Já há insumos desta tarefa adicionados — remova-os para adicionar a tarefa completa"
                    : undefined
                }
                onClick={() => onAdicionarTarefa?.(tarefa)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Tarefa completa
              </Button>
            )
          )}
        </div>
      </div>

      {expandido &&
        tarefa.composicoes.map((composicao) => (
          <div key={composicao.id} className="bg-muted/20 pl-14">
            {composicao.insumos.map((insumo) => {
              const jaAdicionado = itensAdicionados.some(
                (i) => i.tarefaExecutivaId === tarefa.id && i.itemComposicaoId === insumo.itemComposicaoId
              );
              return (
                <div
                  key={insumo.itemComposicaoId}
                  className="flex items-center justify-between gap-2 border-t px-3 py-1.5 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-mono text-muted-foreground">{insumo.codigo}</span>
                    <span className="truncate">{insumo.descricao}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {insumo.tipo.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span>coef. {formatNumber(insumo.coeficiente)}</span>
                    <span>
                      {formatNumber(insumo.quantidadeGlobal)} {insumo.unidade}
                    </span>
                    <span className="w-24 text-right font-medium text-foreground">
                      {formatCurrency(insumo.custoGlobal)}
                    </span>
                    {selectable &&
                      (jaAdicionado ? (
                        <Badge className="gap-1 bg-emerald-600">
                          <Check className="h-3 w-3" /> Adicionado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || completa}
                          title={completa ? "A tarefa completa já foi adicionada" : undefined}
                          onClick={() => onAdicionarInsumo?.(tarefa, insumo)}
                          className="h-7 gap-1 px-2"
                        >
                          <Plus className="h-3 w-3" /> Insumo
                        </Button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
