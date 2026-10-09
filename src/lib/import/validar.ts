import { prisma } from "@/lib/prisma";
import { getRevisaoAtiva } from "@/lib/obra";
import { COLUNAS } from "./schemas";
import { parseNumero } from "./parse";
import type {
  ColunaDef,
  ImportTipo,
  LinhaBruta,
  LinhaValidada,
  Mapeamento,
  ResultadoValidacao,
} from "./types";

function lerCampo(linha: LinhaBruta, mapeamento: Mapeamento, chave: string): string {
  const coluna = mapeamento[chave];
  if (!coluna) return "";
  return (linha[coluna] ?? "").trim();
}

function validarCamposBasicos(
  colunas: ColunaDef[],
  linha: LinhaBruta,
  mapeamento: Mapeamento
): { dados: Record<string, string | number | null>; erros: string[] } {
  const dados: Record<string, string | number | null> = {};
  const erros: string[] = [];

  for (const coluna of colunas) {
    const bruto = lerCampo(linha, mapeamento, coluna.chave);

    if (!bruto) {
      if (coluna.obrigatoria) erros.push(`"${coluna.rotulo}" é obrigatório.`);
      dados[coluna.chave] = null;
      continue;
    }

    if (coluna.tipo === "numero") {
      const numero = parseNumero(bruto);
      if (numero === null) erros.push(`"${coluna.rotulo}" deve ser numérico (valor recebido: "${bruto}").`);
      dados[coluna.chave] = numero;
    } else if (coluna.tipo === "enum") {
      const valor = bruto.toUpperCase();
      if (coluna.opcoes && !coluna.opcoes.includes(valor)) {
        erros.push(`"${coluna.rotulo}" deve ser um de: ${coluna.opcoes.join(", ")} (valor recebido: "${bruto}").`);
      }
      dados[coluna.chave] = valor;
    } else {
      dados[coluna.chave] = bruto;
    }
  }

  return { dados, erros };
}

async function validarOrcamentoExecutivo(linhas: LinhaBruta[], mapeamento: Mapeamento): Promise<LinhaValidada[]> {
  const colunas = COLUNAS["orcamento-executivo"];
  const codigosVistos = new Set<string>();

  return linhas.map((linha, idx) => {
    const { dados, erros } = validarCamposBasicos(colunas, linha, mapeamento);
    const codigo = dados.tarefa_codigo as string | null;
    if (codigo) {
      if (codigosVistos.has(codigo)) erros.push(`Código de tarefa "${codigo}" duplicado no arquivo.`);
      codigosVistos.add(codigo);
    }
    return { numeroLinha: idx + 2, dados, erros };
  });
}

async function validarComposicoes(
  linhas: LinhaBruta[],
  mapeamento: Mapeamento,
  obraId: string
): Promise<LinhaValidada[]> {
  const colunas = COLUNAS.composicoes;
  const revisao = await getRevisaoAtiva(obraId, "EXECUTIVO");
  const codigosTarefa = revisao
    ? new Set(
        (await prisma.tarefaExecutiva.findMany({ where: { revisaoId: revisao.id }, select: { codigo: true } })).map(
          (t) => t.codigo
        )
      )
    : new Set<string>();

  return linhas.map((linha, idx) => {
    const { dados, erros } = validarCamposBasicos(colunas, linha, mapeamento);
    if (!revisao) {
      erros.push("A obra não possui revisão de orçamento executivo ativa — importe o orçamento executivo primeiro.");
    } else {
      const tarefaCodigo = dados.tarefa_codigo as string | null;
      if (tarefaCodigo && !codigosTarefa.has(tarefaCodigo)) {
        erros.push(`Tarefa "${tarefaCodigo}" não encontrada na revisão executiva ativa desta obra.`);
      }
    }
    return { numeroLinha: idx + 2, dados, erros };
  });
}

