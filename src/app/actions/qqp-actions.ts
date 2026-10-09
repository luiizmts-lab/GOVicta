"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getObraAtiva, getRevisaoAtiva } from "@/lib/obra";
import { requireUserId } from "@/lib/auth";
import type { StatusRegistro } from "@prisma/client";

async function proximoNumeroQqp(obraId: string) {
  const total = await prisma.registroGestao.count({ where: { obraId, tipoRegistro: "QQP" } });
  return `QQP-${String(total + 1).padStart(4, "0")}`;
}

function erroNovoQqp(mensagem: string): never {
  redirect(`/registros/qqp/novo?erro=${encodeURIComponent(mensagem)}`);
}

export async function criarRegistroQqp(formData: FormData) {
  const usuarioId = await requireUserId();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const resumoObjeto = String(formData.get("resumoObjeto") ?? "").trim();

  if (!descricao) erroNovoQqp("Informe a descrição da contratação.");

  const obra = await getObraAtiva();
  if (!obra) erroNovoQqp("Selecione uma obra antes de criar um QQP.");

  const revisaoExecutivo = await getRevisaoAtiva(obra.id, "EXECUTIVO");
  if (!revisaoExecutivo) {
    erroNovoQqp("A obra selecionada não possui revisão orçamentária executiva ativa.");
  }

  const numero = await proximoNumeroQqp(obra.id);

  const registro = await prisma.registroGestao.create({
    data: {
      obraId: obra.id,
      numero,
      tipoRegistro: "QQP",
      descricao,
      objetivo: objetivo || null,
      resumoObjeto: resumoObjeto || null,
      dataSolicitacao: new Date(),
      solicitanteId: usuarioId,
      status: "RASCUNHO",
      qqp: {
        create: {
          revisaoOrcamentoId: revisaoExecutivo.id,
        },
      },
    },
    include: { qqp: true },
  });

  revalidatePath("/registros");
  redirect(`/registros/qqp/${registro.qqp!.id}`);
}

async function assertTarefaLivreDeConflito(qqpId: string, tarefaExecutivaId: string) {
  const existentes = await prisma.itemQQP.findMany({
    where: { qqpId, tarefaExecutivaId },
    select: { itemComposicaoId: true },
  });
  return existentes;
}

export type ResultadoAcao = { ok: true } | { ok: false; error: string };

export async function adicionarTarefaCompleta(
  qqpId: string,
  tarefaExecutivaId: string
): Promise<ResultadoAcao> {
  await requireUserId();
  const existentes = await assertTarefaLivreDeConflito(qqpId, tarefaExecutivaId);
  if (existentes.length > 0) {
    return {
      ok: false,
      error:
        "Esta tarefa já tem itens adicionados a este QQP (completa ou insumos) — remova-os antes de adicionar novamente.",
    };
  }

  const tarefa = await prisma.tarefaExecutiva.findUniqueOrThrow({ where: { id: tarefaExecutivaId } });

  const item = await prisma.itemQQP.create({
    data: {
      qqpId,
      tipoOrigem: "TAREFA",
      tarefaExecutivaId,
      codigoOrigemSnapshot: tarefa.codigo,
      descricaoSnapshot: tarefa.descricao,
      unidadeSnapshot: tarefa.unidade,
      quantidadeBaseSnapshot: tarefa.quantidadeOrcada,
      precoUnitarioSnapshot: tarefa.precoUnitarioComBdi,
      quantidadeSolicitada: tarefa.quantidadeOrcada,
      ordem: await prisma.itemQQP.count({ where: { qqpId } }),
    },
  });

  await copiarApropriacoesDeParaItem(item.id, tarefaExecutivaId);
  revalidatePath(`/registros/qqp/${qqpId}`);
  return { ok: true };
}

export async function adicionarInsumo(
  qqpId: string,
  tarefaExecutivaId: string,
  itemComposicaoId: string
): Promise<ResultadoAcao> {
  await requireUserId();
  const existentes = await assertTarefaLivreDeConflito(qqpId, tarefaExecutivaId);
  if (existentes.some((e) => e.itemComposicaoId === null)) {
    return {
      ok: false,
      error: "A tarefa completa já foi adicionada a este QQP — remova-a antes de adicionar insumos individuais.",
    };
  }
  if (existentes.some((e) => e.itemComposicaoId === itemComposicaoId)) {
    return { ok: false, error: "Este insumo já foi adicionado a este QQP." };
  }

  const [tarefa, itemComposicao] = await Promise.all([
    prisma.tarefaExecutiva.findUniqueOrThrow({ where: { id: tarefaExecutivaId } }),
    prisma.itemComposicao.findUniqueOrThrow({
      where: { id: itemComposicaoId },
      include: { insumo: true },
    }),
  ]);

  const quantidadeBase = Number(tarefa.quantidadeOrcada) * Number(itemComposicao.coeficiente);

  const item = await prisma.itemQQP.create({
    data: {
      qqpId,
      tipoOrigem: "INSUMO",
      tarefaExecutivaId,
      itemComposicaoId,
      codigoOrigemSnapshot: itemComposicao.insumo.codigo,
      descricaoSnapshot: `${itemComposicao.insumo.descricao} (de ${tarefa.codigo})`,
      unidadeSnapshot: itemComposicao.insumo.unidade,
      quantidadeBaseSnapshot: quantidadeBase,
      precoUnitarioSnapshot: itemComposicao.precoUnitario,
      quantidadeSolicitada: quantidadeBase,
      ordem: await prisma.itemQQP.count({ where: { qqpId } }),
    },
  });

  await copiarApropriacoesDeParaItem(item.id, tarefaExecutivaId);
  revalidatePath(`/registros/qqp/${qqpId}`);
  return { ok: true };
}

