#!/bin/bash
# ============================================================================
# SCRIPT DE CONFIGURACAO POSTGRESQL PARA DIGIURBAN
# ============================================================================

set -e

echo "🚀 Configurando PostgreSQL para DigiUrban..."

# Variaveis
POSTGRES_PATH="C:/Program Files/PostgreSQL/16/bin"
PGDATA="C:/PostgreSQL/16/data"
DB_NAME="digiurban"
DB_USER="digiurban"
DB_PASSWORD="digiurban_dev_2025"

# 1. Criar diretorio de dados
echo "📁 Criando diretorio de dados..."
mkdir -p "$PGDATA"

# 2. Inicializar cluster (se nao existir)
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "🔧 Inicializando cluster PostgreSQL..."
    "$POSTGRES_PATH/initdb.exe" -D "$PGDATA" -U postgres --auth=md5 --pwprompt -E UTF8 --locale=C <<EOF
$DB_PASSWORD
$DB_PASSWORD
EOF
fi

# 3. Iniciar PostgreSQL manualmente
echo "▶️  Iniciando PostgreSQL..."
"$POSTGRES_PATH/pg_ctl.exe" -D "$PGDATA" -l "$PGDATA/logfile" start

# Aguardar PostgreSQL estar pronto
sleep 5

# 4. Criar usuario e database
echo "👤 Criando usuario e database..."

# Exportar senha
export PGPASSWORD="$DB_PASSWORD"

# Criar usuario digiurban
"$POSTGRES_PATH/psql.exe" -U postgres -h localhost -p 5432 -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   Usuario ja existe"

# Criar database
"$POSTGRES_PATH/psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "   Database ja existe"

# Dar privilegios
"$POSTGRES_PATH/psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
"$POSTGRES_PATH/psql.exe" -U postgres -h localhost -p 5432 -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# 5. Testar conexao
echo ""
echo "🧪 Testando conexao..."
export PGPASSWORD="$DB_PASSWORD"
"$POSTGRES_PATH/psql.exe" -U $DB_USER -h localhost -p 5432 -d $DB_NAME -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL configurado com sucesso!"
    echo ""
    echo "📋 Informacoes de conexao:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo ""
    echo "🔗 Connection String:"
    echo "   DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}\""
    echo ""
    echo "🎉 Pronto para migracao!"
else
    echo ""
    echo "❌ Erro ao conectar ao PostgreSQL"
fi
