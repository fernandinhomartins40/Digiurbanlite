export interface DocumentTemplate {
  id: string
  name: string
  code: string
  description?: string
  documentType: string
  outputFormat: string
  htmlTemplate: string
  headerHtml?: string
  footerHtml?: string
  cssStyles?: string
  pageSize: string
  orientation: string
  availableVariables?: Array<{
    name: string
    description: string
    example: string
  }>
  isGlobal: boolean
  isActive: boolean
  version: number
  createdAt: string
  _count?: {
    generatedDocuments: number
  }
}
