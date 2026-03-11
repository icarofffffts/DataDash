@echo off
setlocal enableextensions

REM Deploy do Dashboards CSV para VPS.
REM Uso: deploy_vps.bat

set "VPS_USER=root"
set "VPS_IP=72.62.137.73"

set "REMOTE_PROJECT_DIR=/opt/dashboards-csv"
set "APP_IMAGE=dashboards-csv:latest"
set "APP_STACK=dashcsv"
set "APP_SERVICE=dashcsv_app"

set "TAR_NAME=dashboards_csv_%RANDOM%%RANDOM%.tar"

echo === Dashboards CSV - Deploy VPS ===
echo VPS: %VPS_USER%@%VPS_IP%
echo Projeto remoto: %REMOTE_PROJECT_DIR%
echo.

where tar >nul 2>nul || goto :missing_tar
where scp >nul 2>nul || goto :missing_scp
where ssh >nul 2>nul || goto :missing_ssh

echo [1/3] Empacotando projeto...
tar -cvf "%TAR_NAME%" --exclude="%TAR_NAME%" --exclude=".git" --exclude="node_modules" --exclude=".next" --exclude="dist" --exclude="*.tar" --exclude="*.zip" --exclude="*.log" .
if errorlevel 1 goto :tar_failed

echo.
echo [2/3] Enviando para a VPS (informe a senha quando solicitado)...
scp "%TAR_NAME%" %VPS_USER%@%VPS_IP%:/root/
if errorlevel 1 goto :scp_failed

echo.
echo [3/3] Build e deploy na VPS...
ssh %VPS_USER%@%VPS_IP% "set -e; mkdir -p %REMOTE_PROJECT_DIR%; tar -xvf /root/%TAR_NAME% -C %REMOTE_PROJECT_DIR%; cd %REMOTE_PROJECT_DIR%; docker build --no-cache -t %APP_IMAGE% .; docker stack deploy -c docker-compose.stack.yml %APP_STACK%; docker service update --force %APP_SERVICE%; rm -f /root/%TAR_NAME%"
if errorlevel 1 goto :ssh_failed

goto :cleanup

:cleanup
del "%TAR_NAME%" >nul 2>nul
echo.
echo === Deploy concluido! ===
echo Acesse: https://dashcsv.arxsolutions.cloud
pause
exit /b 0

:missing_tar
echo [ERRO] Comando 'tar' nao encontrado. Instale Git Bash.
goto :fail

:missing_scp
echo [ERRO] Comando 'scp' nao encontrado. Instale OpenSSH Client.
goto :fail

:missing_ssh
echo [ERRO] Comando 'ssh' nao encontrado. Instale OpenSSH Client.
goto :fail

:tar_failed
echo [ERRO] Falha ao criar tar.
goto :fail

:scp_failed
if exist "%TAR_NAME%" del "%TAR_NAME%"
echo [ERRO] Falha ao enviar via scp.
goto :fail

:ssh_failed
if exist "%TAR_NAME%" del "%TAR_NAME%"
echo [ERRO] Falha no deploy remoto.
goto :fail

:fail
echo.
echo === Deploy interrompido ===
pause
exit /b 1
