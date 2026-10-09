"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { analisarArquivo, confirmarImportacao, validarArquivo } from "@/app/actions/import-actions";
import type { ColunaDef, ImportTipo, LinhaBruta, LinhaValidada, Mapeamento } from "@/lib/import/types";

const NAO_MAPEADO = "__nao_mapeado__";

type Etapa = "upload" | "mapeamento" | "preview" | "concluido";

export function ImportWizard({
  tipo,
  titulo,
  obraId,
  colunas,
  arquivoModelo,
}: {
  tipo: ImportTipo;
  titulo: string;
  obraId: string | null;
  colunas: ColunaDef[];
  arquivoModelo: string;
}) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [isPending, startTransition] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [linhasBrutas, setLinhasBrutas] = useState<LinhaBruta[]>([]);
  const [totalLinhasArquivo, setTotalLinhasArquivo] = useState(0);
  const [mapeamento, setMapeamento] = useState<Mapeamento>({});
  const [validacao, setValidacao] = useState<{ linhas: LinhaValidada[]; totalLinhas: number; linhasComErro: number } | null>(
    null
  );
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number; mensagem: string } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  function handleUpload(formData: FormData) {
    setErroGeral(null);
    startTransition(async () => {
      const resposta = await analisarArquivo(tipo, formData);
      if (!resposta.ok) {
        setErroGeral(resposta.erro);
        return;
      }
      setCabecalhos(resposta.cabecalhos);
      setLinhasBrutas(resposta.linhas);
      setTotalLinhasArquivo(resposta.totalLinhasArquivo);
      setMapeamento(resposta.mapeamentoSugerido);
      setEtapa("mapeamento");
    });
  }

  function handlePrevisualizar() {
    setErroGeral(null);
    startTransition(async () => {
      const resultadoValidacao = await validarArquivo(tipo, obraId, linhasBrutas, mapeamento);
      setValidacao(resultadoValidacao);
      setEtapa("preview");
    });
  }

  function handleConfirmar() {
    if (!validacao) return;
    setErroGeral(null);
    startTransition(async () => {
      const resposta = await confirmarImportacao(tipo, obraId, validacao.linhas);
      if (!resposta.ok) {
        setErroGeral(resposta.erro);
        return;
      }
      setResultado(resposta.resultado);
      setEtapa("concluido");
    });
  }

  function recomecar() {
    formRef.current?.reset();
    setEtapa("upload");
    setCabecalhos([]);
    setLinhasBrutas([]);
    setMapeamento({});
    setValidacao(null);
    setResultado(null);
    setErroGeral(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {(["upload", "mapeamento", "preview", "concluido"] as Etapa[]).map((e, i) => (
          <span key={e} className="flex items-center gap-2">
            {i > 0 && <span>→</span>}
            <span className={etapa === e ? "font-semibold text-emerald-700" : ""}>
              {i + 1}. {{ upload: "Arquivo", mapeamento: "Mapeamento", preview: "Pré-visualização", concluido: "Concluído" }[e]}
            </span>
          </span>
        ))}
      </div>

      {erroGeral && (
        <Alert variant="destructive">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {etapa === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selecionar arquivo — {titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo CSV com os dados.{" "}
              <a href={`/templates/${arquivoModelo}`} download className="text-emerald-700 hover:underline">
                Baixar o modelo
              </a>{" "}
              se ainda não tiver um.
            </p>
            <form ref={formRef} action={handleUpload} className="flex items-center gap-3">
              <input
                type="file"
                name="arquivo"
                accept=".csv,text/csv"
                required
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-800"
              />
              <Button type="submit" disabled={isPending} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                <Upload className="h-4 w-4" /> {isPending ? "Lendo..." : "Analisar arquivo"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {etapa === "mapeamento" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapeamento de colunas</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalLinhasArquivo} linha(s) encontrada(s). Associe cada campo esperado à coluna correspondente do
              seu arquivo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {colunas.map((coluna) => (
              <div key={coluna.chave} className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {coluna.rotulo}
                  {coluna.obrigatoria && <span className="text-red-600"> *</span>}
                </span>
                <Select
                  value={mapeamento[coluna.chave] ?? NAO_MAPEADO}
                  onValueChange={(v) =>
                    typeof v === "string" &&
                    setMapeamento((m) => ({ ...m, [coluna.chave]: v === NAO_MAPEADO ? null : v }))
                  }
                >
                  <SelectTrigger className="w-72">
                    <SelectValue>
                      {() => mapeamento[coluna.chave] ?? "Não mapeado"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NAO_MAPEADO}>Não mapeado</SelectItem>
                    {cabecalhos.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={recomecar}>
                Recomeçar
              </Button>
              <Button onClick={handlePrevisualizar} disabled={isPending} className="bg-emerald-700 hover:bg-emerald-800">
                {isPending ? "Validando..." : "Pré-visualizar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {etapa === "preview" && validacao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pré-visualização e validação</CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary">{validacao.totalLinhas} linha(s)</Badge>
              {validacao.linhasComErro > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {validacao.linhasComErro} com erro
                </Badge>
              ) : (
                <Badge className="gap-1 bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Nenhum erro encontrado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Linha</TableHead>
                    {colunas.map((c) => (
                      <TableHead key={c.chave}>{c.rotulo}</TableHead>
                    ))}
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validacao.linhas.map((linha) => (
                    <TableRow key={linha.numeroLinha} className={linha.erros.length > 0 ? "bg-red-50" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{linha.numeroLinha}</TableCell>
                      {colunas.map((c) => (
                        <TableCell key={c.chave} className="text-xs">
                          {linha.dados[c.chave] ?? ""}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-red-700">
                        {linha.erros.length > 0 ? linha.erros.join(" ") : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              {validacao.linhasComErro > 0 && (
                <Button variant="outline" onClick={recomecar}>
                  Enviar outro arquivo
                </Button>
              )}
              <Button variant="outline" onClick={() => setEtapa("mapeamento")}>
                Ajustar mapeamento
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={isPending || validacao.linhasComErro > 0}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                {isPending ? "Importando..." : "Confirmar importação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {etapa === "concluido" && resultado && (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>{resultado.mensagem}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={recomecar}>
                Importar outro arquivo
              </Button>
              <Button size="sm" onClick={() => router.refresh()} className="bg-emerald-700 hover:bg-emerald-800">
                Atualizar página
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
