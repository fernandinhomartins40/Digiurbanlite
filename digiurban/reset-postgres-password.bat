@echo off
REM ============================================================================
REM RESETAR SENHA DO POSTGRES
REM ============================================================================
echo Resetando senha do usuario postgres...
echo.

REM Parar servico PostgreSQL se estiver rodando
echo Parando servico PostgreSQL...
net stop postgresql-x64-16 2>nul
sc stop postgresql-x64-16 2>nul

REM Aguardar
timeout /t 3 /nobreak >nul

REM Editar pg_hba.conf para trust temporariamente
echo Configurando autenticacao temporaria...
set PGDATA=C:\Program Files\PostgreSQL\16\data

REM Backup do pg_hba.conf
copy "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba.conf.backup" >nul 2>&1

REM Criar novo pg_hba.conf com trust
(
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo host    all             all             127.0.0.1/32            trust
echo host    all             all             ::1/128                 trust
echo local   all             all                                     trust
) > "%PGDATA%\pg_hba.conf"

REM Iniciar servico
echo Iniciando servico PostgreSQL...
net start postgresql-x64-16

REM Aguardar PostgreSQL iniciar
timeout /t 5 /nobreak >nul

REM Resetar senha
echo Resetando senha para: digiurban_dev_2025
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD 'digiurban_dev_2025';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Senha resetada com sucesso!
    echo   Nova senha: digiurban_dev_2025
) else (
    echo.
    echo ✗ Erro ao resetar senha
    goto :restore
)

:restore
REM Restaurar pg_hba.conf original
echo Restaurando configuracao...
copy "%PGDATA%\pg_hba.conf.backup" "%PGDATA%\pg_hba.conf" >nul 2>&1

REM Reiniciar servico
net stop postgresql-x64-16 2>nul
timeout /t 2 /nobreak >nul
net start postgresql-x64-16

echo.
echo Pronto! Tente conectar novamente no pgAdmin com:
echo   Senha: digiurban_dev_2025
echo.
pause
