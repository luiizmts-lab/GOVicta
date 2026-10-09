import { listObras } from "@/lib/obra";
import { NovaObraDialog } from "@/components/administracao/NovaObraDialog";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ObrasPage() {
  const obras = await listObras();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Administração — Obras</h1>
          <p className="text-sm text-muted-foreground">Cadastro das obras geridas pelo sistema.</p>
        </div>
        <NovaObraDialog />
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Código RM</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.map((obra) => (
              <TableRow key={obra.id}>
                <TableCell className="font-mono text-sm">{obra.codigo}</TableCell>
                <TableCell>{obra.nome}</TableCell>
                <TableCell>{obra.codigoRm ?? "—"}</TableCell>
                <TableCell>{obra.responsavel ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={obra.status === "ATIVA" ? "default" : "secondary"} className={obra.status === "ATIVA" ? "bg-emerald-600" : ""}>
                    {obra.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
