import ExcelJS from "exceljs";
import type { CabecaView, ItemQqpView } from "@/lib/services/qqp";

type ModeloExport = {
  nome: string;
  mostrarPrecos: boolean;
  layoutCabeca: "DETALHADO" | "TITULO_SECAO" | "SEM_AGRUPAMENTO";
  demonstrativo: boolean;
  versao: number;
};

type DadosQqpExport = {
  obraCodigo: string;
  obraNome: string;
  numero: string;
  descricao: string;
  objetivo: string | null;
  dataSolicitacao: Date;
  itens: ItemQqpView[];
  cabecas: CabecaView[];
};

const CORES = {
  tituloFundo: "FFF3F4F6",
  secaoFundo: "FF0F3D2E",
  secaoTexto: "FFFFFFFF",
  cabecaFundo: "FFD1FAE5",
  colunaContratoFundo: "FF0F3D2E",
  colunaOrcFundo: "FFEA580C",
  colunaTexto: "FFFFFFFF",
  bordaClara: "FFD1D5DB",
  avisoTexto: "FFB45309",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: CORES.bordaClara } },
  bottom: { style: "thin", color: { argb: CORES.bordaClara } },
  left: { style: "thin", color: { argb: CORES.bordaClara } },
  right: { style: "thin", color: { argb: CORES.bordaClara } },
};

function valorSolicitado(item: ItemQqpView) {
  return item.quantidadeSolicitada * item.precoUnitario;
}

function quantidadeBaseEscopada(item: ItemQqpView) {
  return (item.quantidadeBase * item.fatorEscopo) / 100;
}

function valorBaseEscopado(item: ItemQqpView) {
  return quantidadeBaseEscopada(item) * item.precoUnitario;
}

export async function gerarQqpWorkbook(
  dados: DadosQqpExport,
  modelo: ModeloExport
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "VICTA — Gestão Orçamentária";
  wb.created = new Date();

  if (modelo.layoutCabeca === "DETALHADO") {
    gerarLayoutTerceirizados(wb, dados, modelo);
  } else {
    gerarLayoutGenerico(wb, dados, modelo);
  }

  return wb;
}

/**
 * Layout "Solicitação de Contratação de Serviços de Terceirizados" — réplica
 * do modelo real da VICTA (planilha R3/RESUMO): cabeçalho da obra, uma seção
 * "1 – Especificações dos serviços" por cabeça de contratação (com campo de
 * fornecedor e totais) e a seção "2 – Quantitativos" com o quadro duplo
 * (quantidade/preço A CONTRATAR ao lado da referência ORÇADA), seguida das
 * cláusulas padrão do pedido. As colunas de preço "a contratar" ficam em
 * branco de propósito — são preenchidas pelo fornecedor na cotação.
 */
