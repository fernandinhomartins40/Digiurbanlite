'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Download, Loader2, FileText } from 'lucide-react'
import { getRelationshipLabel } from '@/shared/constants/family.constants'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null
  member: {
    id: string
    name: string
    cpf: string
    email?: string
    phone?: string
    birthDate?: string
  }
}

interface FamilyExportButtonProps {
  head: {
    id: string
    name: string
    cpf: string
    email: string
  }
  members: FamilyMember[]
  stats?: any
}

export function FamilyExportButton({ head, members, stats }: FamilyExportButtonProps) {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)

  const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return 'Não informado'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} anos`
  }

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'Não informado'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const generatePrintableHTML = () => {
    const date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Composição Familiar - ${head.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #1e40af;
          }
          .header p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: #eff6ff;
            padding: 10px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 15px;
            font-weight: bold;
            color: #1e40af;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 3px;
          }
          .info-value {
            font-weight: 500;
            color: #111827;
          }
          .member-card {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            break-inside: avoid;
          }
          .member-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .member-name {
            font-weight: bold;
            font-size: 16px;
            color: #111827;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 5px;
          }
          .badge-relationship {
            background: #dbeafe;
            color: #1e40af;
          }
          .badge-dependent {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-pcd {
            background: #e9d5ff;
            color: #6b21a8;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
          }
          .stat-card {
            text-align: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Composição Familiar</h1>
          <p>Documento gerado em ${date}</p>
        </div>

        <!-- Responsável da Família -->
        <div class="section">
          <div class="section-title">👑 Responsável da Família</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nome Completo</div>
              <div class="info-value">${head.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">CPF</div>
              <div class="info-value">${head.cpf}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${head.email}</div>
            </div>
          </div>
        </div>

        <!-- Membros da Família -->
        <div class="section">
          <div class="section-title">Membros da Família (${members.length})</div>
          ${members.length === 0
            ? '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum membro cadastrado</p>'
            : members.map((member, idx) => `
              <div class="member-card">
                <div class="member-header">
                  <div>
                    <div class="member-name">
                      ${idx + 1}. ${member?.member?.name || 'Nome não disponível'}
                      <span class="badge badge-relationship">${getRelationshipLabel(member.relationship)}</span>
                      ${member.isDependent ? '<span class="badge badge-dependent">Dependente</span>' : ''}
                      ${member.hasDisability ? '<span class="badge badge-pcd">PCD</span>' : ''}
                    </div>
                  </div>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">CPF</div>
                    <div class="info-value">${member?.member?.cpf || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Idade</div>
                    <div class="info-value">${member?.member?.birthDate ? calculateAge(member.member.birthDate) : 'Não informado'}</div>
                  </div>
                  ${member.occupation ? `
                    <div class="info-item">
                      <div class="info-label">Ocupação</div>
                      <div class="info-value">${member.occupation}</div>
                    </div>
                  ` : ''}
                  ${member.education ? `
                    <div class="info-item">
                      <div class="info-label">Escolaridade</div>
                      <div class="info-value">${member.education}</div>
                    </div>
                  ` : ''}
                  ${member.monthlyIncome ? `
                    <div class="info-item">
                      <div class="info-label">Renda Mensal</div>
                      <div class="info-value">${formatCurrency(member.monthlyIncome)}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
        </div>

        <!-- Estatísticas -->
        ${stats ? `
          <div class="section">
            <div class="section-title">Estatísticas da Família</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.totalMembers || 0}</div>
                <div class="stat-label">Total de Membros</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.totalDependents || 0}</div>
                <div class="stat-label">Dependentes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.totalChildren || 0}</div>
                <div class="stat-label">Crianças</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.totalElderly || 0}</div>
                <div class="stat-label">Idosos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.totalWithDisability || 0}</div>
                <div class="stat-label">PCD</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatCurrency(stats.incomePerCapita)}</div>
                <div class="stat-label">Renda Per Capita</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>DigiUrban - Sistema de Gestão Municipal</p>
          <p>Este documento é válido apenas para fins informativos</p>
        </div>
      </body>
      </html>
    `
  }

  const handleExport = () => {
    try {
      setExporting(true)

      // Gerar HTML
      const htmlContent = generatePrintableHTML()

      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Bloqueio de pop-up detectado. Por favor, permita pop-ups para este site.')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Aguardar carregamento e abrir diálogo de impressão
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setExporting(false)
        }, 250)
      }

      toast({
        title: 'Exportação iniciada',
        description: 'Prepare-se para salvar o PDF através do diálogo de impressão'
      })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        description: error.message || 'Não foi possível exportar o documento'
      })
      setExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      variant="outline"
      size="sm"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </>
      )}
    </Button>
  )
}
