"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { RmNode } from "@/lib/services/orcamento-rm";

export function RmTree({ nodes }: { nodes: RmNode[] }) {
  return (
    <div className="h-full overflow-y-auto">
      {nodes.map((node) => (
        <RmRow key={node.id} node={node} />
      ))}
    </div>
  );
}

function RmRow({ node }: { node: RmNode }) {
  const [expandido, setExpandido] = useState(node.nivelHierarquico === 1);
  const temFilhos = node.filhos.length > 0;
  const indent = (node.nivelHierarquico - 1) * 24 + 12;

  return (
    <div>
      <button
        type="button"
        onClick={() => temFilhos && setExpandido((v) => !v)}
        style={{ paddingLeft: indent }}
        className={`flex w-full items-center justify-between gap-2 border-t py-2 pr-3 text-left text-sm hover:bg-muted/40 ${
          node.nivelHierarquico === 1 ? "bg-emerald-50 font-semibold text-emerald-900" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {temFilhos ? (
            expandido ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{node.codigo}</span>
          <span className="truncate">{node.descricao}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatNumber(node.quantidade)} {node.unidade} ·{" "}
          <span className="font-medium text-foreground">{formatCurrency(node.custoTotal)}</span>
        </span>
      </button>

      {expandido && node.filhos.map((filho) => <RmRow key={filho.id} node={filho} />)}
    </div>
  );
}
