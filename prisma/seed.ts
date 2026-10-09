/**
 * Dados de demonstração — NENHUM valor aqui reflete obras ou contratos reais
 * da VICTA. Servem só para navegar a v1 até que os arquivos reais (Excel/
 * imagens) sejam enviados e um importador real seja construído (Fase 1
 * tardia / backlog do módulo "Importação de dados Excel").
 */
import { PrismaClient, TipoInsumo, StatusDePara, LayoutCabecaExportacao } from "@prisma/client";

const prisma = new PrismaClient();

type InsumoSeed = {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoInsumo;
  bancoOrigem?: string;
  coeficiente: number;
  precoUnitario: number;
};

async function criarComposicao(
  tarefaExecutivaId: string,
  codigo: string,
  descricao: string,
  insumos: InsumoSeed[]
) {
  const composicao = await prisma.composicao.create({
    data: { tarefaExecutivaId, codigo, descricao },
  });

  for (const ins of insumos) {
    const insumo = await prisma.insumo.upsert({
      where: { codigo: ins.codigo },
      update: {},
      create: {
        codigo: ins.codigo,
        descricao: ins.descricao,
        unidade: ins.unidade,
        tipo: ins.tipo,
        bancoOrigem: ins.bancoOrigem ?? "DEMO",
      },
    });

    await prisma.itemComposicao.create({
      data: {
        composicaoId: composicao.id,
        insumoId: insumo.id,
        coeficiente: ins.coeficiente,
        precoUnitario: ins.precoUnitario,
        custoParcial: ins.coeficiente * ins.precoUnitario,
      },
    });
  }

  return composicao;
}

