import Link from "next/link";
import { notFound } from "next/navigation";
import { getObraAtiva } from "@/lib/obra";
import { COLUNAS, PRECISA_OBRA, TITULOS } from "@/lib/import/schemas";
import type { ImportTipo } from "@/lib/import/types";
import { ImportWizard } from "@/components/import/ImportWizard";
import { ChevronLeft } from "lucide-react";

const ARQUIVOS_MODELO: Record<ImportTipo, string> = {
  "orcamento-executivo": "orcamento-executivo-modelo.csv",
  composicoes: "composicoes-modelo.csv",
  "orcamento-rm": "orcamento-rm-modelo.csv",
  "de-para": "de-para-modelo.csv",
  "modelos-contratacao": "modelos-contratacao-modelo.csv",
};

function ehImportTipo(valor: string): valor is ImportTipo {
  return valor in TITULOS;
}

export default async function ImportarPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!ehImportTipo(tipo)) notFound();

  const precisaObra = PRECISA_OBRA[tipo];
  const obra = precisaObra ? await getObraAtiva() : null;

  if (precisaObra && !obra) {
    return <p className="text-sm text-muted-foreground">Selecione uma obra antes de importar estes dados.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/administracao/importacao"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar para Importação de Dados
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Importar — {TITULOS[tipo]}</h1>
        {obra && <p className="text-sm text-muted-foreground">{obra.codigo} — {obra.nome}</p>}
      </div>

      <ImportWizard
        tipo={tipo}
        titulo={TITULOS[tipo]}
        obraId={obra?.id ?? null}
        colunas={COLUNAS[tipo]}
        arquivoModelo={ARQUIVOS_MODELO[tipo]}
      />
    </div>
  );
}
