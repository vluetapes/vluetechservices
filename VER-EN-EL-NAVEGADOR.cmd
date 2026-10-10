@echo off
rem Doble clic en este archivo para ver la web en tu computador.
rem Se abre una ventana negra: NO la cierres mientras estés mirando la web.
rem Para terminar, cierra la ventana negra.
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando lo necesario por primera vez, espera un momento...
  call npm.cmd install
)
start "" http://localhost:8080
call npm.cmd run ver
pause
