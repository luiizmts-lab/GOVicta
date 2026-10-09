"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { OBRA_COOKIE } from "@/lib/obra";
import { requireUserId } from "@/lib/auth";

export async function setObraAtiva(obraId: string) {
  await requireUserId();
  const cookieStore = await cookies();
  cookieStore.set(OBRA_COOKIE, obraId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function criarObra(input: {
  codigo: string;
  nome: string;
  codigoRm?: string;
  responsavel?: string;
}) {
  await requireUserId();
  const obra = await prisma.obra.create({
    data: {
      codigo: input.codigo.trim(),
      nome: input.nome.trim(),
      codigoRm: input.codigoRm?.trim() || null,
      responsavel: input.responsavel?.trim() || null,
    },
  });
  revalidatePath("/administracao/obras");
  return obra;
}
