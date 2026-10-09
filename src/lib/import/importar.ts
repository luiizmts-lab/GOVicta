import { prisma } from "@/lib/prisma";
import { getRevisaoAtiva } from "@/lib/obra";
import type { TipoInsumo, LayoutCabecaExportacao } from "@prisma/client";
import type { ImportTipo, LinhaValidada, ResultadoImportacao } from "./types";

const TX_OPTIONS = { timeout: 60000 };

async function importarOrcamentoExecutivo(obraId: string, linhas: LinhaValidada[]): Promise<ResultadoImportacao> {
  return prisma.$transaction(async (tx) => {
    const ultimaRevisao = await tx.revisaoOrcamentaria.findFirst({
      where: { obraId, tipoOrcamento: "EXECUTIVO" },
      orderBy: { numeroRevisao: "desc" },
    });
    await tx.revisaoOrcamentaria.updateMany({
      where: { obraId, tipoOrcamento: "EXECUTIVO", ativa: true },
      data: { ativa: false },
    });
    const revisao = await tx.revisaoOrcamentaria.create({
      data: {
        obraId,
        tipoOrcamento: "EXECUTIVO",
        numeroRevisao: (ultimaRevisao?.numeroRevisao ?? 0) + 1,
        dataReferencia: new Date(),
        ativa: true,
      },
    });

    const gruposCriados = new Map<string, string>();

    for (const linha of linhas) {
      const d = linha.dados;
      const grupoCodigo = d.grupo_codigo as string;
      let grupoId = gruposCriados.get(grupoCodigo);
      if (!grupoId) {
        const grupo = await tx.grupoOrcamentario.create({
          data: { revisaoId: revisao.id, codigo: grupoCodigo, nome: d.grupo_nome as string },
        });
        grupoId = grupo.id;
        gruposCriados.set(grupoCodigo, grupoId);
      }

      const quantidade = Number(d.quantidade_orcada);
      const precoComBdi = Number(d.preco_unitario_com_bdi);

      await tx.tarefaExecutiva.create({
        data: {
          revisaoId: revisao.id,
          grupoId,
          codigo: d.tarefa_codigo as string,
          descricao: d.tarefa_descricao as string,
          unidade: d.unidade as string,
          quantidadeOrcada: quantidade,
          precoUnitarioSemBdi: d.preco_unitario_sem_bdi !== null ? Number(d.preco_unitario_sem_bdi) : null,
          precoUnitarioComBdi: precoComBdi,
          valorTotal: quantidade * precoComBdi,
          custoMaoObra: d.custo_mao_obra !== null ? Number(d.custo_mao_obra) : null,
          custoMaoObraTerceirizada:
            d.custo_mao_obra_terceirizada !== null ? Number(d.custo_mao_obra_terceirizada) : null,
          custoServicos: d.custo_servicos !== null ? Number(d.custo_servicos) : null,
          custoMateriais: d.custo_materiais !== null ? Number(d.custo_materiais) : null,
          codigoApropriacaoRm: (d.codigo_apropriacao_rm as string) || null,
          descricaoApropriacao: (d.descricao_apropriacao as string) || null,
        },
      });
    }

    return {
      criados: linhas.length,
      atualizados: 0,
      mensagem: `Revisão executiva nº ${revisao.numeroRevisao} criada com ${linhas.length} tarefas. A revisão anterior foi preservada no histórico.`,
    };
  }, TX_OPTIONS);
}

