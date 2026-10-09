import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const OBRA_COOKIE = "obraId";

export async function listObras() {
  return prisma.obra.findMany({ orderBy: { codigo: "asc" } });
}

/** Obra selecionada no seletor do topo; cai para a primeira obra cadastrada se nada estiver escolhido ainda. */
export async function getObraAtiva() {
  const cookieStore = await cookies();
  const obraId = cookieStore.get(OBRA_COOKIE)?.value;

  if (obraId) {
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (obra) return obra;
  }

  return prisma.obra.findFirst({ orderBy: { codigo: "asc" } });
}

export async function getRevisaoAtiva(obraId: string, tipoOrcamento: "EXECUTIVO" | "RM") {
  return prisma.revisaoOrcamentaria.findFirst({
    where: { obraId, tipoOrcamento, ativa: true },
    orderBy: { numeroRevisao: "desc" },
  });
}
