-- CreateEnum
CREATE TYPE "StatusModelo" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "LayoutCabecaExportacao" AS ENUM ('DETALHADO', 'TITULO_SECAO', 'SEM_AGRUPAMENTO');

-- CreateTable
CREATE TABLE "ModeloContratacao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusModelo" NOT NULL DEFAULT 'ATIVO',
    "mostrarPrecos" BOOLEAN NOT NULL DEFAULT true,
    "layoutCabeca" "LayoutCabecaExportacao" NOT NULL DEFAULT 'DETALHADO',
    "demonstrativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloContratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportacaoDocumento" (
    "id" TEXT NOT NULL,
    "registroGestaoId" TEXT NOT NULL,
    "modeloContratacaoId" TEXT NOT NULL,
    "versaoModelo" INTEGER NOT NULL,
    "usuarioId" TEXT,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportacaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeloContratacao_codigo_key" ON "ModeloContratacao"("codigo");

-- AddForeignKey
ALTER TABLE "ExportacaoDocumento" ADD CONSTRAINT "ExportacaoDocumento_registroGestaoId_fkey" FOREIGN KEY ("registroGestaoId") REFERENCES "RegistroGestao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportacaoDocumento" ADD CONSTRAINT "ExportacaoDocumento_modeloContratacaoId_fkey" FOREIGN KEY ("modeloContratacaoId") REFERENCES "ModeloContratacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportacaoDocumento" ADD CONSTRAINT "ExportacaoDocumento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
