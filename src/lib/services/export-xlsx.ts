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

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

function valorItem(item: ItemQqpView) {
  return item.quantidadeSolicitada * item.precoUnitario;
}

export async function gerarQqpWorkbook(
  dados: DadosQqpExport,
  modelo: ModeloExport
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "VICTA — Gestão Orçamentária";
  wb.created = new Date();

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
    aviso.getCell(1).font = { italic: true, size: 9, color: { argb: "FFB45309" } };
  }
  mergedTitleRow(`Obra: ${dados.obraCodigo} — ${dados.obraNome}`, false);
  mergedTitleRow(`QQP: ${dados.numero} — ${dados.descricao}`, false);
  if (dados.objetivo) mergedTitleRow(`Objetivo: ${dados.objetivo}`, false);
  mergedTitleRow(
    `Data da solicitação: ${dados.dataSolicitacao.toLocaleDateString("pt-BR")}`,
    false
  );
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
      valores.push(item.precoUnitario, valorItem(item));
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
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    if (total !== null) {
      const totalCell = row.getCell(numColunas);
      totalCell.font = { bold: true };
      totalCell.numFmt = "#,##0.00";
      totalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
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
      const totalCabeca = itensCabeca.reduce((acc, i) => acc + valorItem(i), 0);
      addSectionRow(
        `${cabeca.codigo} — ${cabeca.nome}`,
        modelo.layoutCabeca === "DETALHADO" && modelo.mostrarPrecos ? totalCabeca : null
      );
      for (const item of itensCabeca) addItemRow(item);
    }

    const naoAgrupados = dados.itens.filter((i) => i.cabecaId === null);
    if (naoAgrupados.length > 0) {
      addSectionRow("Itens não agrupados", null);
      for (const item of naoAgrupados) addItemRow(item);
    }
  }

  if (modelo.mostrarPrecos) {
    const totalGeral = dados.itens.reduce((acc, i) => acc + valorItem(i), 0);
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

  return wb;
}
