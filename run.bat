@echo off
title InstaTube Downloader (Instagram & YouTube)
echo ===================================================
echo   Configurando o InstaTube Downloader
echo ===================================================
echo.

:: Verificar se o Python esta instalado
python --version >nul 2>&1
if errorlevel 1 goto nopython

:: Criar ambiente virtual se nao existir ou estiver incompleto
if not exist .venv\Scripts\python.exe goto create_venv
goto activate_venv

:create_venv
echo [+] Configurando ambiente virtual Python (.venv)...
if exist .venv rmdir /s /q .venv 2>nul
python -m venv .venv
if errorlevel 1 goto venv_error
goto activate_venv

:activate_venv
:: Ativar ambiente virtual
echo [+] Ativando ambiente virtual...
call .venv\Scripts\activate.bat

:: Instalar dependencias
echo [+] Instalando/Atualizando dependencias (isso pode levar alguns segundos)...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 goto pip_error

:: Garantir que o yt-dlp esteja sempre na versao mais recente
echo [+] Atualizando yt-dlp...
pip install -U yt-dlp imageio-ffmpeg

echo.
echo ===================================================
echo   Servidor iniciando em http://127.0.0.1:5000
echo   Esta janela deve permanecer aberta enquanto usa o app.
echo ===================================================
echo.

:: Abrir navegador apos 3 segundos
start /b cmd /c "timeout /t 3 >nul && start http://127.0.0.1:5000"

:: Iniciar servidor Flask
python app.py
goto end

:nopython
echo [ERRO] Python nao esta instalado ou nao esta no PATH do sistema.
echo Por favor, instale o Python 3.8+ e tente novamente.
pause
exit /b

:venv_error
echo [ERRO] Falha ao criar o ambiente virtual.
pause
exit /b

:pip_error
echo [ERRO] Falha ao instalar dependencias do requirements.txt.
pause
exit /b

:end
pause