async function copiarApropriacoesDeParaItem(itemQqpId: string, tarefaExecutivaId: string) {
  const deParas = await prisma.deParaOrcamentario.findMany({ where: { tarefaExecutivaId } });
  if (deParas.length === 0) return;

  await prisma.apropriacaoItemQQP.createMany({
    data: deParas.map((dp) => ({
      itemQqpId,
      tarefaRmId: dp.tarefaRmId,
      percentualRateio: dp.percentualRateio,
      valorRateado: dp.valorRateado,
    })),
  });
}

export async function removerItem(itemQqpId: string) {
  await requireUserId();
  const item = await prisma.itemQQP.delete({ where: { id: itemQqpId } });
  revalidatePath(`/registros/qqp/${item.qqpId}`);
}

export async function atualizarQuantidadeSolicitada(
  itemQqpId: string,
  quantidade: number
): Promise<ResultadoAcao> {
  await requireUserId();
  if (!Number.isFinite(quantidade) || quantidade < 0) {
    return { ok: false, error: "Quantidade inválida." };
  }
  const item = await prisma.itemQQP.update({
    where: { id: itemQqpId },
    data: { quantidadeSolicitada: quantidade },
  });
  revalidatePath(`/registros/qqp/${item.qqpId}`);
  return { ok: true };
}

export async function atualizarFatorEscopo(itemQqpId: string, fatorEscopo: number): Promise<ResultadoAcao> {
  await requireUserId();
  if (!Number.isFinite(fatorEscopo) || fatorEscopo <= 0) {
    return { ok: false, error: "O fator de escopo deve ser maior que zero." };
  }
  const item = await prisma.itemQQP.update({
    where: { id: itemQqpId },
    data: { fatorEscopo },
  });
  revalidatePath(`/registros/qqp/${item.qqpId}`);
  return { ok: true };
}

export async function criarCabeca(qqpId: string, nome: string): Promise<ResultadoAcao> {
  await requireUserId();
  if (!nome.trim()) return { ok: false, error: "Informe um nome para a cabeça de contratação." };
  const total = await prisma.cabecaContratacao.count({ where: { qqpId } });
  const codigo = `CAB-${String(total + 1).padStart(2, "0")}`;
  await prisma.cabecaContratacao.create({
    data: { qqpId, codigo, nome: nome.trim(), ordem: total },
  });
  revalidatePath(`/registros/qqp/${qqpId}`);
  return { ok: true };
}

export async function renomearCabeca(cabecaId: string, nome: string): Promise<ResultadoAcao> {
  await requireUserId();
  if (!nome.trim()) return { ok: false, error: "O nome da cabeça não pode ser vazio." };
  const cabeca = await prisma.cabecaContratacao.update({
    where: { id: cabecaId },
    data: { nome: nome.trim() },
  });
  revalidatePath(`/registros/qqp/${cabeca.qqpId}`);
  return { ok: true };
}

export async function excluirCabeca(cabecaId: string) {
  await requireUserId();
  const cabeca = await prisma.cabecaContratacao.findUniqueOrThrow({ where: { id: cabecaId } });
  await prisma.$transaction([
    prisma.itemQQP.updateMany({ where: { cabecaId }, data: { cabecaId: null } }),
    prisma.cabecaContratacao.delete({ where: { id: cabecaId } }),
  ]);
  revalidatePath(`/registros/qqp/${cabeca.qqpId}`);
}

export async function moverItemParaCabeca(itemQqpId: string, cabecaId: string | null) {
  await requireUserId();
  const item = await prisma.itemQQP.update({
    where: { id: itemQqpId },
    data: { cabecaId },
  });
  revalidatePath(`/registros/qqp/${item.qqpId}`);
}

export async function atualizarStatusRegistro(registroGestaoId: string, status: StatusRegistro) {
  await requireUserId();
  const registro = await prisma.registroGestao.update({
    where: { id: registroGestaoId },
    data: { status },
    include: { qqp: true },
  });
  revalidatePath(`/registros`);
  if (registro.qqp) revalidatePath(`/registros/qqp/${registro.qqp.id}`);
}

export async function atualizarObservacoesQqp(qqpId: string, observacoes: string) {
  await requireUserId();
  await prisma.qQP.update({ where: { id: qqpId }, data: { observacoes } });
  revalidatePath(`/registros/qqp/${qqpId}`);
}
