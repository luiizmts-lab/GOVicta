import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQqpDetalhado } from "@/lib/services/qqp";
import { registrarExportacao } from "@/lib/services/modelo";
import { gerarQqpWorkbook } from "@/lib/services/export-xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modeloId = request.nextUrl.searchParams.get("modeloId");

  if (!modeloId) {
    return NextResponse.json({ error: "Informe o modeloId." }, { status: 400 });
  }

  const [qqp, modelo] = await Promise.all([
    getQqpDetalhado(id),
    prisma.modeloContratacao.findUnique({ where: { id: modeloId } }),
  ]);

  if (!qqp) return NextResponse.json({ error: "QQP não encontrado." }, { status: 404 });
  if (!modelo) return NextResponse.json({ error: "Modelo de contratação não encontrado." }, { status: 404 });

  const workbook = await gerarQqpWorkbook(
    {
      obraCodigo: qqp.registro.obraCodigo,
      obraNome: qqp.registro.obraNome,
      numero: qqp.registro.numero,
      descricao: qqp.registro.descricao,
      objetivo: qqp.registro.objetivo,
      dataSolicitacao: qqp.registro.dataSolicitacao,
      itens: qqp.itens,
      cabecas: qqp.cabecas,
    },
    modelo
  );

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  await registrarExportacao({
    registroGestaoId: qqp.registro.id,
    modeloContratacaoId: modelo.id,
    versaoModelo: modelo.versao,
    usuarioId: userData.user?.id ?? null,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${qqp.registro.numero}-${modelo.codigo}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
