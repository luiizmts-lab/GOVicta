import { prisma } from "@/lib/prisma";

export type InsumoNode = {
  itemComposicaoId: string;
  insumoId: string;
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: string;
  coeficiente: number;
  precoUnitario: number;
  custoParcial: number;
  quantidadeGlobal: number;
  custoGlobal: number;
};

export type ComposicaoNode = {
  id: string;
  codigo: string;
  descricao: string;
  insumos: InsumoNode[];
};

export type TarefaNode = {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidadeOrcada: number;
  precoUnitarioSemBdi: number | null;
  precoUnitarioComBdi: number;
  valorTotal: number;
  custoMaoObra: number | null;
  custoMaoObraTerceirizada: number | null;
  custoServicos: number | null;
  custoMateriais: number | null;
  codigoApropriacaoRm: string | null;
  descricaoApropriacao: string | null;
  participacaoPercentual: number;
  temDePara: boolean;
  composicoes: ComposicaoNode[];
};

export type GrupoNode = {
  id: string;
  codigo: string;
  nome: string;
  tarefas: TarefaNode[];
  totalGrupo: number;
};

export async function getOrcamentoExecutivoTree(revisaoId: string): Promise<GrupoNode[]> {
  const grupos = await prisma.grupoOrcamentario.findMany({
    where: { revisaoId },
    orderBy: { codigo: "asc" },
    include: {
      tarefas: {
        orderBy: { codigo: "asc" },
        include: {
          deParas: true,
          composicoes: {
            orderBy: { codigo: "asc" },
            include: {
              itens: {
                include: { insumo: true },
              },
            },
          },
        },
      },
    },
  });

  const totalExecutivo = grupos.reduce(
    (acc, grupo) => acc + grupo.tarefas.reduce((a, t) => a + Number(t.valorTotal), 0),
    0
  );

  return grupos.map((grupo) => {
    const tarefas: TarefaNode[] = grupo.tarefas.map((tarefa) => {
      const quantidadeOrcada = Number(tarefa.quantidadeOrcada);
      return {
        id: tarefa.id,
        codigo: tarefa.codigo,
        descricao: tarefa.descricao,
        unidade: tarefa.unidade,
        quantidadeOrcada,
        precoUnitarioSemBdi: tarefa.precoUnitarioSemBdi ? Number(tarefa.precoUnitarioSemBdi) : null,
        precoUnitarioComBdi: Number(tarefa.precoUnitarioComBdi),
        valorTotal: Number(tarefa.valorTotal),
        custoMaoObra: tarefa.custoMaoObra ? Number(tarefa.custoMaoObra) : null,
        custoMaoObraTerceirizada: tarefa.custoMaoObraTerceirizada
          ? Number(tarefa.custoMaoObraTerceirizada)
          : null,
        custoServicos: tarefa.custoServicos ? Number(tarefa.custoServicos) : null,
        custoMateriais: tarefa.custoMateriais ? Number(tarefa.custoMateriais) : null,
        codigoApropriacaoRm: tarefa.codigoApropriacaoRm,
        descricaoApropriacao: tarefa.descricaoApropriacao,
        participacaoPercentual:
          totalExecutivo === 0 ? 0 : (Number(tarefa.valorTotal) / totalExecutivo) * 100,
        temDePara: tarefa.deParas.length > 0,
        composicoes: tarefa.composicoes.map((composicao) => ({
          id: composicao.id,
          codigo: composicao.codigo,
          descricao: composicao.descricao,
          insumos: composicao.itens.map((item) => {
            const coeficiente = Number(item.coeficiente);
            const precoUnitario = Number(item.precoUnitario);
            const quantidadeGlobal = quantidadeOrcada * coeficiente;
            return {
              itemComposicaoId: item.id,
              insumoId: item.insumoId,
              codigo: item.insumo.codigo,
              descricao: item.insumo.descricao,
              unidade: item.insumo.unidade,
              tipo: item.insumo.tipo,
              coeficiente,
              precoUnitario,
              custoParcial: Number(item.custoParcial),
              quantidadeGlobal,
              custoGlobal: quantidadeGlobal * precoUnitario,
            };
          }),
        })),
      };
    });

    return {
      id: grupo.id,
      codigo: grupo.codigo,
      nome: grupo.nome,
      tarefas,
      totalGrupo: tarefas.reduce((acc, t) => acc + t.valorTotal, 0),
    };
  });
}