async function main() {
  console.log("Seed demonstrativo — iniciando...");

  // Limpeza (ordem respeita FKs) — seguro porque este banco é só de demo local.
  await prisma.auditLog.deleteMany();
  await prisma.exportacaoDocumento.deleteMany();
  await prisma.modeloContratacao.deleteMany();
  await prisma.apropriacaoItemQQP.deleteMany();
  await prisma.itemQQP.deleteMany();
  await prisma.cabecaContratacao.deleteMany();
  await prisma.qQP.deleteMany();
  await prisma.registroGestao.deleteMany();
  await prisma.deParaOrcamentario.deleteMany();
  await prisma.tarefaRM.deleteMany();
  await prisma.itemComposicao.deleteMany();
  await prisma.composicao.deleteMany();
  await prisma.tarefaExecutiva.deleteMany();
  await prisma.grupoOrcamentario.deleteMany();
  await prisma.revisaoOrcamentaria.deleteMany();
  await prisma.insumo.deleteMany();
  await prisma.obra.deleteMany();

  const obra = await prisma.obra.create({
    data: {
      codigo: "OB-001",
      nome: "Residencial Jardim das Flores (DEMO)",
      codigoRm: "RM-4521",
      responsavel: "Eng. Carla Mendes",
      status: "ATIVA",
      dataImportacao: new Date(),
    },
  });

  const obra2 = await prisma.obra.create({
    data: {
      codigo: "OB-002",
      nome: "Galpão Industrial Via Norte (DEMO)",
      codigoRm: "RM-4780",
      responsavel: "Eng. Rafael Souza",
      status: "ATIVA",
    },
  });

  const revisaoExecutivo = await prisma.revisaoOrcamentaria.create({
    data: {
      obraId: obra.id,
      tipoOrcamento: "EXECUTIVO",
      numeroRevisao: 1,
      dataReferencia: new Date(),
      ativa: true,
    },
  });

  const revisaoRm = await prisma.revisaoOrcamentaria.create({
    data: {
      obraId: obra.id,
      tipoOrcamento: "RM",
      numeroRevisao: 1,
      dataReferencia: new Date(),
      ativa: true,
    },
  });

  // Segunda obra só para provar a segregação de dados entre obras.
  await prisma.revisaoOrcamentaria.create({
    data: {
      obraId: obra2.id,
      tipoOrcamento: "EXECUTIVO",
      numeroRevisao: 1,
      dataReferencia: new Date(),
      ativa: true,
    },
  });

  const grupos = {
    preliminares: await prisma.grupoOrcamentario.create({
      data: { revisaoId: revisaoExecutivo.id, codigo: "01", nome: "Serviços Preliminares" },
    }),
    terraplenagem: await prisma.grupoOrcamentario.create({
      data: { revisaoId: revisaoExecutivo.id, codigo: "02", nome: "Terraplenagem" },
    }),
    fundacoes: await prisma.grupoOrcamentario.create({
      data: { revisaoId: revisaoExecutivo.id, codigo: "03", nome: "Fundações" },
    }),
    estrutura: await prisma.grupoOrcamentario.create({
      data: { revisaoId: revisaoExecutivo.id, codigo: "04", nome: "Estrutura" },
    }),
    alvenaria: await prisma.grupoOrcamentario.create({
      data: { revisaoId: revisaoExecutivo.id, codigo: "05", nome: "Alvenaria e Revestimentos" },
    }),
  };

  async function criarTarefa(params: {
    grupoId: string;
    codigo: string;
    descricao: string;
    unidade: string;
    quantidadeOrcada: number;
    precoSemBdi: number;
    precoComBdi: number;
    custoMaoObra?: number;
    custoMaoObraTerceirizada?: number;
    custoServicos?: number;
    custoMateriais?: number;
    codigoApropriacaoRm?: string;
    descricaoApropriacao?: string;
  }) {
    const valorTotal = params.quantidadeOrcada * params.precoComBdi;
    return prisma.tarefaExecutiva.create({
      data: {
        revisaoId: revisaoExecutivo.id,
        grupoId: params.grupoId,
        codigo: params.codigo,
        descricao: params.descricao,
        unidade: params.unidade,
        quantidadeOrcada: params.quantidadeOrcada,
        precoUnitarioSemBdi: params.precoSemBdi,
        precoUnitarioComBdi: params.precoComBdi,
        valorTotal,
        custoMaoObra: params.custoMaoObra,
        custoMaoObraTerceirizada: params.custoMaoObraTerceirizada,
        custoServicos: params.custoServicos,
        custoMateriais: params.custoMateriais,
        codigoApropriacaoRm: params.codigoApropriacaoRm,
        descricaoApropriacao: params.descricaoApropriacao,
      },
    });
  }

  const t0101 = await criarTarefa({
    grupoId: grupos.preliminares.id,
    codigo: "T-0101",
    descricao: "Instalação de canteiro de obras",
    unidade: "vb",
    quantidadeOrcada: 1,
    precoSemBdi: 45000,
    precoComBdi: 47000,
    custoServicos: 47000,
    codigoApropriacaoRm: "01.01",
    descricaoApropriacao: "Serviços Preliminares",
  });

  await criarTarefa({
    grupoId: grupos.preliminares.id,
    codigo: "T-0102",
    descricao: "Topografia e locação da obra",
    unidade: "m²",
    quantidadeOrcada: 12000,
    precoSemBdi: 1.8,
    precoComBdi: 1.9,
    custoServicos: 22800,
    // Propositalmente sem apropriação RM mapeada: exercita o alerta de
    // "tarefa sem DE-PARA" no módulo de conciliação.
  });

  const t0201 = await criarTarefa({
    grupoId: grupos.terraplenagem.id,
    codigo: "T-0201",
    descricao: "Escavação mecanizada",
    unidade: "m³",
    quantidadeOrcada: 5000,
    precoSemBdi: 9.5,
    precoComBdi: 10.0,
    custoServicos: 50000,
    codigoApropriacaoRm: "02.01",
    descricaoApropriacao: "Terraplenagem",
  });

  const t0202 = await criarTarefa({
    grupoId: grupos.terraplenagem.id,
    codigo: "T-0202",
    descricao: "Carga mecanizada de material",
    unidade: "m³",
    quantidadeOrcada: 5000,
    precoSemBdi: 5.7,
    precoComBdi: 6.0,
    custoServicos: 30000,
    codigoApropriacaoRm: "02.01",
    descricaoApropriacao: "Terraplenagem",
  });

  const t0203 = await criarTarefa({
    grupoId: grupos.terraplenagem.id,
    codigo: "T-0203",
    descricao: "Transporte de material (bota-fora)",
    unidade: "m³",
    quantidadeOrcada: 5000,
    precoSemBdi: 15.2,
    precoComBdi: 16.0,
    custoServicos: 80000,
    codigoApropriacaoRm: "02.01",
    descricaoApropriacao: "Terraplenagem",
  });

  const t0204 = await criarTarefa({
    grupoId: grupos.terraplenagem.id,
    codigo: "T-0204",
    descricao: "Compactação de aterro",
    unidade: "m²",
    quantidadeOrcada: 10000,
    precoSemBdi: 3.8,
    precoComBdi: 4.0,
    custoServicos: 40000,
    codigoApropriacaoRm: "02.01",
    descricaoApropriacao: "Terraplenagem",
  });

  const t0205 = await criarTarefa({
    grupoId: grupos.terraplenagem.id,
    codigo: "T-0205",
    descricao: "Espalhamento de material",
    unidade: "m³",
    quantidadeOrcada: 5000,
    precoSemBdi: 2.85,
    precoComBdi: 3.0,
    custoServicos: 15000,
    codigoApropriacaoRm: "02.01",
    descricaoApropriacao: "Terraplenagem",
  });

  const t0301 = await criarTarefa({
    grupoId: grupos.fundacoes.id,
    codigo: "T-0301",
    descricao: "Escavação de valas para fundação",
    unidade: "m³",
    quantidadeOrcada: 800,
    precoSemBdi: 18.0,
    precoComBdi: 19.0,
    custoServicos: 15200,
    codigoApropriacaoRm: "03.01",
    descricaoApropriacao: "Fundações",
  });

  const t0302 = await criarTarefa({
    grupoId: grupos.fundacoes.id,
    codigo: "T-0302",
    descricao: "Concreto para fundação (sapatas)",
    unidade: "m³",
    quantidadeOrcada: 320,
    precoSemBdi: 580.0,
    precoComBdi: 610.0,
    custoMateriais: 153600,
    custoMaoObraTerceirizada: 41600,
    codigoApropriacaoRm: "03.01",
    descricaoApropriacao: "Fundações",
  });

  const t0303 = await criarTarefa({
    grupoId: grupos.fundacoes.id,
    codigo: "T-0303",
    descricao: "Armação CA-50 para fundação",
    unidade: "kg",
    quantidadeOrcada: 18000,
    precoSemBdi: 7.2,
    precoComBdi: 7.6,
    custoMateriais: 97200,
    custoMaoObra: 39600,
    codigoApropriacaoRm: "03.01",
    descricaoApropriacao: "Fundações",
  });

  const t0401 = await criarTarefa({
    grupoId: grupos.estrutura.id,
    codigo: "T-0401",
    descricao: "Concreto estrutural (pilares e vigas)",
    unidade: "m³",
    quantidadeOrcada: 450,
    precoSemBdi: 620.0,
    precoComBdi: 655.0,
    custoMateriais: 216000,
    custoMaoObraTerceirizada: 78750,
    codigoApropriacaoRm: "04.01",
    descricaoApropriacao: "Estrutura",
  });

  const t0402 = await criarTarefa({
    grupoId: grupos.estrutura.id,
    codigo: "T-0402",
    descricao: "Forma de madeira para estrutura",
    unidade: "m²",
    quantidadeOrcada: 2800,
    precoSemBdi: 48.0,
    precoComBdi: 51.0,
    custoMateriais: 100800,
    custoMaoObra: 42000,
    codigoApropriacaoRm: "04.01",
    descricaoApropriacao: "Estrutura",
  });

  const t0403 = await criarTarefa({
    grupoId: grupos.estrutura.id,
    codigo: "T-0403",
    descricao: "Armação CA-50 para estrutura",
    unidade: "kg",
    quantidadeOrcada: 42000,
    precoSemBdi: 7.4,
    precoComBdi: 7.8,
    custoMateriais: 226800,
    custoMaoObra: 100800,
    codigoApropriacaoRm: "04.01",
    descricaoApropriacao: "Estrutura",
  });

  const t0501 = await criarTarefa({
    grupoId: grupos.alvenaria.id,
    codigo: "T-0501",
    descricao: "Alvenaria de blocos cerâmicos",
    unidade: "m²",
    quantidadeOrcada: 3200,
    precoSemBdi: 62.0,
    precoComBdi: 65.0,
    custoMateriais: 85000,
    custoMaoObra: 123000,
    codigoApropriacaoRm: "05.01",
    descricaoApropriacao: "Alvenaria e Revestimentos",
  });

  const t0502 = await criarTarefa({
    grupoId: grupos.alvenaria.id,
    codigo: "T-0502",
    descricao: "Chapisco e emboço",
    unidade: "m²",
    quantidadeOrcada: 6400,
    precoSemBdi: 28.0,
    precoComBdi: 30.0,
    custoMateriais: 76800,
    custoMaoObra: 115200,
    codigoApropriacaoRm: "05.01",
    descricaoApropriacao: "Alvenaria e Revestimentos",
  });

  const t0503 = await criarTarefa({
    grupoId: grupos.alvenaria.id,
    codigo: "T-0503",
    descricao: "Revestimento cerâmico interno",
    unidade: "m²",
    quantidadeOrcada: 2100,
    precoSemBdi: 55.0,
    precoComBdi: 58.0,
    custoMateriais: 69300,
    custoMaoObra: 52500,
    codigoApropriacaoRm: "05.01",
    descricaoApropriacao: "Alvenaria e Revestimentos",
  });

  // Composições (insumos) — só para as tarefas usadas no exemplo canônico de
  // terraplenagem + concreto + alvenaria, para não alongar demais o seed.
  await criarComposicao(t0201.id, "C-0201", "Escavação mecanizada", [
    {
      codigo: "EQ-ESCAV",
      descricao: "Escavadeira hidráulica 20t",
      unidade: "h",
      tipo: TipoInsumo.EQUIPAMENTO,
      coeficiente: 0.08,
      precoUnitario: 95,
    },
    {
      codigo: "MO-OPESCAV",
      descricao: "Operador de escavadeira",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.08,
      precoUnitario: 32,
    },
  ]);

  await criarComposicao(t0202.id, "C-0202", "Carga mecanizada de material", [
    {
      codigo: "EQ-PACARR",
      descricao: "Pá-carregadeira sobre rodas",
      unidade: "h",
      tipo: TipoInsumo.EQUIPAMENTO,
      coeficiente: 0.05,
      precoUnitario: 105,
    },
    {
      codigo: "MO-OPCARR",
      descricao: "Operador de pá-carregadeira",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.05,
      precoUnitario: 30,
    },
  ]);

  await criarComposicao(t0203.id, "C-0203", "Transporte de material", [
    {
      codigo: "EQ-CAMBASC",
      descricao: "Caminhão basculante 10m³",
      unidade: "h",
      tipo: TipoInsumo.EQUIPAMENTO,
      coeficiente: 0.12,
      precoUnitario: 110,
    },
    {
      codigo: "MO-MOTORISTA",
      descricao: "Motorista de caminhão",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.12,
      precoUnitario: 28,
    },
  ]);

  await criarComposicao(t0204.id, "C-0204", "Compactação de aterro", [
    {
      codigo: "EQ-ROLOCOMP",
      descricao: "Rolo compactador vibratório",
      unidade: "h",
      tipo: TipoInsumo.EQUIPAMENTO,
      coeficiente: 0.02,
      precoUnitario: 160,
    },
    {
      codigo: "MO-OPROLO",
      descricao: "Operador de rolo compactador",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.02,
      precoUnitario: 32,
    },
  ]);

  await criarComposicao(t0302.id, "C-0302", "Concreto para fundação", [
    {
      codigo: "MAT-CONCUS25",
      descricao: "Concreto usinado fck 25 MPa",
      unidade: "m³",
      tipo: TipoInsumo.MATERIAL,
      coeficiente: 1.0,
      precoUnitario: 480,
    },
    {
      codigo: "MOT-LANCVIB",
      descricao: "Equipe de lançamento e vibração",
      unidade: "m³",
      tipo: TipoInsumo.MAO_DE_OBRA_TERCEIRIZADA,
      coeficiente: 1.0,
      precoUnitario: 100,
    },
    {
      codigo: "EQ-BOMBACONC",
      descricao: "Bomba de concreto estacionária",
      unidade: "h",
      tipo: TipoInsumo.EQUIPAMENTO,
      coeficiente: 0.08,
      precoUnitario: 375,
    },
  ]);

  const c0501 = await criarComposicao(t0501.id, "C-0501", "Alvenaria de blocos cerâmicos", [
    {
      codigo: "MAT-BLOCO9",
      descricao: "Bloco cerâmico 9x19x29",
      unidade: "un",
      tipo: TipoInsumo.MATERIAL,
      coeficiente: 12.5,
      precoUnitario: 1.8,
    },
    {
      codigo: "MAT-ARGASSENT",
      descricao: "Argamassa de assentamento",
      unidade: "m³",
      tipo: TipoInsumo.MATERIAL,
      coeficiente: 0.012,
      precoUnitario: 350,
    },
    {
      codigo: "MO-PEDREIRO",
      descricao: "Pedreiro",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.55,
      precoUnitario: 32,
    },
    {
      codigo: "MO-SERVENTE",
      descricao: "Servente",
      unidade: "h",
      tipo: TipoInsumo.MAO_DE_OBRA,
      coeficiente: 0.55,
      precoUnitario: 22,
    },
  ]);

  // --- Orçamento RM (consolidado) ---
  const rmRaiz02 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "02",
      descricao: "Movimento de Terra",
      codigoApropriacao: "02",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 210000,
      nivelHierarquico: 1,
    },
  });
  const rm0201 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "02.01",
      descricao: "Terraplenagem",
      codigoApropriacao: "02.01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 210000,
      tarefaPaiId: rmRaiz02.id,
      nivelHierarquico: 2,
    },
  });

  const rmRaiz03 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "03",
      descricao: "Fundações",
      codigoApropriacao: "03",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 345000,
      nivelHierarquico: 1,
    },
  });
  const rm0301 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "03.01",
      descricao: "Fundações — Execução",
      codigoApropriacao: "03.01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 345000,
      tarefaPaiId: rmRaiz03.id,
      nivelHierarquico: 2,
    },
  });

  const rmRaiz04 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "04",
      descricao: "Estrutura",
      codigoApropriacao: "04",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 770000,
      nivelHierarquico: 1,
    },
  });
  const rm0401 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "04.01",
      descricao: "Estrutura — Execução",
      codigoApropriacao: "04.01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 693000,
      tarefaPaiId: rmRaiz04.id,
      nivelHierarquico: 2,
    },
  });
  const rm0402 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "04.02",
      descricao: "Estrutura — Armaduras Diversas",
      codigoApropriacao: "04.02",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 77000,
      tarefaPaiId: rmRaiz04.id,
      nivelHierarquico: 2,
    },
  });

  const rmRaiz05 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "05",
      descricao: "Alvenaria e Revestimentos",
      codigoApropriacao: "05",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 521800,
      nivelHierarquico: 1,
    },
  });
  const rm0501 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "05.01",
      descricao: "Alvenaria e Revestimentos — Execução",
      codigoApropriacao: "05.01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 521800,
      tarefaPaiId: rmRaiz05.id,
      nivelHierarquico: 2,
    },
  });

  const rmRaiz01 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "01",
      descricao: "Serviços Iniciais",
      codigoApropriacao: "01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 47000,
      nivelHierarquico: 1,
    },
  });
  const rm0101 = await prisma.tarefaRM.create({
    data: {
      revisaoId: revisaoRm.id,
      codigo: "01.01",
      descricao: "Serviços Preliminares",
      codigoApropriacao: "01.01",
      unidade: "vb",
      quantidade: 1,
      custoTotal: 47000,
      tarefaPaiId: rmRaiz01.id,
      nivelHierarquico: 2,
    },
  });

  // --- DE-PARA ---
  // Terraplenagem: muitos-para-um, 100% cada (T-0102 fica deliberadamente
  // sem mapeamento para gerar alerta de "tarefa sem DE-PARA").
  for (const tarefa of [t0201, t0202, t0203, t0204, t0205]) {
    await prisma.deParaOrcamentario.create({
      data: {
        tarefaExecutivaId: tarefa.id,
        tarefaRmId: rm0201.id,
        percentualRateio: 100,
        valorRateado: tarefa.valorTotal,
        status: StatusDePara.CONCILIADO,
        origemMapeamento: "IMPORTADO",
      },
    });
  }

  await prisma.deParaOrcamentario.create({
    data: {
      tarefaExecutivaId: t0101.id,
      tarefaRmId: rm0101.id,
      percentualRateio: 100,
      valorRateado: t0101.valorTotal,
      status: StatusDePara.CONCILIADO,
      origemMapeamento: "IMPORTADO",
    },
  });

  for (const tarefa of [t0301, t0302, t0303]) {
    await prisma.deParaOrcamentario.create({
      data: {
        tarefaExecutivaId: tarefa.id,
        tarefaRmId: rm0301.id,
        percentualRateio: 100,
        valorRateado: tarefa.valorTotal,
        status: StatusDePara.CONCILIADO,
        origemMapeamento: "IMPORTADO",
      },
    });
  }

  for (const tarefa of [t0401, t0402]) {
    await prisma.deParaOrcamentario.create({
      data: {
        tarefaExecutivaId: tarefa.id,
        tarefaRmId: rm0401.id,
        percentualRateio: 100,
        valorRateado: tarefa.valorTotal,
        status: StatusDePara.CONCILIADO,
        origemMapeamento: "IMPORTADO",
      },
    });
  }

  // Um-para-muitos: a armação da estrutura é rateada entre dois destinos RM.
  const valorT0403 = Number(t0403.valorTotal);
  await prisma.deParaOrcamentario.create({
    data: {
      tarefaExecutivaId: t0403.id,
      tarefaRmId: rm0401.id,
      percentualRateio: 90,
      valorRateado: valorT0403 * 0.9,
      status: StatusDePara.PARCIAL,
      origemMapeamento: "MANUAL",
    },
  });
  await prisma.deParaOrcamentario.create({
    data: {
      tarefaExecutivaId: t0403.id,
      tarefaRmId: rm0402.id,
      percentualRateio: 10,
      valorRateado: valorT0403 * 0.1,
      status: StatusDePara.PARCIAL,
      origemMapeamento: "MANUAL",
    },
  });

  for (const tarefa of [t0501, t0502, t0503]) {
    await prisma.deParaOrcamentario.create({
      data: {
        tarefaExecutivaId: tarefa.id,
        tarefaRmId: rm0501.id,
        percentualRateio: 100,
        valorRateado: tarefa.valorTotal,
        status: StatusDePara.CONCILIADO,
        origemMapeamento: "IMPORTADO",
      },
    });
  }

  // --- QQP de demonstração, já com cabeça de contratação montada ---
  const registro = await prisma.registroGestao.create({
    data: {
      obraId: obra.id,
      numero: "QQP-0001",
      tipoRegistro: "QQP",
      descricao: "Contratação de terraplenagem e fornecimento de blocos",
      objetivo: "Viabilizar o início da terraplenagem e garantir estoque de blocos cerâmicos",
      resumoObjeto: "Escavação, transporte, compactação e fornecimento de blocos cerâmicos",
      dataSolicitacao: new Date(),
      status: "VALIDADO",
    },
  });

  const qqp = await prisma.qQP.create({
    data: {
      registroGestaoId: registro.id,
      revisaoOrcamentoId: revisaoExecutivo.id,
      observacoes: "QQP de demonstração gerado pelo seed — não representa contratação real.",
    },
  });

  const cabecaTerraplenagem = await prisma.cabecaContratacao.create({
    data: {
      qqpId: qqp.id,
      codigo: "CAB-01",
      nome: "Serviços de Terraplenagem",
      descricao: "Agrupamento dos itens de escavação, transporte e compactação",
      ordem: 1,
    },
  });

  const itemEscavacao = await prisma.itemQQP.create({
    data: {
      qqpId: qqp.id,
      cabecaId: cabecaTerraplenagem.id,
      tipoOrigem: "TAREFA",
      tarefaExecutivaId: t0201.id,
      codigoOrigemSnapshot: t0201.codigo,
      descricaoSnapshot: t0201.descricao,
      unidadeSnapshot: t0201.unidade,
      quantidadeBaseSnapshot: t0201.quantidadeOrcada,
      precoUnitarioSnapshot: t0201.precoUnitarioComBdi,
      quantidadeSolicitada: 4800,
      ordem: 1,
    },
  });

  const itemComposicaoTransporte = await prisma.itemComposicao.findFirstOrThrow({
    where: { composicao: { tarefaExecutivaId: t0203.id }, insumo: { codigo: "EQ-CAMBASC" } },
  });

  const itemTransporte = await prisma.itemQQP.create({
    data: {
      qqpId: qqp.id,
      cabecaId: cabecaTerraplenagem.id,
      tipoOrigem: "INSUMO",
      tarefaExecutivaId: t0203.id,
      itemComposicaoId: itemComposicaoTransporte.id,
      codigoOrigemSnapshot: "EQ-CAMBASC",
      descricaoSnapshot: "Caminhão basculante 10m³ (de T-0203)",
      unidadeSnapshot: "h",
      quantidadeBaseSnapshot: Number(t0203.quantidadeOrcada) * 0.12,
      precoUnitarioSnapshot: 110,
      quantidadeSolicitada: 550,
      ordem: 2,
    },
  });

  const itemCompactacao = await prisma.itemQQP.create({
    data: {
      qqpId: qqp.id,
      cabecaId: cabecaTerraplenagem.id,
      tipoOrigem: "TAREFA",
      tarefaExecutivaId: t0204.id,
      codigoOrigemSnapshot: t0204.codigo,
      descricaoSnapshot: t0204.descricao,
      unidadeSnapshot: t0204.unidade,
      quantidadeBaseSnapshot: t0204.quantidadeOrcada,
      precoUnitarioSnapshot: t0204.precoUnitarioComBdi,
      quantidadeSolicitada: 10000,
      ordem: 3,
    },
  });

  const itemComposicaoBloco = await prisma.itemComposicao.findFirstOrThrow({
    where: { composicaoId: c0501.id, insumo: { codigo: "MAT-BLOCO9" } },
  });

  const itemBloco = await prisma.itemQQP.create({
    data: {
      qqpId: qqp.id,
      cabecaId: null, // item não agrupado, de propósito
      tipoOrigem: "INSUMO",
      tarefaExecutivaId: t0501.id,
      itemComposicaoId: itemComposicaoBloco.id,
      codigoOrigemSnapshot: "MAT-BLOCO9",
      descricaoSnapshot: "Bloco cerâmico 9x19x29 (de T-0501)",
      unidadeSnapshot: "un",
      quantidadeBaseSnapshot: Number(t0501.quantidadeOrcada) * 12.5,
      precoUnitarioSnapshot: 1.8,
      quantidadeSolicitada: 38000,
      ordem: 4,
    },
  });

  for (const item of [itemEscavacao, itemTransporte, itemCompactacao]) {
    await prisma.apropriacaoItemQQP.create({
      data: {
        itemQqpId: item.id,
        tarefaRmId: rm0201.id,
        percentualRateio: 100,
        valorRateado: Number(item.quantidadeSolicitada) * Number(item.precoUnitarioSnapshot),
      },
    });
  }
  await prisma.apropriacaoItemQQP.create({
    data: {
      itemQqpId: itemBloco.id,
      tarefaRmId: rm0501.id,
      percentualRateio: 100,
      valorRateado: Number(itemBloco.quantidadeSolicitada) * Number(itemBloco.precoUnitarioSnapshot),
    },
  });

  // --- Modelos de contratação (demonstrativos — os 47 reais entram quando a
  // empresa enviar os arquivos; enquanto isso, 3 layouts genéricos cobrem os
  // casos descritos no refinamento: detalhado, título de seção e sem preços).
  await prisma.modeloContratacao.create({
    data: {
      codigo: "MOD-DEMO-01",
      nome: "Cotação Padrão (Demonstrativo)",
      categoria: "Geral",
      descricao: "Cabeças detalhadas com itens e preços de referência visíveis.",
      mostrarPrecos: true,
      layoutCabeca: LayoutCabecaExportacao.DETALHADO,
    },
  });
  await prisma.modeloContratacao.create({
    data: {
      codigo: "MOD-DEMO-02",
      nome: "Cotação sem Preço de Referência (Demonstrativo)",
      categoria: "Suprimentos",
      descricao: "Mesmo layout detalhado, mas oculta os preços de referência para cotação cega.",
      mostrarPrecos: false,
      layoutCabeca: LayoutCabecaExportacao.DETALHADO,
    },
  });
  await prisma.modeloContratacao.create({
    data: {
      codigo: "MOD-DEMO-03",
      nome: "Itens Analíticos sem Agrupamento (Demonstrativo)",
      categoria: "Geral",
      descricao: "Lista todos os itens do QQP individualmente, ignorando as cabeças de contratação.",
      mostrarPrecos: true,
      layoutCabeca: LayoutCabecaExportacao.SEM_AGRUPAMENTO,
    },
  });

  console.log("Seed demonstrativo concluído.");
  console.log(`Obra demo: ${obra.codigo} — ${obra.nome}`);
  console.log(`Obra demo 2: ${obra2.codigo} — ${obra2.nome}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
