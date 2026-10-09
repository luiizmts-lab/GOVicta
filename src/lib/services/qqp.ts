import { prisma } from "@/lib/prisma";

export type ApropriacaoView = {
  tarefaRmCodigo: string;
  tarefaRmDescricao: string;
  percentualRateio: number;
};

export type ItemQqpView = {
  id: string;
  cabecaId: string | null;
  tipoOrigem: "TAREFA" | "INSUMO";
  tarefaExecutivaId: string;
  itemComposicaoId: string | null;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidadeBase: number;
  precoUnitario: number;
  quantidadeSolicitada: number;
  ordem: number;
  apropriacoes: ApropriacaoView[];
};

export type CabecaView = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
};

export async function getQqpDetalhado(qqpId: string) {
  const qqp = await prisma.qQP.findUnique({
    where: { id: qqpId },
    include: {
      registroGestao: { include: { obra: true, solicitante: true } },
      cabecas: { orderBy: { ordem: "asc" } },
      itens: {
        orderBy: { ordem: "asc" },
        include: { apropriacoes: { include: { tarefaRm: true } } },
      },
    },
  });

  if (!qqp) return null;

  const itens: ItemQqpView[] = qqp.itens.map((item) => ({
    id: item.id,
    cabecaId: item.cabecaId,
    tipoOrigem: item.tipoOrigem,
    tarefaExecutivaId: item.tarefaExecutivaId,
    itemComposicaoId: item.itemComposicaoId,
    codigo: item.codigoOrigemSnapshot,
    descricao: item.descricaoSnapshot,
    unidade: item.unidadeSnapshot,
    quantidadeBase: Number(item.quantidadeBaseSnapshot),
    precoUnitario: Number(item.precoUnitarioSnapshot),
    quantidadeSolicitada: Number(item.quantidadeSolicitada),
    ordem: item.ordem,
    apropriacoes: item.apropriacoes.map((a) => ({
      tarefaRmCodigo: a.tarefaRm.codigo,
      tarefaRmDescricao: a.tarefaRm.descricao,
      percentualRateio: Number(a.percentualRateio),
    })),
  }));

  const cabecas: CabecaView[] = qqp.cabecas.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nome: c.nome,
    descricao: c.descricao,
    ordem: c.ordem,
  }));

  return {
    id: qqp.id,
    observacoes: qqp.observacoes,
    revisaoOrcamentoId: qqp.revisaoOrcamentoId,
    registro: {
      id: qqp.registroGestao.id,
      numero: qqp.registroGestao.numero,
      descricao: qqp.registroGestao.descricao,
      objetivo: qqp.registroGestao.objetivo,
      resumoObjeto: qqp.registroGestao.resumoObjeto,
      status: qqp.registroGestao.status,
      dataSolicitacao: qqp.registroGestao.dataSolicitacao,
      obraId: qqp.registroGestao.obraId,
      obraCodigo: qqp.registroGestao.obra.codigo,
      obraNome: qqp.registroGestao.obra.nome,
      solicitante: qqp.registroGestao.solicitante?.nome ?? qqp.registroGestao.solicitante?.email ?? null,
    },
    itens,
    cabecas,
  };
}

export type QqpDetalhado = NonNullable<Awaited<ReturnType<typeof getQqpDetalhado>>>;
