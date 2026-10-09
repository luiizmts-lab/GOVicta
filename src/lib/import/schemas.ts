import type { ColunaDef, ImportTipo } from "./types";

export const TITULOS: Record<ImportTipo, string> = {
  "orcamento-executivo": "Orçamento Executivo",
  composicoes: "Composições de Custos",
  "orcamento-rm": "Orçamento RM",
  "de-para": "DE-PARA Orçamentário",
  "modelos-contratacao": "Modelos de Contratação",
};

export const PRECISA_OBRA: Record<ImportTipo, boolean> = {
  "orcamento-executivo": true,
  composicoes: true,
  "orcamento-rm": true,
  "de-para": true,
  "modelos-contratacao": false,
};

export const COLUNAS: Record<ImportTipo, ColunaDef[]> = {
  "orcamento-executivo": [
    { chave: "grupo_codigo", rotulo: "Código do grupo", obrigatoria: true, tipo: "texto" },
    { chave: "grupo_nome", rotulo: "Nome do grupo", obrigatoria: true, tipo: "texto" },
    { chave: "tarefa_codigo", rotulo: "Código da tarefa", obrigatoria: true, tipo: "texto" },
    { chave: "tarefa_descricao", rotulo: "Descrição da tarefa", obrigatoria: true, tipo: "texto" },
    { chave: "unidade", rotulo: "Unidade", obrigatoria: true, tipo: "texto" },
    { chave: "quantidade_orcada", rotulo: "Quantidade orçada", obrigatoria: true, tipo: "numero" },
    { chave: "preco_unitario_sem_bdi", rotulo: "Preço unit. sem BDI", obrigatoria: false, tipo: "numero" },
    { chave: "preco_unitario_com_bdi", rotulo: "Preço unit. com BDI", obrigatoria: true, tipo: "numero" },
    { chave: "custo_mao_obra", rotulo: "Custo mão de obra", obrigatoria: false, tipo: "numero" },
    { chave: "custo_mao_obra_terceirizada", rotulo: "Custo mão de obra terceirizada", obrigatoria: false, tipo: "numero" },
    { chave: "custo_servicos", rotulo: "Custo serviços", obrigatoria: false, tipo: "numero" },
    { chave: "custo_materiais", rotulo: "Custo materiais", obrigatoria: false, tipo: "numero" },
    { chave: "codigo_apropriacao_rm", rotulo: "Código apropriação RM", obrigatoria: false, tipo: "texto" },
    { chave: "descricao_apropriacao", rotulo: "Descrição apropriação", obrigatoria: false, tipo: "texto" },
  ],
  composicoes: [
    { chave: "tarefa_codigo", rotulo: "Código da tarefa", obrigatoria: true, tipo: "texto" },
    { chave: "composicao_codigo", rotulo: "Código da composição", obrigatoria: true, tipo: "texto" },
    { chave: "composicao_descricao", rotulo: "Descrição da composição", obrigatoria: true, tipo: "texto" },
    { chave: "insumo_codigo", rotulo: "Código do insumo", obrigatoria: true, tipo: "texto" },
    { chave: "insumo_descricao", rotulo: "Descrição do insumo", obrigatoria: true, tipo: "texto" },
    { chave: "insumo_unidade", rotulo: "Unidade do insumo", obrigatoria: true, tipo: "texto" },
    {
      chave: "insumo_tipo",
      rotulo: "Tipo do insumo",
      obrigatoria: true,
      tipo: "enum",
      opcoes: ["MATERIAL", "MAO_DE_OBRA", "MAO_DE_OBRA_TERCEIRIZADA", "EQUIPAMENTO", "SERVICO", "OUTRO"],
    },
    { chave: "banco_origem", rotulo: "Banco de origem", obrigatoria: false, tipo: "texto" },
    { chave: "coeficiente", rotulo: "Coeficiente", obrigatoria: true, tipo: "numero" },
    { chave: "preco_unitario", rotulo: "Preço unitário", obrigatoria: true, tipo: "numero" },
  ],
  "orcamento-rm": [
    { chave: "codigo", rotulo: "Código", obrigatoria: true, tipo: "texto" },
    { chave: "descricao", rotulo: "Descrição", obrigatoria: true, tipo: "texto" },
    { chave: "codigo_apropriacao", rotulo: "Código de apropriação", obrigatoria: true, tipo: "texto" },
    { chave: "codigo_pai", rotulo: "Código do nível pai", obrigatoria: false, tipo: "texto" },
    { chave: "nivel_hierarquico", rotulo: "Nível hierárquico", obrigatoria: true, tipo: "numero" },
    { chave: "unidade", rotulo: "Unidade", obrigatoria: true, tipo: "texto" },
    { chave: "quantidade", rotulo: "Quantidade", obrigatoria: true, tipo: "numero" },
    { chave: "custo_total", rotulo: "Custo total", obrigatoria: true, tipo: "numero" },
  ],
  "de-para": [
    { chave: "tarefa_executiva_codigo", rotulo: "Código da tarefa executiva", obrigatoria: true, tipo: "texto" },
    { chave: "tarefa_rm_codigo", rotulo: "Código da tarefa RM", obrigatoria: true, tipo: "texto" },
    { chave: "percentual_rateio", rotulo: "Percentual de rateio", obrigatoria: true, tipo: "numero" },
    {
      chave: "origem_mapeamento",
      rotulo: "Origem do mapeamento",
      obrigatoria: false,
      tipo: "enum",
      opcoes: ["MANUAL", "IMPORTADO"],
    },
  ],
  "modelos-contratacao": [
    { chave: "codigo", rotulo: "Código", obrigatoria: true, tipo: "texto" },
    { chave: "nome", rotulo: "Nome", obrigatoria: true, tipo: "texto" },
    { chave: "categoria", rotulo: "Categoria", obrigatoria: false, tipo: "texto" },
    { chave: "descricao", rotulo: "Descrição", obrigatoria: false, tipo: "texto" },
    { chave: "mostrar_precos", rotulo: "Mostrar preços (SIM/NAO)", obrigatoria: true, tipo: "enum", opcoes: ["SIM", "NAO"] },
    {
      chave: "layout_cabeca",
      rotulo: "Layout das cabeças",
      obrigatoria: true,
      tipo: "enum",
      opcoes: ["DETALHADO", "TITULO_SECAO", "SEM_AGRUPAMENTO"],
    },
  ],
};
