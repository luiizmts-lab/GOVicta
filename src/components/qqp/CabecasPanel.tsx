"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import type { CabecaView, ItemQqpView } from "@/lib/services/qqp";
import { criarCabeca, excluirCabeca, moverItemParaCabeca, renomearCabeca } from "@/app/actions/qqp-actions";

const NAO_AGRUPADO = "__nenhuma__";

function valorItem(item: ItemQqpView) {
  return item.quantidadeSolicitada * item.precoUnitario;
}

export function CabecasPanel({ qqpId, itens, cabecas }: { qqpId: string; itens: ItemQqpView[]; cabecas: CabecaView[] }) {
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function criar() {
    if (!novoNome.trim()) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await criarCabeca(qqpId, novoNome);
      if (!resultado.ok) setErro(resultado.error);
      else {
        setNovoNome("");
        router.refresh();
      }
    });
  }

  function mover(itemId: string, cabecaId: string) {
    startTransition(async () => {
      await moverItemParaCabeca(itemId, cabecaId === NAO_AGRUPADO ? null : cabecaId);
      router.refresh();
    });
  }

  function excluir(cabecaId: string) {
    startTransition(async () => {
      await excluirCabeca(cabecaId);
      router.refresh();
    });
  }

  const itensNaoAgrupados = itens.filter((i) => i.cabecaId === null);

  return (
    <div className="space-y-4">
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova cabeça de contratação"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && criar()}
        />
        <Button onClick={criar} disabled={isPending} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
          <Plus className="h-4 w-4" /> Nova cabeça
        </Button>
      </div>

      {cabecas.map((cabeca) => {
        const itensDaCabeca = itens.filter((i) => i.cabecaId === cabeca.id);
        const total = itensDaCabeca.reduce((acc, i) => acc + valorItem(i), 0);
        return (
          <Card key={cabeca.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <NomeCabeca cabeca={cabeca} />
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-700">{formatCurrency(total)}</span>
                <Button variant="ghost" size="icon" onClick={() => excluir(cabeca.id)} disabled={isPending}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {itensDaCabeca.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum item nesta cabeça ainda.</p>
              )}
              {itensDaCabeca.map((item) => (
                <ItemRow key={item.id} item={item} cabecas={cabecas} onMover={mover} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold text-muted-foreground">Itens não agrupados</p>
        </CardHeader>
        <CardContent className="space-y-1">
          {itensNaoAgrupados.length === 0 && (
            <p className="text-xs text-muted-foreground">Todos os itens estão agrupados em cabeças.</p>
          )}
          {itensNaoAgrupados.map((item) => (
            <ItemRow key={item.id} item={item} cabecas={cabecas} onMover={mover} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NomeCabeca({ cabeca }: { cabeca: CabecaView }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(cabeca.nome);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function salvar() {
    startTransition(async () => {
      await renomearCabeca(cabeca.id, nome);
      setEditando(false);
      router.refresh();
    });
  }

  if (editando) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && salvar()}
          className="h-8 w-56"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={salvar} disabled={isPending}>
          <Check className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground">{cabeca.codigo}</span>
      <span className="font-semibold">{cabeca.nome}</span>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditando(true)}>
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

function ItemRow({
  item,
  cabecas,
  onMover,
}: {
  item: ItemQqpView;
  cabecas: CabecaView[];
  onMover: (itemId: string, cabecaId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border bg-white px-3 py-1.5 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{item.codigo}</span>
        <span className="truncate">{item.descricao}</span>
        <Badge variant="outline" className="text-[10px]">
          {item.tipoOrigem === "TAREFA" ? "Tarefa" : "Insumo"}
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {formatNumber(item.quantidadeSolicitada)} {item.unidade}
        </span>
        <span className="w-24 text-right font-medium">{formatCurrency(valorItem(item))}</span>
        <Select
          value={item.cabecaId ?? NAO_AGRUPADO}
          onValueChange={(v) => typeof v === "string" && onMover(item.id, v)}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue>
              {(value: string | null) => {
                if (value === NAO_AGRUPADO || value === null) return "Não agrupado";
                const cabeca = cabecas.find((c) => c.id === value);
                return cabeca ? `${cabeca.codigo} — ${cabeca.nome}` : "Não agrupado";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NAO_AGRUPADO}>Não agrupado</SelectItem>
            {cabecas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.codigo} — {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
