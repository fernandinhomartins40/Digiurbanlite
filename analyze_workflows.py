#!/usr/bin/env python3
"""
Script de Análise de Workflows vs Serviços
Identifica serviços COM_DADOS que solicitam documentos mas não têm stages adequadas
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Any
from collections import defaultdict

# Diretório base
BASE_DIR = Path(r"c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds")
SERVICES_DIR = BASE_DIR / "services"
WORKFLOWS_FILE = BASE_DIR / "service-workflows.seed.ts"
MODULE_WORKFLOWS_FILE = BASE_DIR / "module-workflows.seed.ts"

class ServiceAnalyzer:
    def __init__(self):
        self.services = []
        self.custom_workflows = {}
        self.default_workflow_stages = []
        self.secretarias = {
            'health.seed.ts': 'Saúde',
            'education.seed.ts': 'Educação',
            'social.seed.ts': 'Assistência Social',
            'agriculture.seed.ts': 'Agricultura',
            'culture.seed.ts': 'Cultura',
            'sports.seed.ts': 'Esportes',
            'housing.seed.ts': 'Habitação',
            'environment.seed.ts': 'Meio Ambiente',
            'public-works.seed.ts': 'Obras Públicas',
            'urban-planning.seed.ts': 'Planejamento Urbano',
            'public-safety.seed.ts': 'Segurança Pública',
            'public-services.seed.ts': 'Serviços Públicos',
            'tourism.seed.ts': 'Turismo',
            'finance.seed.ts': 'Finanças',
            'administration.seed.ts': 'Administração',
            'civil-defense.seed.ts': 'Defesa Civil',
            'women-policies.seed.ts': 'Políticas para Mulheres',
            'technology-innovation.seed.ts': 'Tecnologia e Inovação',
            'transport-transit.seed.ts': 'Transportes e Trânsito',
            'economic-development.seed.ts': 'Desenvolvimento Econômico',
            'urban-mobility.seed.ts': 'Mobilidade Urbana'
        }

    def extract_services_from_file(self, file_path: Path, secretaria: str):
        """Extrai todos os serviços de um arquivo seed"""
        print(f"  Lendo {file_path.name}...")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Encontrar todos os objetos de serviço
            # Padrão: { name: '...', ... }
            service_pattern = r'\{[\s\S]*?name:\s*[\'"]([^\'"]+)[\'"][\s\S]*?\}'

            # Split por linhas e processar serviços
            lines = content.split('\n')
            current_service = None
            brace_count = 0
            service_lines = []

            for line in lines:
                # Detectar início de um serviço (linha com 'name:')
                if 'name:' in line and ('serviceType:' in content[content.find(line):content.find(line)+500] or True):
                    if current_service is not None and brace_count == 0:
                            # Processar serviço anterior
                        service_text = '\n'.join(service_lines)
                        service_data = self.parse_service(service_text, secretaria)
                        if service_data:
                            self.services.append(service_data)
                        service_lines = []
                    current_service = line
                    brace_count = line.count('{') - line.count('}')
                    service_lines.append(line)
                elif current_service is not None:
                    service_lines.append(line)
                    brace_count += line.count('{') - line.count('}')

                    if brace_count == 0 and '},' in line:
                        # Fim do serviço
                        service_text = '\n'.join(service_lines)
                        service_data = self.parse_service(service_text, secretaria)
                        if service_data:
                            self.services.append(service_data)
                        current_service = None
                        service_lines = []

        except Exception as e:
            print(f"    ERRO Erro ao ler {file_path.name}: {e}")

    def parse_service(self, service_text: str, secretaria: str) -> Dict:
        """Parse de um serviço individual"""
        try:
            # Extrair campos principais
            name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", service_text)
            type_match = re.search(r"serviceType:\s*['\"]([^'\"]+)['\"]", service_text)
            module_match = re.search(r"moduleType:\s*['\"]([^'\"]+)['\"]", service_text)
            requires_docs_match = re.search(r"requiresDocuments:\s*(true|false)", service_text)

            if not name_match:
                return None

            service = {
                'name': name_match.group(1),
                'serviceType': type_match.group(1) if type_match else 'UNKNOWN',
                'moduleType': module_match.group(1) if module_match else 'UNKNOWN',
                'requiresDocuments': requires_docs_match and requires_docs_match.group(1) == 'true',
                'hasFileFields': 'type: "file"' in service_text or "type: 'file'" in service_text,
                'requiredDocuments': [],
                'secretaria': secretaria
            }

            # Extrair documentos obrigatórios
            req_docs_match = re.search(r'requiredDocuments:\s*\[(.*?)\]', service_text, re.DOTALL)
            if req_docs_match:
                docs_text = req_docs_match.group(1)
                docs = re.findall(r"['\"]([^'\"]+)['\"]", docs_text)
                service['requiredDocuments'] = docs

            return service

        except Exception as e:
            print(f"    AVISO  Erro ao parsear serviço: {e}")
            return None

    def extract_custom_workflows(self):
        """Extrai todos os workflows customizados"""
        print("\n  Lendo workflows customizados...")

        try:
            with open(WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extrair workflows por moduleType
            workflow_pattern = r"([A-Z_]+):\s*\{[\s\S]*?moduleType:\s*['\"]([A-Z_]+)['\"][\s\S]*?stages:\s*\[([\s\S]*?)\][\s\S]*?\}"

            # Método mais robusto: split por workflows
            sections = content.split('\n  ')

            for section in sections:
                if 'moduleType:' in section and 'stages:' in section:
                    module_match = re.search(r"moduleType:\s*['\"]([^'\"]+)['\"]", section)
                    if module_match:
                        module_type = module_match.group(1)

                        # Verificar se tem "Análise Documental" ou similar nas stages
                        has_document_stage = any(term in section for term in [
                            'Análise Documental',
                            'Análise de Documentos',
                            'Verificação Documental',
                            'Aprovação de Documentos',
                            'Validação Documental'
                        ])

                        # Contar stages
                        stage_count = section.count('name:') - 1  # -1 para remover o moduleType name

                        self.custom_workflows[module_type] = {
                            'hasDocumentStage': has_document_stage,
                            'stageCount': max(0, stage_count)
                        }

            print(f"    OK {len(self.custom_workflows)} workflows customizados encontrados")

        except Exception as e:
            print(f"    ERRO Erro ao ler workflows: {e}")

    def extract_default_workflow(self):
        """Extrai o workflow padrão"""
        print("\n  Lendo workflow padrão...")

        try:
            with open(MODULE_WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
                content = f.read()

            # O workflow padrão tem "Em Análise", "Pendente", etc
            # mas NÃO tem "Análise Documental" específica
            self.default_workflow_stages = [
                'Em Análise',
                'Pendente',
                'Aprovado',
                'Reprovado',
                'Concluído',
                'Cancelado'
            ]

            print(f"    OK Workflow padrão: {len(self.default_workflow_stages)} stages")

        except Exception as e:
            print(f"    ERRO Erro ao ler workflow padrão: {e}")

    def analyze(self):
        """Análise principal"""
        print("\n" + "="*80)
        print("ANALISE DE WORKFLOWS vs SERVICOS")
        print("="*80)

        # 1. Carregar serviços
        print("\nCARREGANDO SERVICOS DAS 21 SECRETARIAS...")
        for filename, secretaria in self.secretarias.items():
            file_path = SERVICES_DIR / filename
            if file_path.exists():
                self.extract_services_from_file(file_path, secretaria)

        print(f"\n  Total de servicos carregados: {len(self.services)}")

        # 2. Carregar workflows
        print("\nCARREGANDO WORKFLOWS...")
        self.extract_custom_workflows()
        self.extract_default_workflow()

        # 3. Análise
        print("\n" + "="*80)
        print("ANALISE DE INCONSISTENCIAS")
        print("="*80)

        # Categorizar serviços
        categoria_a = []  # CRÍTICO: COM_DADOS + docs + workflow padrão
        categoria_b = []  # ATENÇÃO: COM_DADOS + docs + workflow custom SEM stage docs
        categoria_c = []  # OK: COM_DADOS + docs + workflow custom COM stage docs
        categoria_d = []  # DESNECESSÁRIO: SEM_DADOS mas com docs

        for service in self.services:
            needs_documents = (
                service['requiresDocuments'] or
                service['hasFileFields'] or
                len(service['requiredDocuments']) > 0
            )

            is_com_dados = 'COM_DADOS' in service['serviceType']
            module_type = service['moduleType']
            has_custom_workflow = module_type in self.custom_workflows

            if not is_com_dados and needs_documents:
                # Categoria D
                categoria_d.append(service)
            elif is_com_dados and needs_documents:
                if not has_custom_workflow:
                    # Categoria A - CRÍTICO
                    categoria_a.append(service)
                else:
                    # Verificar se o workflow custom tem stage de documentos
                    workflow = self.custom_workflows[module_type]
                    if workflow['hasDocumentStage']:
                        # Categoria C - OK
                        categoria_c.append(service)
                    else:
                        # Categoria B - ATENÇÃO
                        categoria_b.append(service)

        # Gerar relatório
        self.generate_report(categoria_a, categoria_b, categoria_c, categoria_d)

    def generate_report(self, cat_a, cat_b, cat_c, cat_d):
        """Gera relatório markdown"""

        report_lines = []

        report_lines.append("# 🔍 ANÁLISE COMPLETA: WORKFLOWS vs SERVIÇOS")
        report_lines.append("")
        report_lines.append("**Data da Análise:** " + "2025-01-XX")
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")

        # Sumário Executivo
        report_lines.append("## 📊 SUMÁRIO EXECUTIVO")
        report_lines.append("")
        report_lines.append(f"- **Total de Serviços Analisados:** {len(self.services)}")
        report_lines.append(f"- **Workflows Customizados:** {len(self.custom_workflows)}")
        report_lines.append(f"- **Serviços COM_DADOS:** {sum(1 for s in self.services if 'COM_DADOS' in s['serviceType'])}")
        report_lines.append(f"- **Serviços SEM_DADOS:** {sum(1 for s in self.services if 'SEM_DADOS' in s['serviceType'])}")
        report_lines.append(f"- **Serviços que solicitam documentos:** {sum(1 for s in self.services if s['requiresDocuments'] or s['hasFileFields'])}")
        report_lines.append("")

        # Problemas Identificados
        report_lines.append("### AVISO PROBLEMAS IDENTIFICADOS")
        report_lines.append("")
        report_lines.append(f"- **🔴 CRÍTICO (Categoria A):** {len(cat_a)} serviços")
        report_lines.append(f"- **🟡 ATENÇÃO (Categoria B):** {len(cat_b)} serviços")
        report_lines.append(f"- **🟢 OK (Categoria C):** {len(cat_c)} serviços")
        report_lines.append(f"- **🟣 DESNECESSÁRIO (Categoria D):** {len(cat_d)} serviços")
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")

        # Categoria A - CRÍTICO
        report_lines.append("## 🔴 CATEGORIA A - CRÍTICO")
        report_lines.append("")
        report_lines.append("**Serviços COM_DADOS que solicitam documentos mas usam workflow PADRÃO**")
        report_lines.append("")
        report_lines.append("Estes serviços NÃO têm workflow customizado e dependem do workflow padrão,")
        report_lines.append("que possui apenas stages genéricas (Em Análise, Pendente, Aprovado, etc.)")
        report_lines.append("sem uma etapa específica de **Análise Documental**.")
        report_lines.append("")

        if cat_a:
            report_lines.append(f"**Total: {len(cat_a)} serviços**")
            report_lines.append("")

            # Agrupar por secretaria
            by_secretaria = defaultdict(list)
            for service in cat_a:
                by_secretaria[service['secretaria']].append(service)

            for secretaria in sorted(by_secretaria.keys()):
                services = by_secretaria[secretaria]
                report_lines.append(f"### {secretaria} ({len(services)} serviços)")
                report_lines.append("")
                report_lines.append("| Serviço | Tipo | ModuleType | Documentos |")
                report_lines.append("|---------|------|------------|------------|")
                for s in services:
                    docs = ', '.join(s['requiredDocuments'][:2]) if s['requiredDocuments'] else '(via form)'
                    if len(s['requiredDocuments']) > 2:
                        docs += '...'
                    report_lines.append(f"| {s['name']} | {s['serviceType']} | {s['moduleType']} | {docs} |")
                report_lines.append("")
        else:
            report_lines.append("OK Nenhum serviço nesta categoria!")
            report_lines.append("")

        report_lines.append("---")
        report_lines.append("")

        # Categoria B - ATENÇÃO
        report_lines.append("## 🟡 CATEGORIA B - ATENÇÃO")
        report_lines.append("")
        report_lines.append("**Serviços COM_DADOS que solicitam documentos e têm workflow customizado,")
        report_lines.append("mas o workflow NÃO inclui stage explícita de Análise Documental**")
        report_lines.append("")

        if cat_b:
            report_lines.append(f"**Total: {len(cat_b)} serviços**")
            report_lines.append("")

            by_secretaria = defaultdict(list)
            for service in cat_b:
                by_secretaria[service['secretaria']].append(service)

            for secretaria in sorted(by_secretaria.keys()):
                services = by_secretaria[secretaria]
                report_lines.append(f"### {secretaria} ({len(services)} serviços)")
                report_lines.append("")
                report_lines.append("| Serviço | Tipo | ModuleType | Documentos | Stages |")
                report_lines.append("|---------|------|------------|------------|---------|")
                for s in services:
                    docs = ', '.join(s['requiredDocuments'][:2]) if s['requiredDocuments'] else '(via form)'
                    if len(s['requiredDocuments']) > 2:
                        docs += '...'
                    workflow = self.custom_workflows.get(s['moduleType'], {})
                    stages = workflow.get('stageCount', '?')
                    report_lines.append(f"| {s['name']} | {s['serviceType']} | {s['moduleType']} | {docs} | {stages} |")
                report_lines.append("")
        else:
            report_lines.append("OK Nenhum serviço nesta categoria!")
            report_lines.append("")

        report_lines.append("---")
        report_lines.append("")

        # Categoria C - OK
        report_lines.append("## 🟢 CATEGORIA C - OK")
        report_lines.append("")
        report_lines.append("**Serviços COM_DADOS que solicitam documentos e têm workflow adequado**")
        report_lines.append("")
        report_lines.append(f"**Total: {len(cat_c)} serviços**")
        report_lines.append("")
        report_lines.append("Estes serviços estão configurados corretamente! OK")
        report_lines.append("")

        # Listar apenas os primeiros 10
        if cat_c:
            report_lines.append("**Exemplos (primeiros 10):**")
            report_lines.append("")
            report_lines.append("| Serviço | ModuleType | Secretaria |")
            report_lines.append("|---------|------------|------------|")
            for s in cat_c[:10]:
                report_lines.append(f"| {s['name']} | {s['moduleType']} | {s['secretaria']} |")
            if len(cat_c) > 10:
                report_lines.append(f"| ... e mais {len(cat_c) - 10} serviços | | |")
            report_lines.append("")

        report_lines.append("---")
        report_lines.append("")

        # Categoria D
        report_lines.append("## 🟣 CATEGORIA D - DESNECESSÁRIO")
        report_lines.append("")
        report_lines.append("**Serviços SEM_DADOS que solicitam documentos**")
        report_lines.append("")
        report_lines.append("Isto pode ser uma inconsistência: serviços SEM_DADOS normalmente não deveriam")
        report_lines.append("solicitar documentos ou ter workflows complexos.")
        report_lines.append("")

        if cat_d:
            report_lines.append(f"**Total: {len(cat_d)} serviços**")
            report_lines.append("")
            report_lines.append("| Serviço | Tipo | ModuleType | Secretaria |")
            report_lines.append("|---------|------|------------|------------|")
            for s in cat_d:
                report_lines.append(f"| {s['name']} | {s['serviceType']} | {s['moduleType']} | {s['secretaria']} |")
            report_lines.append("")
        else:
            report_lines.append("OK Nenhum serviço nesta categoria!")
            report_lines.append("")

        report_lines.append("---")
        report_lines.append("")

        # Estatísticas por Secretaria
        report_lines.append("## 📈 ESTATÍSTICAS POR SECRETARIA")
        report_lines.append("")

        stats_by_sec = defaultdict(lambda: {'total': 0, 'com_docs': 0, 'problemas': 0})

        for service in self.services:
            sec = service['secretaria']
            stats_by_sec[sec]['total'] += 1
            if service['requiresDocuments'] or service['hasFileFields']:
                stats_by_sec[sec]['com_docs'] += 1

        for service in cat_a + cat_b:
            sec = service['secretaria']
            stats_by_sec[sec]['problemas'] += 1

        report_lines.append("| Secretaria | Total Serviços | Com Documentos | Problemas | % Problemas |")
        report_lines.append("|------------|----------------|----------------|-----------|-------------|")

        for sec in sorted(stats_by_sec.keys()):
            stats = stats_by_sec[sec]
            pct = (stats['problemas'] / stats['total'] * 100) if stats['total'] > 0 else 0
            report_lines.append(f"| {sec} | {stats['total']} | {stats['com_docs']} | {stats['problemas']} | {pct:.1f}% |")

        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")

        # Recomendações
        report_lines.append("## 💡 RECOMENDAÇÕES")
        report_lines.append("")
        report_lines.append("### 1. Para Categoria A (CRÍTICO)")
        report_lines.append("")
        report_lines.append(f"**{len(cat_a)} serviços precisam de workflows customizados**")
        report_lines.append("")
        report_lines.append("**Ação recomendada:**")
        report_lines.append("- Criar workflows específicos para cada moduleType")
        report_lines.append("- Incluir stage de 'Análise Documental' após 'Recepção'")
        report_lines.append("- Definir documentos obrigatórios em cada stage")
        report_lines.append("")

        report_lines.append("### 2. Para Categoria B (ATENÇÃO)")
        report_lines.append("")
        report_lines.append(f"**{len(cat_b)} workflows existentes precisam de ajustes**")
        report_lines.append("")
        report_lines.append("**Ação recomendada:**")
        report_lines.append("- Adicionar stage de 'Análise Documental' nos workflows existentes")
        report_lines.append("- Posicionar após 'Recepção' e antes de 'Validação de Dados'")
        report_lines.append("- Configurar metadados de UI (availableTabs, primaryTab, etc)")
        report_lines.append("")

        report_lines.append("### 3. Modelo de Stage Recomendado")
        report_lines.append("")
        report_lines.append("```typescript")
        report_lines.append("{")
        report_lines.append("  name: 'Análise Documental',")
        report_lines.append("  order: 2,")
        report_lines.append("  description: 'Verificação e validação dos documentos obrigatórios',")
        report_lines.append("  slaDays: 3,")
        report_lines.append("  availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],")
        report_lines.append("  primaryTab: 'documentos',")
        report_lines.append("  requiredDocumentTypes: ['...'], // Lista de documentos obrigatórios")
        report_lines.append("  requiredFormFields: [],")
        report_lines.append("  allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],")
        report_lines.append("  canSkip: false")
        report_lines.append("}")
        report_lines.append("```")
        report_lines.append("")

        report_lines.append("---")
        report_lines.append("")
        report_lines.append("## 📝 CONCLUSÃO")
        report_lines.append("")
        total_problemas = len(cat_a) + len(cat_b)
        pct_problemas = (total_problemas / len(self.services) * 100) if len(self.services) > 0 else 0
        report_lines.append(f"**{total_problemas} de {len(self.services)} serviços ({pct_problemas:.1f}%) apresentam inconsistências**")
        report_lines.append(f"relacionadas a workflows e documentos.")
        report_lines.append("")
        report_lines.append("A maioria dos problemas está em serviços que **solicitam documentos mas não têm**")
        report_lines.append("**uma stage específica de Análise Documental** em seus workflows.")
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")
        report_lines.append("*Relatório gerado automaticamente por `analyze_workflows.py`*")

        # Salvar relatório
        report_path = Path(r"c:\Projetos Cursor\Digiurbanlite\IMPLEMENTACAO_COMPLETA.md")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))

        print(f"\nOK Relatorio salvo em: {report_path}")
        print(f"\nRESUMO:")
        print(f"  - CRITICO (A): {len(cat_a)} servicos")
        print(f"  - ATENCAO (B): {len(cat_b)} servicos")
        print(f"  - OK (C): {len(cat_c)} servicos")
        print(f"  - DESNECESSARIO (D): {len(cat_d)} servicos")
        print(f"  - Total de problemas: {total_problemas} ({pct_problemas:.1f}%)")


if __name__ == '__main__':
    analyzer = ServiceAnalyzer()
    analyzer.analyze()
    print("\nOK Analise concluida!")