function gerarLayoutTerceirizados(wb: ExcelJS.Workbook, dados: DadosQqpExport, modelo: ModeloExport) {
  const sheet = wb.addWorksheet("Solicitação", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ showGridLines: false }],
  });

  const colunasBase = ["COD. TAREFA 1", "COD. TAREFA 2", "COD. TAREFA 3", "COD. COMP", "DESCRIÇÃO DA TAREFA", "UND. TAREFA"];
  const colunasContrato = ["QUANT.", "VALOR UNIT.", "TOTAL"];
  const colunasOrc = ["QUANT. ORÇ.", "VALOR UNIT. ORÇ. (R$)", "TOTAL ORÇ. (R$)"];
  const colunas = modelo.mostrarPrecos
    ? [...colunasBase, ...colunasContrato, ...colunasOrc, "OBSERVAÇÃO"]
    : [...colunasBase, ...colunasContrato, "OBSERVAÇÃO"];
  const numColunas = colunas.length;

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 42 },
    { width: 9 },
    { width: 11 },
    { width: 13 },
    { width: 13 },
    ...(modelo.mostrarPrecos ? [{ width: 11 }, { width: 15 }, { width: 15 }] : []),
    { width: 24 },
  ];

  function linhaMesclada(texto: string, opts: { fundo?: string; texto?: string; bold?: boolean; size?: number } = {}) {
    const row = sheet.addRow([texto]);
    sheet.mergeCells(row.number, 1, row.number, numColunas);
    const cell = row.getCell(1);
    cell.font = { bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: opts.texto ?? "FF111827" } };
    if (opts.fundo) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fundo } };
    cell.alignment = { vertical: "middle", horizontal: opts.size && opts.size > 11 ? "center" : "left" };
    return row;
  }

  linhaMesclada("REGISTRO DO SISTEMA INTEGRADO DE GESTÃO", { fundo: CORES.tituloFundo, size: 12 });
  linhaMesclada("SOLICITAÇÃO DE CONTRATAÇÃO DE SERVIÇOS DE TERCEIRIZADOS", { size: 13 });
  if (modelo.demonstrativo) {
    const aviso = linhaMesclada(`Modelo demonstrativo (${modelo.nome}) — layout genérico até os 47 modelos reais serem cadastrados.`, {
      bold: false,
      size: 9,
      texto: CORES.avisoTexto,
    });
    aviso.getCell(1).font = { ...aviso.getCell(1).font, italic: true };
  }

  const linhaIdent = sheet.addRow([
    `OBRA: ${dados.obraCodigo} — ${dados.obraNome}`,
    ...Array(Math.max(0, numColunas - 3)).fill(""),
    `DATA: ${dados.dataSolicitacao.toLocaleDateString("pt-BR")}`,
    `Nº: ${dados.numero}`,
  ]);
  sheet.mergeCells(linhaIdent.number, 1, linhaIdent.number, Math.max(1, numColunas - 2));
  linhaIdent.getCell(1).font = { bold: true, size: 10 };
  sheet.addRow([]);

  let contadorSecao = 0;

  function secaoCabeca(nome: string, itensCabeca: ItemQqpView[]) {
    contadorSecao++;
    linhaMesclada(`${contadorSecao} – Especificações dos serviços`, {
      fundo: CORES.secaoFundo,
      texto: CORES.secaoTexto,
      size: 11,
    });
    linhaMesclada(nome, { fundo: CORES.cabecaFundo, size: 11 });

    const totalOrcado = itensCabeca.reduce((acc, i) => acc + valorBaseEscopado(i), 0);
    const totalSolicitado = itensCabeca.reduce((acc, i) => acc + valorSolicitado(i), 0);

    const linhaFornecedor = sheet.addRow([`${contadorSecao}.1 - ${nome}`]);
    sheet.mergeCells(linhaFornecedor.number, 1, linhaFornecedor.number, Math.ceil(numColunas / 2));
    linhaFornecedor.getCell(1).font = { bold: false, size: 10 };

    if (modelo.mostrarPrecos) {
      const colTotal1 = Math.ceil(numColunas / 2) + 2;
      const colTotal2 = numColunas - 1;
      linhaFornecedor.getCell(colTotal1 - 1).value = "Total orçado (ref.)";
      linhaFornecedor.getCell(colTotal1).value = totalOrcado;
      linhaFornecedor.getCell(colTotal1).numFmt = '"R$" #,##0.00';
      linhaFornecedor.getCell(colTotal2 - 1).value = "Total solicitado";
      linhaFornecedor.getCell(colTotal2).value = totalSolicitado;
      linhaFornecedor.getCell(colTotal2).numFmt = '"R$" #,##0.00';
    }
    sheet.addRow([]);

    contadorSecao++;
    linhaMesclada(`${contadorSecao} – Quantitativos`, { fundo: CORES.secaoFundo, texto: CORES.secaoTexto, size: 11 });

    const headerRow = sheet.addRow(colunas);
    headerRow.eachCell((cell, colNumber) => {
      const naColunaOrc = modelo.mostrarPrecos && colNumber >= colunasBase.length + colunasContrato.length + 1 && colNumber < numColunas;
      cell.font = { bold: true, size: 9, color: { argb: CORES.colunaTexto } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: naColunaOrc ? CORES.colunaOrcFundo : CORES.colunaContratoFundo },
      };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    for (const item of itensCabeca) {
      const linha: (string | number)[] = [
        item.codigo,
        "",
        "",
        item.tipoOrigem === "INSUMO" ? item.codigo : "",
        item.descricao,
        item.unidade,
        item.quantidadeSolicitada,
        "",
        "",
      ];
      if (modelo.mostrarPrecos) {
        linha.push(quantidadeBaseEscopada(item), item.precoUnitario, valorBaseEscopado(item));
      }
      linha.push("");

      const row = sheet.addRow(linha);
      row.eachCell((cell, colNumber) => {
        cell.border = THIN_BORDER;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
        if (colNumber === 7 || colNumber === 10) cell.numFmt = "#,##0.0000";
        if (colNumber === 8 || colNumber === 9 || colNumber === 11 || colNumber === 12) cell.numFmt = '"R$" #,##0.00';
      });
    }
    sheet.addRow([]);
  }

  for (const cabeca of dados.cabecas) {
    const itensCabeca = dados.itens.filter((i) => i.cabecaId === cabeca.id);
    if (itensCabeca.length > 0) secaoCabeca(cabeca.nome, itensCabeca);
  }

  const naoAgrupados = dados.itens.filter((i) => i.cabecaId === null);
  if (naoAgrupados.length > 0) secaoCabeca("Itens não agrupados", naoAgrupados);

  linhaMesclada(`${contadorSecao + 1} - Cronograma de execução`, { fundo: "FFE5E7EB", size: 10 });
  linhaMesclada("INSERIR INFORMAÇÃO", { bold: false, size: 9, texto: "FFDC2626" });
  sheet.addRow([]);

  const clausulasPadrao: [string, string][] = [
    ["Data necessária para a assinatura do contrato", "INSERIR INFORMAÇÃO"],
    ["Prazos para execução dos serviços", "Início dos serviços: / Término dos serviços:"],
    ["Relação de projetos a serem encaminhados aos prestadores de serviços", "INSERIR INFORMAÇÃO"],
    ["Especificação dos materiais a serem aplicados nos serviços", "INSERIR INFORMAÇÃO"],
    ["NBR's", "INSERIR INFORMAÇÃO"],
    ["Obrigações do fornecedor", "INSERIR INFORMAÇÃO"],
    ["Fornecedores indicados (nome, telefone e e-mail)", "INSERIR INFORMAÇÃO"],
    ["Condições de pagamento", "INSERIR INFORMAÇÃO"],
    ["Critério de medição", "Conforme avanço físico."],
    ["Detalhamento do serviço", ""],
    ["Memória de cálculo", "INSERIR NA ABA \"MEMÓRIA DE CÁLCULO\""],
  ];

  let n = contadorSecao + 2;
  for (const [titulo, instrucao] of clausulasPadrao) {
    linhaMesclada(`${n} - ${titulo}`, { fundo: "FFE5E7EB", size: 10 });
    if (instrucao) linhaMesclada(instrucao, { bold: false, size: 9, texto: instrucao.startsWith("INSERIR") ? "FFDC2626" : "FF111827" });
    n++;
  }
}

