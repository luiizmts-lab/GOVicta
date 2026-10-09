"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Trash2 } from "lucide-react";
import type { ItemQqpView } from "@/lib/services/qqp";
import { atualizarQuantidadeSolicitada, removerItem } from "@/app/actions/qqp-actions";

export function QuantidadesPanel({ itens }: { itens: ItemQqpView[] }) {
  const [erro, setErro] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(itens.map((i) => [i.id, String(i.quantidadeSolicitada)]))
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function salvarQuantidade(itemId: string) {
    const valor = Number(valores[itemId]);
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarQuantidadeSolicitada(itemId, valor);
      if (!resultado.ok) setErro(resultado.error);
      router.refresh();
    });
  }

  function excluir(itemId: string) {
    startTransition(async () => {
      await removerItem(itemId);
      router.refresh();
    });
  }

  const totalBase = itens.reduce((acc, i) => acc + i.quantidadeBase * i.precoUnitario, 0);
  const totalSolicitado = itens.reduce((acc, i) => acc + i.quantidadeSolicitada * i.precoUnitario, 0);

  return (
    <div className="space-y-3">
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Un.</TableHead>
            <TableHead className="text-right">Qtd. base</TableHead>
            <TableHead className="text-right">Preço ref.</TableHead>
            <TableHead className="text-right">Total base</TableHead>
            <TableHead className="w-32 text-right">Qtd. solicitada</TableHead>
            <TableHead className="text-right">Total solicitado</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum item selecionado ainda — use a aba Seleção.
              </TableCell>
            </TableRow>
          )}
          {itens.map((item) => {
            const qtd = Number(valores[item.id] ?? item.quantidadeSolicitada);
            const totalBaseItem = item.quantidadeBase * item.precoUnitario;
            const totalSolicitadoItem = qtd * item.precoUnitario;
            const diferenca = totalSolicitadoItem - totalBaseItem;
            const acimaDoOrcado = qtd > item.quantidadeBase;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex items-center gap-1">
                    <span className="truncate">{item.descricao}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {item.tipoOrigem === "TAREFA" ? "Tarefa" : "Insumo"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{item.unidade}</TableCell>
                <TableCell className="text-right">{formatNumber(item.quantidadeBase)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.precoUnitario)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalBaseItem)}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.0001"
                    value={valores[item.id] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [item.id]: e.target.value }))}
                    onBlur={() => salvarQuantidade(item.id)}
                    disabled={isPending}
                    className={acimaDoOrcado ? "border-amber-400" : ""}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totalSolicitadoItem)}</TableCell>
                <TableCell className={`text-right ${diferenca > 0 ? "text-amber-600" : diferenca < 0 ? "text-muted-foreground" : ""}`}>
                  {formatCurrency(diferenca)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => excluir(item.id)} disabled={isPending}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {itens.length > 0 && (
        <div className="flex justify-end gap-6 border-t pt-3 text-sm">
          <span>
            Total base: <strong>{formatCurrency(totalBase)}</strong>
          </span>
          <span>
            Total solicitado: <strong className="text-emerald-700">{formatCurrency(totalSolicitado)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
