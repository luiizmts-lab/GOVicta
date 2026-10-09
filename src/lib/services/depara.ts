import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRevisaoAtiva } from "@/lib/obra";
import { calcularIndicadoresDePara } from "@/lib/services/calc";

export type LinkInfo = {
  deParaId: string;
  outroId: string;
  outroCodigo: string;
  outroDescricao: string;
  percentualRateio: number;
  valorRateado: number;
  status: string;
};

export type ExecutivaComLinks = {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  valorTotal: number;
  grupoNome: string | null;
  links: LinkInfo[];
};

export type RmComLinks = {
  id: string;
  codigo: string;
  descricao: string;
  custoTotal: number;
  nivelHierarquico: number;
  links: LinkInfo[];
};

export async function getDeParaData(obraId: string) {
  const [revisaoExec, revisaoRm] = await Promise.all([
    getRevisaoAtiva(obraId, "EXECUTIVO"),
    getRevisaoAtiva(obraId, "RM"),
  ]);

  if (!revisaoExec || !revisaoRm) return null;

  const [tarefasExec, tarefasRm, tarefasRmRaiz] = await Promise.all([
    prisma.tarefaExecutiva.findMany({
      where: { revisaoId: revisaoExec.id },
      orderBy: { codigo: "asc" },
      include: { grupo: true, deParas: { include: { tarefaRm: true } } },
    }),
    prisma.tarefaRM.findMany({
      where: { revisaoId: revisaoRm.id, nivelHierarquico: 2 },
      orderBy: { codigo: "asc" },
      include: { deParas: { include: { tarefaExecutiva: true } } },
    }),
    prisma.tarefaRM.findMany({ where: { revisaoId: revisaoRm.id, nivelHierarquico: 1 } }),
  ]);

  const executivas: ExecutivaComLinks[] = tarefasExec.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    descricao: t.descricao,
    unidade: t.unidade,
    valorTotal: Number(t.valorTotal),
    grupoNome: t.grupo?.nome ?? null,
    links: t.deParas.map((dp) => ({
      deParaId: dp.id,
      outroId: dp.tarefaRmId,
      outroCodigo: dp.tarefaRm.codigo,
      outroDescricao: dp.tarefaRm.descricao,
      percentualRateio: Number(dp.percentualRateio),
      valorRateado: Number(dp.valorRateado),
      status: dp.status,
    })),
  }));

  const rms: RmComLinks[] = tarefasRm.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    descricao: t.descricao,
    custoTotal: Number(t.custoTotal),
    nivelHierarquico: t.nivelHierarquico,
    links: t.deParas.map((dp) => ({
      deParaId: dp.id,
      outroId: dp.tarefaExecutivaId,
      outroCodigo: dp.tarefaExecutiva.codigo,
      outroDescricao: dp.tarefaExecutiva.descricao,
      percentualRateio: Number(dp.percentualRateio),
      valorRateado: Number(dp.valorRateado),
      status: dp.status,
    })),
  }));

  const totalExecutivo = executivas.reduce((acc, t) => acc + t.valorTotal, 0);
  const totalRm = tarefasRmRaiz.reduce((acc, t) => acc + Number(t.custoTotal), 0);
  const tarefasSemDePara = executivas.filter((t) => t.links.length === 0).length;

  const indicadores = calcularIndicadoresDePara({
    totalExecutivo: new Prisma.Decimal(totalExecutivo),
    totalRm: new Prisma.Decimal(totalRm),
    tarefasSemDePara,
    totalTarefas: executivas.length,
  });

  return {
    executivas,
    rms,
    indicadores: {
      totalExecutivo,
      totalRm,
      diferencaAbsoluta: Number(indicadores.diferencaAbsoluta),
      diferencaPercentual: indicadores.diferencaPercentual ? Number(indicadores.diferencaPercentual) : null,
      tarefasSemDePara,
      percentualConciliado: Number(indicadores.percentualConciliado),
    },
  };
}