async function importarComposicoes(obraId: string, linhas: LinhaValidada[]): Promise<ResultadoImportacao> {
  const revisao = await getRevisaoAtiva(obraId, "EXECUTIVO");
  if (!revisao) throw new Error("Revisão executiva ativa não encontrada.");

  let criados = 0;
  let atualizados = 0;

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      const d = linha.dados;
      const tarefa = await tx.tarefaExecutiva.findFirstOrThrow({
        where: { revisaoId: revisao.id, codigo: d.tarefa_codigo as string },
      });

      const composicao = await tx.composicao.upsert({
        where: {
          tarefaExecutivaId_codigo: { tarefaExecutivaId: tarefa.id, codigo: d.composicao_codigo as string },
        },
        create: {
          tarefaExecutivaId: tarefa.id,
          codigo: d.composicao_codigo as string,
          descricao: d.composicao_descricao as string,
        },
        update: { descricao: d.composicao_descricao as string },
      });

      const insumo = await tx.insumo.upsert({
        where: { codigo: d.insumo_codigo as string },
        create: {
          codigo: d.insumo_codigo as string,
          descricao: d.insumo_descricao as string,
          unidade: d.insumo_unidade as string,
          tipo: d.insumo_tipo as TipoInsumo,
          bancoOrigem: (d.banco_origem as string) || null,
        },
        update: {
          descricao: d.insumo_descricao as string,
          unidade: d.insumo_unidade as string,
          tipo: d.insumo_tipo as TipoInsumo,
          bancoOrigem: (d.banco_origem as string) || null,
        },
      });

      const coeficiente = Number(d.coeficiente);
      const precoUnitario = Number(d.preco_unitario);

      const existente = await tx.itemComposicao.findUnique({
        where: { composicaoId_insumoId: { composicaoId: composicao.id, insumoId: insumo.id } },
      });

      await tx.itemComposicao.upsert({
        where: { composicaoId_insumoId: { composicaoId: composicao.id, insumoId: insumo.id } },
        create: {
          composicaoId: composicao.id,
          insumoId: insumo.id,
          coeficiente,
          precoUnitario,
          custoParcial: coeficiente * precoUnitario,
        },
        update: { coeficiente, precoUnitario, custoParcial: coeficiente * precoUnitario },
      });

      if (existente) atualizados++;
      else criados++;
    }
  }, TX_OPTIONS);

  return { criados, atualizados, mensagem: `${criados} itens de composição criados, ${atualizados} atualizados.` };
}

async function importarOrcamentoRm(obraId: string, linhas: LinhaValidada[]): Promise<ResultadoImportacao> {
  return prisma.$transaction(async (tx) => {
    const ultimaRevisao = await tx.revisaoOrcamentaria.findFirst({
      where: { obraId, tipoOrcamento: "RM" },
      orderBy: { numeroRevisao: "desc" },
    });
    await tx.revisaoOrcamentaria.updateMany({
      where: { obraId, tipoOrcamento: "RM", ativa: true },
      data: { ativa: false },
    });
    const revisao = await tx.revisaoOrcamentaria.create({
      data: {
        obraId,
        tipoOrcamento: "RM",
        numeroRevisao: (ultimaRevisao?.numeroRevisao ?? 0) + 1,
        dataReferencia: new Date(),
        ativa: true,
      },
    });

    const idsPorCodigo = new Map<string, string>();

    for (const linha of linhas) {
      const d = linha.dados;
      const tarefa = await tx.tarefaRM.create({
        data: {
          revisaoId: revisao.id,
          codigo: d.codigo as string,
          descricao: d.descricao as string,
          codigoApropriacao: d.codigo_apropriacao as string,
          unidade: d.unidade as string,
          quantidade: Number(d.quantidade),
          custoTotal: Number(d.custo_total),
          nivelHierarquico: Number(d.nivel_hierarquico),
        },
      });
      idsPorCodigo.set(d.codigo as string, tarefa.id);
    }

    for (const linha of linhas) {
      const d = linha.dados;
      const codigoPai = d.codigo_pai as string | null;
      if (!codigoPai) continue;
      const paiId = idsPorCodigo.get(codigoPai);
      const filhoId = idsPorCodigo.get(d.codigo as string);
      if (paiId && filhoId) {
        await tx.tarefaRM.update({ where: { id: filhoId }, data: { tarefaPaiId: paiId } });
      }
    }

    return {
      criados: linhas.length,
      atualizados: 0,
      mensagem: `Revisão RM nº ${revisao.numeroRevisao} criada com ${linhas.length} itens. A revisão anterior foi preservada no histórico.`,
    };
  }, TX_OPTIONS);
}

