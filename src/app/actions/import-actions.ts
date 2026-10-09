"use server";

import { revalidatePath } from "next/cache";
import { parseCsvTexto, normalizarNomeColuna } from "@/lib/import/parse";
import { COLUNAS } from "@/lib/import/schemas";
import { validarImportacao } from "@/lib/import/validar";
import { importarDados } from "@/lib/import/importar";
import { requireUserId } from "@/lib/auth";
import type { ImportTipo, LinhaBruta, LinhaValidada, Mapeamento } from "@/lib/import/types";

export async function analisarArquivo(tipo: ImportTipo, formData: FormData) {
  try {
    await requireUserId();
  } catch {
    return { ok: false as const, erro: "Sessão expirada. Faça login novamente." };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return { ok: false as const, erro: "Nenhum arquivo enviado." };
  }
  if (arquivo.size === 0) {
    return { ok: false as const, erro: "O arquivo está vazio." };
  }

  const texto = await arquivo.text();
  const { cabecalhos, linhas } = parseCsvTexto(texto);

  if (linhas.length === 0) {
    return { ok: false as const, erro: "Não foi possível ler nenhuma linha do arquivo." };
  }

  const colunas = COLUNAS[tipo];
  const cabecalhosNormalizados = new Map(cabecalhos.map((c) => [normalizarNomeColuna(c), c]));
  const mapeamentoSugerido: Mapeamento = {};
  for (const coluna of colunas) {
    const encontrado = cabecalhosNormalizados.get(normalizarNomeColuna(coluna.chave));
    mapeamentoSugerido[coluna.chave] = encontrado ?? null;
  }

  return {
    ok: true as const,
    cabecalhos,
    linhas: linhas.slice(0, 2000),
    totalLinhasArquivo: linhas.length,
    mapeamentoSugerido,
  };
}

export async function validarArquivo(
  tipo: ImportTipo,
  obraId: string | null,
  linhasBrutas: LinhaBruta[],
  mapeamento: Mapeamento
) {
  await requireUserId();
  return validarImportacao(tipo, linhasBrutas, mapeamento, obraId);
}

const REVALIDAR: Record<ImportTipo, string[]> = {
  "orcamento-executivo": ["/orcamento-executivo", "/", "/de-para"],
  composicoes: ["/orcamento-executivo"],
  "orcamento-rm": ["/orcamento-rm", "/de-para"],
  "de-para": ["/de-para", "/"],
  "modelos-contratacao": ["/administracao/modelos"],
};

export async function confirmarImportacao(
  tipo: ImportTipo,
  obraId: string | null,
  linhasValidadas: LinhaValidada[]
) {
  try {
    await requireUserId();
  } catch {
    return { ok: false as const, erro: "Sessão expirada. Faça login novamente." };
  }

  if (linhasValidadas.some((l) => l.erros.length > 0)) {
    return { ok: false as const, erro: "Existem linhas com erro — corrija o arquivo e tente novamente." };
  }
  if (linhasValidadas.length === 0) {
    return { ok: false as const, erro: "Nenhuma linha para importar." };
  }

  try {
    const resultado = await importarDados(tipo, obraId, linhasValidadas);
    for (const path of REVALIDAR[tipo]) revalidatePath(path);
    return { ok: true as const, resultado };
  } catch (error) {
    return {
      ok: false as const,
      erro: error instanceof Error ? error.message : "Erro inesperado ao importar os dados.",
    };
  }
}
