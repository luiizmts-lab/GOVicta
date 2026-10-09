import Papa from "papaparse";
import type { LinhaBruta } from "./types";

export function parseCsvTexto(texto: string): { cabecalhos: string[]; linhas: LinhaBruta[] } {
  const resultado = Papa.parse<LinhaBruta>(texto, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const cabecalhos = resultado.meta.fields ?? [];
  return { cabecalhos, linhas: resultado.data };
}

/** Compara nomes de coluna ignorando maiúsculas/acentos/espaços para sugerir o mapeamento automático. */
export function normalizarNomeColuna(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Converte texto numérico pt-BR ("1.234,56") ou internacional ("1234.56") em number. */
export function parseNumero(valor: string | undefined | null): number | null {
  if (valor === undefined || valor === null) return null;
  const limpo = valor.trim();
  if (limpo === "") return null;

  let normalizado = limpo;
  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  if (temVirgula && temPonto) {
    // "1.234,56" -> remove separador de milhar, vírgula vira ponto decimal
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    normalizado = limpo.replace(",", ".");
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
