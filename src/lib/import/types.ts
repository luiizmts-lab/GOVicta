export type ImportTipo =
  | "orcamento-executivo"
  | "composicoes"
  | "orcamento-rm"
  | "de-para"
  | "modelos-contratacao";

export type ColunaDef = {
  chave: string;
  rotulo: string;
  obrigatoria: boolean;
  tipo: "texto" | "numero" | "enum";
  opcoes?: string[];
};

/** Linha bruta lida do CSV, chaveada pelo cabeçalho original do arquivo. */
export type LinhaBruta = Record<string, string>;

/** Mapeamento campo-canônico -> cabeçalho do arquivo enviado (ou null se não mapeado). */
export type Mapeamento = Record<string, string | null>;

export type LinhaValidada = {
  numeroLinha: number;
  dados: Record<string, string | number | null>;
  erros: string[];
};

export type ResultadoValidacao = {
  colunas: ColunaDef[];
  linhas: LinhaValidada[];
  totalLinhas: number;
  linhasComErro: number;
};

export type ResultadoImportacao = {
  criados: number;
  atualizados: number;
  mensagem: string;
};
