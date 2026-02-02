-- CreateEnum
CREATE TYPE "TipoAtribuicaoProtocolo" AS ENUM ('PRINCIPAL', 'DELEGADO', 'ENCAMINHADO', 'CONSULTA', 'APOIO');

-- CreateEnum
CREATE TYPE "SituacaoAtribuicao" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA', 'SUBSTITUIDA', 'PENDENTE');

-- AlterTable
ALTER TABLE "protocols_simplified" ADD COLUMN     "currentAssignedUserId" TEXT,
ADD COLUMN     "organizationalUnitId" TEXT,
ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "protocol_server_assignments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoAtribuicaoProtocolo" NOT NULL,
    "situacao" "SituacaoAtribuicao" NOT NULL DEFAULT 'ATIVA',
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "motivo" TEXT,
    "prioridade" INTEGER,
    "percentualCarga" INTEGER,
    "prazoResposta" TIMESTAMP(3),
    "isDelegacao" BOOLEAN NOT NULL DEFAULT false,
    "delegadoPor" TEXT,
    "ativaAte" TIMESTAMP(3),
    "motivoDelegacao" TEXT,
    "departmentOrigemId" TEXT,
    "departmentOrigemName" TEXT,
    "departmentDestinoId" TEXT,
    "departmentDestinoName" TEXT,
    "isInterdepartamental" BOOLEAN NOT NULL DEFAULT false,
    "employeeAssignmentId" TEXT,
    "organizationalUnitId" TEXT,
    "comentario" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lidoEm" TIMESTAMP(3),
    "respondeEm" TIMESTAMP(3),
    "respostaTexto" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_server_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocol_server_assignments_protocolId_situacao_idx" ON "protocol_server_assignments"("protocolId", "situacao");

-- CreateIndex
CREATE INDEX "protocol_server_assignments_userId_situacao_idx" ON "protocol_server_assignments"("userId", "situacao");

-- CreateIndex
CREATE INDEX "protocol_server_assignments_tipo_situacao_idx" ON "protocol_server_assignments"("tipo", "situacao");

-- CreateIndex
CREATE INDEX "protocol_server_assignments_isDelegacao_ativaAte_idx" ON "protocol_server_assignments"("isDelegacao", "ativaAte");

-- CreateIndex
CREATE INDEX "protocol_server_assignments_employeeAssignmentId_idx" ON "protocol_server_assignments"("employeeAssignmentId");

-- CreateIndex
CREATE INDEX "protocol_server_assignments_organizationalUnitId_idx" ON "protocol_server_assignments"("organizationalUnitId");

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_currentAssignedUserId_fkey" FOREIGN KEY ("currentAssignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_employeeAssignmentId_fkey" FOREIGN KEY ("employeeAssignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
