'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListTab } from './tabs/ListTab'
import { ApprovalTab } from './tabs/ApprovalTab'
import { DashboardTab } from './tabs/DashboardTab'
import { ManagementTab } from './tabs/ManagementTab'
import { ModuleLayout } from './ModuleLayout'
import { BreadcrumbItem } from './ModuleLayout'

export interface ModuleConfig {
  code: string
  name: string
  department: string
  apiEndpoint: string
  tabs: {
    list: boolean
    approval: boolean
    dashboard: boolean
    management: boolean
  }
  breadcrumb: BreadcrumbItem[]
}

interface BaseModuleViewProps {
  config: ModuleConfig
  customListTab?: React.ComponentType<any>
  customApprovalTab?: React.ComponentType<any>
  customDashboardTab?: React.ComponentType<any>
  customManagementTab?: React.ComponentType<any>
}

export function BaseModuleView({
  config,
  customListTab,
  customApprovalTab,
  customDashboardTab,
  customManagementTab,
}: BaseModuleViewProps) {
  const [activeTab, setActiveTab] = useState('list')

  // Componentes customizados ou padrão
  const ListComponent = customListTab || ListTab
  const ApprovalComponent = customApprovalTab || ApprovalTab
  const DashboardComponent = customDashboardTab || DashboardTab
  const ManagementComponent = customManagementTab || ManagementTab

  // Contar abas ativas
  const activeTabs = Object.values(config.tabs).filter(Boolean).length
  const gridCols = `grid-cols-${activeTabs}`

  return (
    <ModuleLayout
      title={config.name}
      breadcrumb={config.breadcrumb}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${gridCols}`}>
          {config.tabs.list && (
            <TabsTrigger value="list">Listagem</TabsTrigger>
          )}
          {config.tabs.approval && (
            <TabsTrigger value="approval">Aprovação</TabsTrigger>
          )}
          {config.tabs.dashboard && (
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          )}
          {config.tabs.management && (
            <TabsTrigger value="management">Gerenciamento</TabsTrigger>
          )}
        </TabsList>

        {config.tabs.list && (
          <TabsContent value="list" className="space-y-6">
            <ListComponent config={config} />
          </TabsContent>
        )}

        {config.tabs.approval && (
          <TabsContent value="approval" className="space-y-6">
            <ApprovalComponent config={config} />
          </TabsContent>
        )}

        {config.tabs.dashboard && (
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardComponent config={config} />
          </TabsContent>
        )}

        {config.tabs.management && (
          <TabsContent value="management" className="space-y-6">
            <ManagementComponent config={config} />
          </TabsContent>
        )}
      </Tabs>
    </ModuleLayout>
  )
}
