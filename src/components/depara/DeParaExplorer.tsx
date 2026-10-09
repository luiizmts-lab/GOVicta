"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ExecutivaComLinks, RmComLinks } from "@/lib/services/depara";

type Selecao = { lado: "EXEC" | "RM"; id: string } | null;

export function DeParaExplorer({
  executivas,
  rms,
}: {
  executivas: ExecutivaComLinks[];
  rms: RmComLinks[];
}) {
  const [selecao, setSelecao] = useState<Selecao>(null);
  const [buscaExec, setBuscaExec] = useState("");
  const [buscaRm, setBuscaRm] = useState("");

  const idsRmLigadosAoSelecionado = useMemo(() => {
    if (selecao?.lado !== "EXEC") return null;
    const exec = executivas.find((e) => e.id === selecao.id);
    return exec ? new Set(exec.links.map((l) => l.outroId)) : new Set<string>();
  }, [selecao, executivas]);

  const idsExecLigadosAoSelecionado = useMemo(() => {
    if (selecao?.lado !== "RM") return null;
    const rm = rms.find((r) => r.id === selecao.id);
    return rm ? new Set(rm.links.map((l) => l.outroId)) : new Set<string>();
  }, [selecao, rms]);

  const execFiltradas = executivas.filter(
    (e) =>
      e.codigo.toLowerCase().includes(buscaExec.toLowerCase()) ||
      e.descricao.toLowerCase().includes(buscaExec.toLowerCase())
  );
  const rmsFiltradas = rms.filter(
    (r) =>
      r.codigo.toLowerCase().includes(buscaRm.toLowerCase()) ||
      r.descricao.toLowerCase().includes(buscaRm.toLowerCase())
  );

  return (
    <div className="grid h-full grid-cols-2 divide-x">
      <div className="flex h-full flex-col">
        <div className="border-b p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Orçamento Executivo</p>
          <Input placeholder="Buscar tarefa..." value={buscaExec} onChange={(e) => setBuscaExec(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {execFiltradas.map((exec) => {
            const destacado = idsExecLigadosAoSelecionado?.has(exec.id);
            const ativo = selecao?.lado === "EXEC" && selecao.id === exec.id;
            return (
              <button
                key={exec.id}
                type="button"
                onClick={() => setSelecao(ativo ? null : { lado: "EXEC", id: exec.id })}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-t px-3 py-2 text-left text-sm hover:bg-muted/40",
                  ativo && "bg-emerald-100",
                  destacado && !ativo && "bg-emerald-50"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{exec.codigo}</span>
                  <span className="truncate">{exec.descricao}</span>
                  {exec.links.length === 0 && (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                </span>
                <span className="shrink-0 text-xs font-medium">{formatCurrency(exec.valorTotal)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-full flex-col">
        <div className="border-b p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Orçamento RM</p>
          <Input placeholder="Buscar apropriação..." value={buscaRm} onChange={(e) => setBuscaRm(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {rmsFiltradas.map((rm) => {
            const destacado = idsRmLigadosAoSelecionado?.has(rm.id);
            const ativo = selecao?.lado === "RM" && selecao.id === rm.id;
            return (
              <button
                key={rm.id}
                type="button"
                onClick={() => setSelecao(ativo ? null : { lado: "RM", id: rm.id })}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-t px-3 py-2 text-left text-sm hover:bg-muted/40",
                  ativo && "bg-emerald-100",
                  destacado && !ativo && "bg-emerald-50"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{rm.codigo}</span>
                  <span className="truncate">{rm.descricao}</span>
                </span>
                <span className="shrink-0 text-xs font-medium">{formatCurrency(rm.custoTotal)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selecao && (
        <DetalheSelecao
          selecao={selecao}
          executivas={executivas}
          rms={rms}
          onClose={() => setSelecao(null)}
        />
      )}
    </div>
  );
}

function DetalheSelecao({
  selecao,
  executivas,
  rms,
  onClose,
}: {
  selecao: NonNullable<Selecao>;
  executivas: ExecutivaComLinks[];
  rms: RmComLinks[];
  onClose: () => void;
}) {
  const item =
    selecao.lado === "EXEC"
      ? executivas.find((e) => e.id === selecao.id)
      : rms.find((r) => r.id === selecao.id);

  if (!item) return null;

  const links = item.links;
  const totalRateio = links.reduce((acc, l) => acc + l.percentualRateio, 0);

  return (
    <div className="col-span-2 border-t bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">
          Relacionamentos de {item.codigo} — {item.descricao}
        </p>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:underline">
          fechar
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-amber-700">Nenhum relacionamento DE-PARA cadastrado para este item.</p>
      ) : (
        <div className="space-y-1">
          {links.map((link) => (
            <div key={link.deParaId} className="flex items-center justify-between rounded border bg-white px-3 py-1.5 text-sm">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{link.outroCodigo}</span>{" "}
                {link.outroDescricao}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatPercent(link.percentualRateio)}</span>
                <span className="font-medium">{formatCurrency(link.valorRateado)}</span>
                <Badge variant={link.status === "CONCILIADO" ? "default" : "secondary"} className={link.status === "CONCILIADO" ? "bg-emerald-600" : ""}>
                  {link.status}
                </Badge>
              </span>
            </div>
          ))}
          {Math.abs(totalRateio - 100) > 0.01 && (
            <p className="flex items-center gap-1 pt-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" /> Rateio soma {formatPercent(totalRateio)} — abaixo de 100%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
