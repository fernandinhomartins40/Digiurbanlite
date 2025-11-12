# ============================================================================
# SCRIPT DE CONFIGURAÇÃO POSTGRESQL PARA DIGIURBAN
# ============================================================================
# Execute como Administrador: Set-ExecutionPolicy Bypass -Scope Process; .\setup-postgres.ps1

Write-Host "🚀 Configurando PostgreSQL para DigiUrban..." -ForegroundColor Green

# Variáveis
$POSTGRES_PATH = "C:\Program Files\PostgreSQL\16"
$PGDATA = "C:\PostgreSQL\16\data"
$DB_NAME = "digiurban"
$DB_USER = "digiurban"
$DB_PASSWORD = "digiurban_dev_2025"

# 1. Verificar se PostgreSQL está instalado
if (!(Test-Path "$POSTGRES_PATH\bin\psql.exe")) {
    Write-Host "❌ PostgreSQL não encontrado. Instalando..." -ForegroundColor Yellow
    winget install --id PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
    Write-Host "✅ PostgreSQL instalado!" -ForegroundColor Green
}

# 2. Criar diretório de dados
Write-Host "📁 Criando diretório de dados..." -ForegroundColor Cyan
if (!(Test-Path $PGDATA)) {
    New-Item -ItemType Directory -Path $PGDATA -Force | Out-Null
}

# 3. Inicializar cluster (se não existir)
if (!(Test-Path "$PGDATA\PG_VERSION")) {
    Write-Host "🔧 Inicializando cluster PostgreSQL..." -ForegroundColor Cyan
    & "$POSTGRES_PATH\bin\initdb.exe" -D $PGDATA -U postgres -A trust -E UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao inicializar cluster" -ForegroundColor Red
        exit 1
    }
}

# 4. Configurar postgresql.conf para permitir conexões locais
Write-Host "⚙️  Configurando PostgreSQL..." -ForegroundColor Cyan
$postgresqlConf = "$PGDATA\postgresql.conf"
if (Test-Path $postgresqlConf) {
    (Get-Content $postgresqlConf) -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'" | Set-Content $postgresqlConf
    (Get-Content $postgresqlConf) -replace "#port = 5432", "port = 5432" | Set-Content $postgresqlConf
}

# 5. Configurar pg_hba.conf para permitir autenticação
$pgHbaConf = "$PGDATA\pg_hba.conf"
if (Test-Path $pgHbaConf) {
    Add-Content $pgHbaConf "`nhost    all             all             127.0.0.1/32            trust"
    Add-Content $pgHbaConf "host    all             all             ::1/128                 trust"
}

# 6. Registrar e iniciar serviço Windows
Write-Host "🔧 Registrando serviço Windows..." -ForegroundColor Cyan
$serviceName = "postgresql-digiurban"

# Remover serviço antigo se existir
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    & "$POSTGRES_PATH\bin\pg_ctl.exe" unregister -N $serviceName -ErrorAction SilentlyContinue
}

# Registrar novo serviço
& "$POSTGRES_PATH\bin\pg_ctl.exe" register -N $serviceName -D $PGDATA -U "NT AUTHORITY\NetworkService"

# Iniciar serviço
Write-Host "▶️  Iniciando PostgreSQL..." -ForegroundColor Cyan
Start-Service -Name $serviceName

# Aguardar PostgreSQL estar pronto
Start-Sleep -Seconds 5

# 7. Criar usuário e database
Write-Host "👤 Criando usuário e database..." -ForegroundColor Cyan

# Criar usuário digiurban
& "$POSTGRES_PATH\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Usuário '$DB_USER' criado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Usuário '$DB_USER' já existe" -ForegroundColor Yellow
}

# Criar database
& "$POSTGRES_PATH\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database '$DB_NAME' criado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Database '$DB_NAME' já existe" -ForegroundColor Yellow
}

# Dar privilégios
& "$POSTGRES_PATH\bin\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
& "$POSTGRES_PATH\bin\psql.exe" -U postgres -h localhost -p 5432 -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# 8. Testar conexão
Write-Host "`n🧪 Testando conexão..." -ForegroundColor Cyan
$env:PGPASSWORD = $DB_PASSWORD
& "$POSTGRES_PATH\bin\psql.exe" -U $DB_USER -h localhost -p 5432 -d $DB_NAME -c "SELECT version();"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PostgreSQL configurado com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 Informações de conexão:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 5432" -ForegroundColor White
    Write-Host "   Database: $DB_NAME" -ForegroundColor White
    Write-Host "   User: $DB_USER" -ForegroundColor White
    Write-Host "   Password: $DB_PASSWORD" -ForegroundColor White
    Write-Host "`n🔗 Connection String:" -ForegroundColor Cyan
    Write-Host "   DATABASE_URL=`"postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}`"" -ForegroundColor Yellow
    Write-Host "`n🎉 Pronto para migração!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro ao conectar ao PostgreSQL" -ForegroundColor Red
    Write-Host "   Verifique os logs em: $PGDATA\log\" -ForegroundColor Yellow
}
