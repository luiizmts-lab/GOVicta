-- CreateEnum
CREATE TYPE "StatusObra" AS ENUM ('ATIVA', 'CONCLUIDA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "TipoOrcamento" AS ENUM ('EXECUTIVO', 'RM');

-- CreateEnum
CREATE TYPE "TipoInsumo" AS ENUM ('MATERIAL', 'MAO_DE_OBRA', 'MAO_DE_OBRA_TERCEIRIZADA', 'EQUIPAMENTO', 'SERVICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDePara" AS ENUM ('CONCILIADO', 'PARCIAL', 'PENDENTE');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('QQP', 'ADITIVO');

-- CreateEnum
CREATE TYPE "StatusRegistro" AS ENUM ('RASCUNHO', 'EM_VALIDACAO', 'VALIDADO', 'ENVIADO_SUPRIMENTOS', 'EM_COTACAO', 'CONTRATADO', 'DEVOLVIDO', 'CANCELADO', 'SUBSTITUIDO');

-- CreateEnum
CREATE TYPE "TipoOrigemItem" AS ENUM ('TAREFA', 'INSUMO');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoRm" TEXT,
    "responsavel" TEXT,
    "status" "StatusObra" NOT NULL DEFAULT 'ATIVA',
    "dataImportacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisaoOrcamentaria" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "tipoOrcamento" "TipoOrcamento" NOT NULL,
    "numeroRevisao" INTEGER NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisaoOrcamentaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoOrcamentario" (
    "id" TEXT NOT NULL,
    "revisaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupoPaiId" TEXT,

    CONSTRAINT "GrupoOrcamentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaExecutiva" (
    "id" TEXT NOT NULL,
    "revisaoId" TEXT NOT NULL,
    "grupoId" TEXT,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidadeOrcada" DECIMAL(18,4) NOT NULL,
    "precoUnitarioSemBdi" DECIMAL(18,4),
    "precoUnitarioComBdi" DECIMAL(18,4) NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "custoMaoObra" DECIMAL(18,2),
    "custoMaoObraTerceirizada" DECIMAL(18,2),
    "custoServicos" DECIMAL(18,2),
    "custoMateriais" DECIMAL(18,2),
    "codigoApropriacaoRm" TEXT,
    "descricaoApropriacao" TEXT,
    "participacaoPercentual" DECIMAL(7,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarefaExecutiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Composicao" (
    "id" TEXT NOT NULL,
    "tarefaExecutivaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Composicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "tipo" "TipoInsumo" NOT NULL,
    "bancoOrigem" TEXT,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemComposicao" (
    "id" TEXT NOT NULL,
    "composicaoId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "coeficiente" DECIMAL(18,6) NOT NULL,
    "precoUnitario" DECIMAL(18,4) NOT NULL,
    "custoParcial" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "ItemComposicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaRM" (
    "id" TEXT NOT NULL,
    "revisaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "codigoApropriacao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DECIMAL(18,4) NOT NULL,
    "custoTotal" DECIMAL(18,2) NOT NULL,
    "tarefaPaiId" TEXT,
    "nivelHierarquico" INTEGER NOT NULL,

    CONSTRAINT "TarefaRM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeParaOrcamentario" (
    "id" TEXT NOT NULL,
    "tarefaExecutivaId" TEXT NOT NULL,
    "tarefaRmId" TEXT NOT NULL,
    "percentualRateio" DECIMAL(7,4) NOT NULL,
    "valorRateado" DECIMAL(18,2) NOT NULL,
    "status" "StatusDePara" NOT NULL DEFAULT 'PENDENTE',
    "origemMapeamento" TEXT,

    CONSTRAINT "DeParaOrcamentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroGestao" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipoRegistro" "TipoRegistro" NOT NULL DEFAULT 'QQP',
    "descricao" TEXT NOT NULL,
    "objetivo" TEXT,
    "resumoObjeto" TEXT,
    "solicitanteId" TEXT,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL,
    "status" "StatusRegistro" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroGestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QQP" (
    "id" TEXT NOT NULL,
    "registroGestaoId" TEXT NOT NULL,
    "revisaoOrcamentoId" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QQP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemQQP" (
    "id" TEXT NOT NULL,
    "qqpId" TEXT NOT NULL,
    "cabecaId" TEXT,
    "tipoOrigem" "TipoOrigemItem" NOT NULL,
    "tarefaExecutivaId" TEXT NOT NULL,
    "itemComposicaoId" TEXT,
    "codigoOrigemSnapshot" TEXT NOT NULL,
    "descricaoSnapshot" TEXT NOT NULL,
    "unidadeSnapshot" TEXT NOT NULL,
    "quantidadeBaseSnapshot" DECIMAL(18,4) NOT NULL,
    "precoUnitarioSnapshot" DECIMAL(18,4) NOT NULL,
    "quantidadeSolicitada" DECIMAL(18,4) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemQQP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabecaContratacao" (
    "id" TEXT NOT NULL,
    "qqpId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CabecaContratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApropriacaoItemQQP" (
    "id" TEXT NOT NULL,
    "itemQqpId" TEXT NOT NULL,
    "tarefaRmId" TEXT NOT NULL,
    "percentualRateio" DECIMAL(7,4) NOT NULL,
    "valorRateado" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "ApropriacaoItemQQP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "usuarioId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalhe" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Obra_codigo_key" ON "Obra"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "RevisaoOrcamentaria_obraId_tipoOrcamento_numeroRevisao_key" ON "RevisaoOrcamentaria"("obraId", "tipoOrcamento", "numeroRevisao");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoOrcamentario_revisaoId_codigo_key" ON "GrupoOrcamentario"("revisaoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TarefaExecutiva_revisaoId_codigo_key" ON "TarefaExecutiva"("revisaoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Composicao_tarefaExecutivaId_codigo_key" ON "Composicao"("tarefaExecutivaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_codigo_key" ON "Insumo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemComposicao_composicaoId_insumoId_key" ON "ItemComposicao"("composicaoId", "insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "TarefaRM_revisaoId_codigo_key" ON "TarefaRM"("revisaoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "DeParaOrcamentario_tarefaExecutivaId_tarefaRmId_key" ON "DeParaOrcamentario"("tarefaExecutivaId", "tarefaRmId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroGestao_obraId_numero_key" ON "RegistroGestao"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "QQP_registroGestaoId_key" ON "QQP"("registroGestaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemQQP_qqpId_tarefaExecutivaId_itemComposicaoId_key" ON "ItemQQP"("qqpId", "tarefaExecutivaId", "itemComposicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CabecaContratacao_qqpId_codigo_key" ON "CabecaContratacao"("qqpId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ApropriacaoItemQQP_itemQqpId_tarefaRmId_key" ON "ApropriacaoItemQQP"("itemQqpId", "tarefaRmId");

-- AddForeignKey
ALTER TABLE "RevisaoOrcamentaria" ADD CONSTRAINT "RevisaoOrcamentaria_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoOrcamentario" ADD CONSTRAINT "GrupoOrcamentario_revisaoId_fkey" FOREIGN KEY ("revisaoId") REFERENCES "RevisaoOrcamentaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoOrcamentario" ADD CONSTRAINT "GrupoOrcamentario_grupoPaiId_fkey" FOREIGN KEY ("grupoPaiId") REFERENCES "GrupoOrcamentario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaExecutiva" ADD CONSTRAINT "TarefaExecutiva_revisaoId_fkey" FOREIGN KEY ("revisaoId") REFERENCES "RevisaoOrcamentaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaExecutiva" ADD CONSTRAINT "TarefaExecutiva_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoOrcamentario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Composicao" ADD CONSTRAINT "Composicao_tarefaExecutivaId_fkey" FOREIGN KEY ("tarefaExecutivaId") REFERENCES "TarefaExecutiva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComposicao" ADD CONSTRAINT "ItemComposicao_composicaoId_fkey" FOREIGN KEY ("composicaoId") REFERENCES "Composicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComposicao" ADD CONSTRAINT "ItemComposicao_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaRM" ADD CONSTRAINT "TarefaRM_revisaoId_fkey" FOREIGN KEY ("revisaoId") REFERENCES "RevisaoOrcamentaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaRM" ADD CONSTRAINT "TarefaRM_tarefaPaiId_fkey" FOREIGN KEY ("tarefaPaiId") REFERENCES "TarefaRM"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeParaOrcamentario" ADD CONSTRAINT "DeParaOrcamentario_tarefaExecutivaId_fkey" FOREIGN KEY ("tarefaExecutivaId") REFERENCES "TarefaExecutiva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeParaOrcamentario" ADD CONSTRAINT "DeParaOrcamentario_tarefaRmId_fkey" FOREIGN KEY ("tarefaRmId") REFERENCES "TarefaRM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGestao" ADD CONSTRAINT "RegistroGestao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGestao" ADD CONSTRAINT "RegistroGestao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QQP" ADD CONSTRAINT "QQP_registroGestaoId_fkey" FOREIGN KEY ("registroGestaoId") REFERENCES "RegistroGestao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QQP" ADD CONSTRAINT "QQP_revisaoOrcamentoId_fkey" FOREIGN KEY ("revisaoOrcamentoId") REFERENCES "RevisaoOrcamentaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemQQP" ADD CONSTRAINT "ItemQQP_qqpId_fkey" FOREIGN KEY ("qqpId") REFERENCES "QQP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemQQP" ADD CONSTRAINT "ItemQQP_cabecaId_fkey" FOREIGN KEY ("cabecaId") REFERENCES "CabecaContratacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemQQP" ADD CONSTRAINT "ItemQQP_tarefaExecutivaId_fkey" FOREIGN KEY ("tarefaExecutivaId") REFERENCES "TarefaExecutiva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemQQP" ADD CONSTRAINT "ItemQQP_itemComposicaoId_fkey" FOREIGN KEY ("itemComposicaoId") REFERENCES "ItemComposicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabecaContratacao" ADD CONSTRAINT "CabecaContratacao_qqpId_fkey" FOREIGN KEY ("qqpId") REFERENCES "QQP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApropriacaoItemQQP" ADD CONSTRAINT "ApropriacaoItemQQP_itemQqpId_fkey" FOREIGN KEY ("itemQqpId") REFERENCES "ItemQQP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApropriacaoItemQQP" ADD CONSTRAINT "ApropriacaoItemQQP_tarefaRmId_fkey" FOREIGN KEY ("tarefaRmId") REFERENCES "TarefaRM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
