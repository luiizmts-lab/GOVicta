import { prisma } from "@/lib/prisma";
import { getRevisaoAtiva } from "@/lib/obra";
import { valorQqp } from "@/lib/services/calc";

export async function getDashboardData(obraId: string) {
  const [revisaoExecutivo, revisaoRm] = await Promise.all([
    getRevisaoAtiva(obraId, "EXECUTIVO"),
    getRevisaoAtiva(obraId, "RM"),
  ]);

  if (!revisaoExecutivo) {
    return null;
  }

  const [tarefas, grupos, registros, tarefasRmRaiz] = await Promise.all([
    prisma.tarefaExecutiva.findMany({
      where: { revisaoId: revisaoExecutivo.id },
      include: { deParas: true, grupo: true },
    }),
    prisma.grupoOrcamentario.findMany({ where: { revisaoId: revisaoExecutivo.id } }),
    prisma.registroGestao.findMany({
      where: { obraId, tipoRegistro: "QQP" },
      include: { qqp: { include: { itens: true } } },
    }),
    revisaoRm
      ? prisma.tarefaRM.findMany({ where: { revisaoId: revisaoRm.id, nivelHierarquico: 1 } })
      : Promise.resolve([]),
  ]);

  const totalExecutivo = tarefas.reduce((acc, t) => acc + Number(t.valorTotal), 0);
  const totalRm = tarefasRmRaiz.reduce((acc, t) => acc + Number(t.custoTotal), 0);
  const tarefasSemDePara = tarefas.filter((t) => t.deParas.length === 0).length;

  const porGrupo = grupos.map((grupo) => ({
    grupo: grupo.nome,
    valor: tarefas
      .filter((t) => t.grupoId === grupo.id)
      .reduce((acc, t) => acc + Number(t.valorTotal), 0),
  }));

  const statusCount = new Map<string, number>();
  for (const registro of registros) {
    statusCount.set(registro.status, (statusCount.get(registro.status) ?? 0) + 1);
  }

  const totalSolicitado = registros.reduce((acc, registro) => {
    if (!registro.qqp) return acc;
    return acc + Number(valorQqp(registro.qqp.itens));
  }, 0);

  return {
    totalExecutivo,
    totalRm,
    totalSolicitado,
    qtdQqps: registros.length,
    tarefasSemDePara,
    totalTarefas: tarefas.length,
    porGrupo,
    porStatus: Array.from(statusCount.entries()).map(([status, quantidade]) => ({
      status,
      quantidade,
    })),
  };
}
