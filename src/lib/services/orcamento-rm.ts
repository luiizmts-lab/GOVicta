import { prisma } from "@/lib/prisma";

export type RmNode = {
  id: string;
  codigo: string;
  descricao: string;
  codigoApropriacao: string;
  unidade: string;
  quantidade: number;
  custoTotal: number;
  nivelHierarquico: number;
  filhos: RmNode[];
};

export async function getOrcamentoRmTree(revisaoId: string): Promise<RmNode[]> {
  const tarefas = await prisma.tarefaRM.findMany({
    where: { revisaoId },
    orderBy: { codigo: "asc" },
  });

  const nodes = new Map<string, RmNode>();
  for (const t of tarefas) {
    nodes.set(t.id, {
      id: t.id,
      codigo: t.codigo,
      descricao: t.descricao,
      codigoApropriacao: t.codigoApropriacao,
      unidade: t.unidade,
      quantidade: Number(t.quantidade),
      custoTotal: Number(t.custoTotal),
      nivelHierarquico: t.nivelHierarquico,
      filhos: [],
    });
  }

  const raizes: RmNode[] = [];
  for (const t of tarefas) {
    const node = nodes.get(t.id)!;
    if (t.tarefaPaiId && nodes.has(t.tarefaPaiId)) {
      nodes.get(t.tarefaPaiId)!.filhos.push(node);
    } else {
      raizes.push(node);
    }
  }

  return raizes;
}
