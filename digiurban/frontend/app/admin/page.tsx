export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Portal Administrativo
          </h1>
          <p className="text-muted-foreground">
            Sistema de gestão municipal integrado
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dashboard Executivo */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Dashboard Executivo</h2>
            <p className="text-muted-foreground mb-4">
              KPIs e métricas municipais
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 w-full">
              Ver Dashboard
            </button>
          </div>

          {/* Gerenciador de Protocolos */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Protocolos</h2>
            <p className="text-muted-foreground mb-4">
              Gestão unificada de protocolos
            </p>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 w-full">
              Gerenciar
            </button>
          </div>

          {/* Catálogo de Serviços */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Serviços</h2>
            <p className="text-muted-foreground mb-4">
              Configurar serviços municipais
            </p>
            <button className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:bg-accent/80 w-full">
              Configurar
            </button>
          </div>

          {/* Criar Chamado */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Criar Chamado</h2>
            <p className="text-muted-foreground mb-4">
              Protocolo top-down para setores
            </p>
            <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 w-full">
              Novo Chamado
            </button>
          </div>

          {/* Módulos Setoriais */}
          <div className="col-span-full">
            <h2 className="text-2xl font-semibold mb-6">Módulos Setoriais</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                'Saúde',
                'Educação',
                'Assistência Social',
                'Cultura',
                'Segurança Pública',
                'Planejamento Urbano',
                'Agricultura',
                'Esportes',
                'Turismo',
                'Habitação',
                'Meio Ambiente',
                'Obras Públicas',
                'Serviços Públicos'
              ].map((modulo) => (
                <div key={modulo} className="bg-muted rounded-lg p-4 text-center hover:bg-muted/80 cursor-pointer">
                  <p className="font-medium">{modulo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gestão de Usuários */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Usuários</h2>
            <p className="text-muted-foreground mb-4">
              Gerenciar equipes e permissões
            </p>
            <button className="bg-outline border px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full">
              Gerenciar
            </button>
          </div>

          {/* Relatórios */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Relatórios</h2>
            <p className="text-muted-foreground mb-4">
              Business Intelligence municipal
            </p>
            <button className="bg-outline border px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full">
              Ver Relatórios
            </button>
          </div>

          {/* Configurações */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Configurações</h2>
            <p className="text-muted-foreground mb-4">
              Configurações do sistema
            </p>
            <button className="bg-outline border px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full">
              Configurar
            </button>
          </div>

          {/* Ficha Cidadão */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Ficha Cidadão</h2>
            <p className="text-muted-foreground mb-4">
              Histórico completo de atendimentos
            </p>
            <button className="bg-outline border px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full">
              Consultar
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}