import { prisma } from "@/lib/prisma";

export async function listModelosAtivos() {
  return prisma.modeloContratacao.findMany({
    where: { status: "ATIVO" },
    orderBy: { codigo: "asc" },
  });
}

export async function listModelos() {
  return prisma.modeloContratacao.findMany({ orderBy: { codigo: "asc" } });
}

export async function registrarExportacao(params: {
  registroGestaoId: string;
  modeloContratacaoId: string;
  versaoModelo: number;
  usuarioId: string | null;
}) {
  return prisma.exportacaoDocumento.create({ data: params });
}

export async function listExportacoes(registroGestaoId: string) {
  return prisma.exportacaoDocumento.findMany({
    where: { registroGestaoId },
    orderBy: { dataGeracao: "desc" },
    include: { modeloContratacao: true, usuario: true },
  });
}
