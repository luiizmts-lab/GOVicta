import Link from "next/link";
import { getObraAtiva } from "@/lib/obra";
import { prisma } from "@/lib/prisma";
import { valorQqp } from "@/lib/services/calc";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { STATUS_REGISTRO_LABEL } from "@/lib/status-labels";
import { Plus } from "lucide-react";

export default async function RegistrosPage() {
  const obra = await getObraAtiva();
  if (!obra) {
    return <p className="text-sm text-muted-foreground">Nenhuma obra selecionada.</p>;
  }

  const registros = await prisma.registroGestao.findMany({
    where: { obraId: obra.id, tipoRegistro: "QQP" },
    orderBy: { numero: "desc" },
    include: { qqp: { include: { itens: true } }, solicitante: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Registros de Gestão — QQP</h1>
          <p className="text-sm text-muted-foreground">{obra.nome}</p>
        </div>
        <Button
          render={<Link href="/registros/qqp/novo" />}
          nativeButton={false}
          className="gap-2 bg-emerald-700 hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Data da solicitação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor solicitado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum registro criado para esta obra ainda.
                </TableCell>
              </TableRow>
            )}
            {registros.map((registro) => (
              <TableRow key={registro.id}>
                <TableCell className="font-mono text-sm">
                  {registro.qqp ? (
                    <Link href={`/registros/qqp/${registro.qqp.id}`} className="text-emerald-700 hover:underline">
                      {registro.numero}
                    </Link>
                  ) : (
                    registro.numero
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{registro.descricao}</TableCell>
                <TableCell>{registro.solicitante?.nome ?? registro.solicitante?.email ?? "—"}</TableCell>
                <TableCell>{registro.dataSolicitacao.toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{STATUS_REGISTRO_LABEL[registro.status] ?? registro.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {registro.qqp ? formatCurrency(Number(valorQqp(registro.qqp.itens))) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
