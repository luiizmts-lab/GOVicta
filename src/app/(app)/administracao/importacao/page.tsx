import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";

type ModeloImportacao = {
  arquivo: string;
  titulo: string;
  descricao: string;
  colunas: string[];
};

const MODELOS: ModeloImportacao[] = [
  {
    arquivo: "orcamento-executivo-modelo.csv",
    titulo: "Orçamento Executivo",
    descricao: "Grupos e tarefas do orçamento aberto da obra, com quantidades e preços unitários.",
    colunas: [
      "grupo_codigo",
      "grupo_nome",
      "tarefa_codigo",
      "tarefa_descricao",
      "unidade",
      "quantidade_orcada",
      "preco_unitario_sem_bdi",
      "preco_unitario_com_bdi",
      "custo_mao_obra",
      "custo_mao_obra_terceirizada",
      "custo_servicos",
      "custo_materiais",
      "codigo_apropriacao_rm",
      "descricao_apropriacao",
    ],
  },
  {
    arquivo: "composicoes-modelo.csv",
    titulo: "Composições de Custos",
    descricao: "Insumos que formam cada tarefa (um insumo por linha), com coeficiente e preço unitário.",
    colunas: [
      "tarefa_codigo",
      "composicao_codigo",
      "composicao_descricao",
      "insumo_codigo",
      "insumo_descricao",
      "insumo_unidade",
      "insumo_tipo (MATERIAL | MAO_DE_OBRA | MAO_DE_OBRA_TERCEIRIZADA | EQUIPAMENTO | SERVICO | OUTRO)",
      "banco_origem",
      "coeficiente",
      "preco_unitario",
    ],
  },
  {
    arquivo: "orcamento-rm-modelo.csv",
    titulo: "Orçamento RM",
    descricao: "Estrutura hierárquica consolidada do TOTVS RM (uma linha por nível, com o código do nível pai).",
    colunas: [
      "codigo",
      "descricao",
      "codigo_apropriacao",
      "codigo_pai (vazio para raiz)",
      "nivel_hierarquico",
      "unidade",
      "quantidade",
      "custo_total",
    ],
  },
  {
    arquivo: "de-para-modelo.csv",
    titulo: "DE-PARA Orçamentário",
    descricao: "Relacionamento entre tarefas do orçamento executivo e apropriações do RM, com percentual de rateio.",
    colunas: [
      "tarefa_executiva_codigo",
      "tarefa_rm_codigo",
      "percentual_rateio",
      "origem_mapeamento (MANUAL | IMPORTADO)",
    ],
  },
  {
    arquivo: "modelos-contratacao-modelo.csv",
    titulo: "Modelos de Contratação",
    descricao: "Cadastro dos modelos padronizados usados na exportação dos QQPs para Suprimentos.",
    colunas: [
      "codigo",
      "nome",
      "categoria",
      "descricao",
      "mostrar_precos (SIM | NAO)",
      "layout_cabeca (DETALHADO | TITULO_SECAO | SEM_AGRUPAMENTO)",
    ],
  },
];

export default function ImportacaoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Importação de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Modelos de planilha CSV para preparar os dados reais da obra.
        </p>
      </div>

      <Alert className="border-amber-300 bg-amber-50 text-amber-800">
        <AlertDescription>
          Por enquanto esta tela só disponibiliza os <strong>modelos</strong> (cabeçalho + linhas de exemplo) para
          você preencher. O assistente de upload, mapeamento de colunas e validação (que lê esses CSVs e grava no
          banco) ainda será construído — avise quando quiser priorizar essa etapa.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {MODELOS.map((modelo) => (
          <Card key={modelo.arquivo}>
            <CardHeader>
              <CardTitle className="text-base">{modelo.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
              <div className="flex flex-wrap gap-1">
                {modelo.colunas.map((coluna) => (
                  <code
                    key={coluna}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {coluna}
                  </code>
                ))}
              </div>
              <Button
                render={<a href={`/templates/${modelo.arquivo}`} download={modelo.arquivo} />}
                nativeButton={false}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Baixar modelo CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
