import { listModelos } from "@/lib/services/modelo";
import { NovoModeloDialog } from "@/components/administracao/NovoModeloDialog";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LAYOUT_LABEL: Record<string, string> = {
  DETALHADO: "Cabeça com total + itens",
  TITULO_SECAO: "Cabeça como título de seção",
  SEM_AGRUPAMENTO: "Itens analíticos (sem agrupamento)",
};

export default async function ModelosPage() {
  const modelos = await listModelos();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Modelos de Contratação</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro dos modelos padronizados usados na exportação dos QQPs para Suprimentos.
          </p>
        </div>
        <NovoModeloDialog />
      </div>

      <Alert className="border-amber-300 bg-amber-50 text-amber-800">
        <AlertDescription>
          A VICTA utiliza 47 modelos reais de contratação. Enquanto os arquivos originais não são enviados,
          os modelos abaixo são <strong>demonstrativos</strong> — usam um layout genérico, não reproduzem
          nenhum modelo real da empresa.
        </AlertDescription>
      </Alert>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Layout de cabeças</TableHead>
              <TableHead>Preços visíveis</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelos.map((modelo) => (
              <TableRow key={modelo.id}>
                <TableCell className="font-mono text-sm">{modelo.codigo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {modelo.nome}
                    {modelo.demonstrativo && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700">
                        Demonstrativo
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{modelo.categoria ?? "—"}</TableCell>
                <TableCell>{LAYOUT_LABEL[modelo.layoutCabeca] ?? modelo.layoutCabeca}</TableCell>
                <TableCell>{modelo.mostrarPrecos ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  <Badge className={modelo.status === "ATIVO" ? "bg-emerald-600" : ""} variant={modelo.status === "ATIVO" ? "default" : "secondary"}>
                    {modelo.status}
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
