"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";
import type { ModeloContratacao, Profile } from "@prisma/client";

type Exportacao = {
  id: string;
  dataGeracao: Date;
  versaoModelo: number;
  modeloContratacao: ModeloContratacao;
  usuario: Profile | null;
};

export function ExportacaoPanel({
  qqpId,
  modelos,
  exportacoes,
}: {
  qqpId: string;
  modelos: ModeloContratacao[];
  exportacoes: Exportacao[];
}) {
  const [modeloId, setModeloId] = useState<string>(modelos[0]?.id ?? "");
  const modeloSelecionado = modelos.find((m) => m.id === modeloId);

  return (
    <div className="space-y-4">
      {modelos.length === 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            Nenhum modelo de contratação ativo cadastrado. Cadastre um em Administração → Modelos de
            Contratação antes de exportar.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gerar arquivo XLSX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {modeloSelecionado?.demonstrativo && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                <AlertDescription>
                  Este modelo é demonstrativo — o layout não reproduz nenhum dos 47 modelos reais da empresa.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-end gap-3">
              <div className="w-80 space-y-2">
                <Select value={modeloId} onValueChange={(v) => typeof v === "string" && setModeloId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {() => (modeloSelecionado ? `${modeloSelecionado.codigo} — ${modeloSelecionado.nome}` : "Selecione um modelo")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {modelos.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id}>
                        {modelo.codigo} — {modelo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                render={<a href={`/api/qqp/${qqpId}/export?modeloId=${modeloId}`} />}
                nativeButton={false}
                disabled={!modeloId}
                className="gap-2 bg-emerald-700 hover:bg-emerald-800"
              >
                <Download className="h-4 w-4" /> Baixar XLSX
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de exportações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Versão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma exportação gerada ainda.
                  </TableCell>
                </TableRow>
              )}
              {exportacoes.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{new Date(exp.dataGeracao).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{exp.usuario?.nome ?? exp.usuario?.email ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {exp.modeloContratacao.codigo} — {exp.modeloContratacao.nome}
                      {exp.modeloContratacao.demonstrativo && (
                        <Badge variant="outline" className="border-amber-400 text-[10px] text-amber-700">
                          Demonstrativo
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>v{exp.versaoModelo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
