import { Prisma } from "@prisma/client";

type ItemComValor = {
  id: string;
  cabecaId: string | null;
  quantidadeSolicitada: Prisma.Decimal;
  precoUnitarioSnapshot: Prisma.Decimal;
};

const ZERO = new Prisma.Decimal(0);

/**
 * Valor solicitado de um item de QQP. Único lugar do sistema que faz essa
 * multiplicação — nunca persistida como coluna própria, para não divergir
 * do que quantidade/preço realmente dizem.
 */
export function valorItemQqp(item: {
  quantidadeSolicitada: Prisma.Decimal;
  precoUnitarioSnapshot: Prisma.Decimal;
}): Prisma.Decimal {
  return item.quantidadeSolicitada.mul(item.precoUnitarioSnapshot);
}

/** Valor de uma cabeça = soma dos itens vinculados a ela. A cabeça nunca tem preço/quantidade próprios. */
export function valorCabeca(itens: ItemComValor[], cabecaId: string): Prisma.Decimal {
  return itens
    .filter((item) => item.cabecaId === cabecaId)
    .reduce((total, item) => total.add(valorItemQqp(item)), ZERO);
}

/**
 * Valor total do QQP = soma de TODOS os itens (agrupados em cabeça ou não).
 * Nunca somar cabeça + itens, pois a cabeça não carrega valor próprio —
 * isso evitaria dupla contagem.
 */
export function valorQqp(itens: ItemComValor[]): Prisma.Decimal {
  return itens.reduce((total, item) => total.add(valorItemQqp(item)), ZERO);
}

export function itensNaoAgrupados(itens: ItemComValor[]): ItemComValor[] {
  return itens.filter((item) => item.cabecaId === null);
}

export type IndicadoresDePara = {
  totalExecutivo: Prisma.Decimal;
  totalRm: Prisma.Decimal;
  diferencaAbsoluta: Prisma.Decimal;
  diferencaPercentual: Prisma.Decimal | null;
  tarefasSemDePara: number;
  percentualConciliado: Prisma.Decimal;
};

export function calcularIndicadoresDePara(params: {
  totalExecutivo: Prisma.Decimal;
  totalRm: Prisma.Decimal;
  tarefasSemDePara: number;
  totalTarefas: number;
}): IndicadoresDePara {
  const { totalExecutivo, totalRm, tarefasSemDePara, totalTarefas } = params;
  const diferencaAbsoluta = totalExecutivo.sub(totalRm);
  const diferencaPercentual = totalExecutivo.isZero()
    ? null
    : diferencaAbsoluta.div(totalExecutivo).mul(100);
  const percentualConciliado =
    totalTarefas === 0
      ? ZERO
      : new Prisma.Decimal(totalTarefas - tarefasSemDePara)
          .div(totalTarefas)
          .mul(100);

  return {
    totalExecutivo,
    totalRm,
    diferencaAbsoluta,
    diferencaPercentual,
    tarefasSemDePara,
    percentualConciliado,
  };
}

/** Soma de percentualRateio de um item deve bater 100% para contar como totalmente apropriado. */
export function percentualApropriado(apropriacoes: { percentualRateio: Prisma.Decimal }[]): Prisma.Decimal {
  return apropriacoes.reduce((total, a) => total.add(a.percentualRateio), ZERO);
}

/**
 * Valor rateado para uma apropriação RM, sempre recalculado a partir do
 * percentual e do valor ATUAL do item (nunca lido da coluna persistida, que
 * é só um snapshot de criação) — evita ficar defasado quando a quantidade
 * solicitada do item é editada depois.
 */
export function valorApropriacao(item: ItemComValor, percentualRateio: Prisma.Decimal): Prisma.Decimal {
  return valorItemQqp(item).mul(percentualRateio).div(100);
}

type ItemComFatorEscopo = {
  quantidadeBaseSnapshot: Prisma.Decimal;
  precoUnitarioSnapshot: Prisma.Decimal;
  fatorEscopo: Prisma.Decimal;
};

/**
 * Quantidade orçada de referência já reduzida pelo fator de escopo do item.
 * Existe para o caso de um mesmo serviço orçado ser dividido entre vários
 * fornecedores/QQPs: cada um reivindica só uma fatia (ex.: 50%) do orçado,
 * e é contra essa fatia — não o total — que seu desempenho deve ser medido.
 */
export function quantidadeBaseEscopada(item: ItemComFatorEscopo): Prisma.Decimal {
  return item.quantidadeBaseSnapshot.mul(item.fatorEscopo).div(100);
}

/** Valor orçado de referência já reduzido pelo fator de escopo do item. */
export function valorBaseEscopado(item: ItemComFatorEscopo): Prisma.Decimal {
  return quantidadeBaseEscopada(item).mul(item.precoUnitarioSnapshot);
}

/**
 * % do valor base escopado que o valor solicitado representa. 100% = exatamente
 * dentro da fatia orçada; acima disso, a contratação está estourando a fatia
 * que lhe cabe do orçamento (não necessariamente o orçamento inteiro).
 */
export function desempenhoOrcamentoBase(
  item: ItemComFatorEscopo & { quantidadeSolicitada: Prisma.Decimal }
): Prisma.Decimal | null {
  const base = valorBaseEscopado(item);
  if (base.isZero()) return null;
  return valorItemQqp(item).div(base).mul(100);
}