/** Layout genérico (modelos que não seguem o padrão "Serviços de Terceirizados"). */
function gerarLayoutGenerico(wb: ExcelJS.Workbook, dados: DadosQqpExport, modelo: ModeloExport) {
  const sheet = wb.addWorksheet("QQP", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const numColunas = modelo.mostrarPrecos ? 6 : 4;

  function mergedTitleRow(texto: string, bold = true, size = 11) {
    const row = sheet.addRow([texto]);
    sheet.mergeCells(row.number, 1, row.number, numColunas);
    row.getCell(1).font = { bold, size };
    return row;
  }

  mergedTitleRow("VICTA — Quadro de Quantidades e Preços (QQP)", true, 14);
  if (modelo.demonstrativo) {
    const aviso = mergedTitleRow(
      `Modelo demonstrativo (${modelo.nome}) — layout genérico até o cadastro dos modelos reais da empresa.`,
      false,
      9
    );
    aviso.getCell(1).font = { italic: true, size: 9, color: { argb: CORES.avisoTexto } };
  }
  mergedTitleRow(`Obra: ${dados.obraCodigo} — ${dados.obraNome}`, false);
  mergedTitleRow(`QQP: ${dados.numero} — ${dados.descricao}`, false);
  if (dados.objetivo) mergedTitleRow(`Objetivo: ${dados.objetivo}`, false);
  mergedTitleRow(`Data da solicitação: ${dados.dataSolicitacao.toLocaleDateString("pt-BR")}`, false);
  sheet.addRow([]);

  const colunas = modelo.mostrarPrecos
    ? ["Código", "Descrição", "Un.", "Quantidade", "Preço ref. (R$)", "Total (R$)"]
    : ["Código", "Descrição", "Un.", "Quantidade"];

  const headerRow = sheet.addRow(colunas);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
  });

  function addItemRow(item: ItemQqpView) {
    const valores: (string | number)[] = [item.codigo, item.descricao, item.unidade, item.quantidadeSolicitada];
    if (modelo.mostrarPrecos) {
      valores.push(item.precoUnitario, valorSolicitado(item));
    }
    const row = sheet.addRow(valores);
    row.eachCell((cell, colNumber) => {
      cell.border = THIN_BORDER;
      if (colNumber === 4) cell.numFmt = "#,##0.0000";
      if (colNumber >= 5) cell.numFmt = "#,##0.00";
    });
    return row;
  }

  function addSectionRow(texto: string, total: number | null) {
    const valores: (string | number)[] = [texto];
    for (let i = 1; i < numColunas - 1; i++) valores.push("");
    valores.push(total ?? "");
    const row = sheet.addRow(valores);
    sheet.mergeCells(row.number, 1, row.number, numColunas - (total !== null ? 1 : 0));
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.cabecaFundo } };
    if (total !== null) {
      const totalCell = row.getCell(numColunas);
      totalCell.font = { bold: true };
      totalCell.numFmt = "#,##0.00";
      totalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.cabecaFundo } };
    }
    return row;
  }

  if (modelo.layoutCabeca === "SEM_AGRUPAMENTO") {
    for (const item of [...dados.itens].sort((a, b) => a.ordem - b.ordem)) {
      addItemRow(item);
    }
  } else {
    for (const cabeca of dados.cabecas) {
      const itensCabeca = dados.itens.filter((i) => i.cabecaId === cabeca.id);
      if (itensCabeca.length === 0) continue;
      addSectionRow(`${cabeca.codigo} — ${cabeca.nome}`, null);
      for (const item of itensCabeca) addItemRow(item);
    }

    const naoAgrupados = dados.itens.filter((i) => i.cabecaId === null);
    if (naoAgrupados.length > 0) {
      addSectionRow("Itens não agrupados", null);
      for (const item of naoAgrupados) addItemRow(item);
    }
  }

  if (modelo.mostrarPrecos) {
    const totalGeral = dados.itens.reduce((acc, i) => acc + valorSolicitado(i), 0);
    sheet.addRow([]);
    const totalRow = sheet.addRow(["Total geral do QQP", "", "", "", "", totalGeral]);
    sheet.mergeCells(totalRow.number, 1, totalRow.number, numColunas - 1);
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(numColunas).font = { bold: true };
    totalRow.getCell(numColunas).numFmt = "#,##0.00";
  }

  sheet.columns = modelo.mostrarPrecos
    ? [{ width: 16 }, { width: 50 }, { width: 8 }, { width: 14 }, { width: 16 }, { width: 16 }]
    : [{ width: 16 }, { width: 50 }, { width: 8 }, { width: 14 }];
}