function validarOrcamentoRm(linhas: LinhaBruta[], mapeamento: Mapeamento): LinhaValidada[] {
  const colunas = COLUNAS["orcamento-rm"];
  const parciais = linhas.map((linha, idx) => {
    const { dados, erros } = validarCamposBasicos(colunas, linha, mapeamento);
    return { numeroLinha: idx + 2, dados, erros };
  });

  const codigos = new Set(parciais.map((l) => l.dados.codigo as string).filter(Boolean));
  const codigosVistos = new Set<string>();

  for (const linha of parciais) {
    const codigo = linha.dados.codigo as string | null;
    if (codigo) {
      if (codigosVistos.has(codigo)) linha.erros.push(`Código "${codigo}" duplicado no arquivo.`);
      codigosVistos.add(codigo);
    }
    const codigoPai = linha.dados.codigo_pai as string | null;
    if (codigoPai && !codigos.has(codigoPai)) {
      linha.erros.push(`Código do nível pai "${codigoPai}" não existe entre as linhas deste arquivo.`);
    }
  }

  return parciais;
}

async function validarDePara(
  linhas: LinhaBruta[],
  mapeamento: Mapeamento,
  obraId: string
): Promise<LinhaValidada[]> {
  const colunas = COLUNAS["de-para"];
  const [revisaoExec, revisaoRm] = await Promise.all([
    getRevisaoAtiva(obraId, "EXECUTIVO"),
    getRevisaoAtiva(obraId, "RM"),
  ]);

  const codigosExec = revisaoExec
    ? new Set(
        (
          await prisma.tarefaExecutiva.findMany({ where: { revisaoId: revisaoExec.id }, select: { codigo: true } })
        ).map((t) => t.codigo)
      )
    : new Set<string>();
  const codigosRm = revisaoRm
    ? new Set((await prisma.tarefaRM.findMany({ where: { revisaoId: revisaoRm.id }, select: { codigo: true } })).map((t) => t.codigo))
    : new Set<string>();

  return linhas.map((linha, idx) => {
    const { dados, erros } = validarCamposBasicos(colunas, linha, mapeamento);
    if (!revisaoExec || !revisaoRm) {
      erros.push("A obra precisa ter orçamento executivo e orçamento RM importados antes do DE-PARA.");
    } else {
      const codExec = dados.tarefa_executiva_codigo as string | null;
      const codRm = dados.tarefa_rm_codigo as string | null;
      if (codExec && !codigosExec.has(codExec)) {
        erros.push(`Tarefa executiva "${codExec}" não encontrada na revisão ativa.`);
      }
      if (codRm && !codigosRm.has(codRm)) {
        erros.push(`Tarefa RM "${codRm}" não encontrada na revisão ativa.`);
      }
    }
    if (!dados.origem_mapeamento) dados.origem_mapeamento = "IMPORTADO";
    return { numeroLinha: idx + 2, dados, erros };
  });
}

function validarModelosContratacao(linhas: LinhaBruta[], mapeamento: Mapeamento): LinhaValidada[] {
  const colunas = COLUNAS["modelos-contratacao"];
  const codigosVistos = new Set<string>();

  return linhas.map((linha, idx) => {
    const { dados, erros } = validarCamposBasicos(colunas, linha, mapeamento);
    const codigo = dados.codigo as string | null;
    if (codigo) {
      if (codigosVistos.has(codigo)) erros.push(`Código "${codigo}" duplicado no arquivo.`);
      codigosVistos.add(codigo);
    }
    return { numeroLinha: idx + 2, dados, erros };
  });
}

export async function validarImportacao(
  tipo: ImportTipo,
  linhasBrutas: LinhaBruta[],
  mapeamento: Mapeamento,
  obraId: string | null
): Promise<ResultadoValidacao> {
  const colunas = COLUNAS[tipo];
  let linhas: LinhaValidada[];

  switch (tipo) {
    case "orcamento-executivo":
      linhas = await validarOrcamentoExecutivo(linhasBrutas, mapeamento);
      break;
    case "composicoes":
      linhas = await validarComposicoes(linhasBrutas, mapeamento, obraId!);
      break;
    case "orcamento-rm":
      linhas = validarOrcamentoRm(linhasBrutas, mapeamento);
      break;
    case "de-para":
      linhas = await validarDePara(linhasBrutas, mapeamento, obraId!);
      break;
    case "modelos-contratacao":
      linhas = validarModelosContratacao(linhasBrutas, mapeamento);
      break;
  }

  return {
    colunas,
    linhas,
    totalLinhas: linhas.length,
    linhasComErro: linhas.filter((l) => l.erros.length > 0).length,
  };
}
