"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { LayoutCabecaExportacao } from "@prisma/client";

export async function criarModelo(input: {
  codigo: string;
  nome: string;
  categoria?: string;
  descricao?: string;
  mostrarPrecos: boolean;
  layoutCabeca: LayoutCabecaExportacao;
}) {
  await prisma.modeloContratacao.create({
    data: {
      codigo: input.codigo.trim(),
      nome: input.nome.trim(),
      categoria: input.categoria?.trim() || null,
      descricao: input.descricao?.trim() || null,
      mostrarPrecos: input.mostrarPrecos,
      layoutCabeca: input.layoutCabeca,
      demonstrativo: true,
    },
  });
  revalidatePath("/administracao/modelos");
}

export async function alternarStatusModelo(modeloId: string, status: "ATIVO" | "INATIVO") {
  await prisma.modeloContratacao.update({ where: { id: modeloId }, data: { status } });
  revalidatePath("/administracao/modelos");
}