async function importarDePara(obraId: string, linhas: LinhaValidada[]): Promise<ResultadoImportacao> {
  const [revisaoExec, revisaoRm] = await Promise.all([
    getRevisaoAtiva(obraId, "EXECUTIVO"),
    getRevisaoAtiva(obraId, "RM"),
  ]);
  if (!revisaoExec || !revisaoRm) throw new Error("Revisões ativas não encontradas.");

  let criados = 0;
  let atualizados = 0;
  const tarefasAfetadas = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      const d = linha.dados;
      const tarefaExec = await tx.tarefaExecutiva.findFirstOrThrow({
        where: { revisaoId: revisaoExec.id, codigo: d.tarefa_executiva_codigo as string },
      });
      const tarefaRm = await tx.tarefaRM.findFirstOrThrow({
        where: { revisaoId: revisaoRm.id, codigo: d.tarefa_rm_codigo as string },
      });

      const percentual = Number(d.percentual_rateio);
      const valorRateado = Number(tarefaExec.valorTotal) * (percentual / 100);

      const existente = await tx.deParaOrcamentario.findUnique({
        where: { tarefaExecutivaId_tarefaRmId: { tarefaExecutivaId: tarefaExec.id, tarefaRmId: tarefaRm.id } },
      });

      await tx.deParaOrcamentario.upsert({
        where: { tarefaExecutivaId_tarefaRmId: { tarefaExecutivaId: tarefaExec.id, tarefaRmId: tarefaRm.id } },
        create: {
          tarefaExecutivaId: tarefaExec.id,
          tarefaRmId: tarefaRm.id,
          percentualRateio: percentual,
          valorRateado,
          origemMapeamento: (d.origem_mapeamento as string) || "IMPORTADO",
          status: "PARCIAL",
        },
        update: {
          percentualRateio: percentual,
          valorRateado,
          origemMapeamento: (d.origem_mapeamento as string) || "IMPORTADO",
        },
      });

      if (existente) atualizados++;
      else criados++;
      tarefasAfetadas.add(tarefaExec.id);
    }

    for (const tarefaId of tarefasAfetadas) {
      const relacionados = await tx.deParaOrcamentario.findMany({ where: { tarefaExecutivaId: tarefaId } });
      const soma = relacionados.reduce((acc, r) => acc + Number(r.percentualRateio), 0);
      await tx.deParaOrcamentario.updateMany({
        where: { tarefaExecutivaId: tarefaId },
        data: { status: soma >= 99.99 ? "CONCILIADO" : "PARCIAL" },
      });
    }
  }, TX_OPTIONS);

  return { criados, atualizados, mensagem: `${criados} vínculos DE-PARA criados, ${atualizados} atualizados.` };
}

async function importarModelosContratacao(linhas: LinhaValidada[]): Promise<ResultadoImportacao> {
  let criados = 0;
  let atualizados = 0;

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      const d = linha.dados;
      const existente = await tx.modeloContratacao.findUnique({ where: { codigo: d.codigo as string } });
      await tx.modeloContratacao.upsert({
        where: { codigo: d.codigo as string },
        create: {
          codigo: d.codigo as string,
          nome: d.nome as string,
          categoria: (d.categoria as string) || null,
          descricao: (d.descricao as string) || null,
          mostrarPrecos: d.mostrar_precos === "SIM",
          layoutCabeca: d.layout_cabeca as LayoutCabecaExportacao,
          demonstrativo: false,
        },
        update: {
          nome: d.nome as string,
          categoria: (d.categoria as string) || null,
          descricao: (d.descricao as string) || null,
          mostrarPrecos: d.mostrar_precos === "SIM",
          layoutCabeca: d.layout_cabeca as LayoutCabecaExportacao,
        },
      });
      if (existente) atualizados++;
      else criados++;
    }
  }, TX_OPTIONS);

  return { criados, atualizados, mensagem: `${criados} modelos criados, ${atualizados} atualizados.` };
}

export async function importarDados(
  tipo: ImportTipo,
  obraId: string | null,
  linhas: LinhaValidada[]
): Promise<ResultadoImportacao> {
  switch (tipo) {
    case "orcamento-executivo":
      return importarOrcamentoExecutivo(obraId!, linhas);
    case "composicoes":
      return importarComposicoes(obraId!, linhas);
    case "orcamento-rm":
      return importarOrcamentoRm(obraId!, linhas);
    case "de-para":
      return importarDePara(obraId!, linhas);
    case "modelos-contratacao":
      return importarModelosContratacao(linhas);
  }
}
