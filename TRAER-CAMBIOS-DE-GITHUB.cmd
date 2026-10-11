@echo off
rem Doble clic para traer a esta carpeta lo que se guardó en GitHub,
rem por ejemplo los artículos escritos en Pages CMS.
rem Hazlo antes de editar archivos a mano.
cd /d "%~dp0"
echo Trayendo los cambios de GitHub...
git pull --ff-only --autostash
if errorlevel 1 (
  echo.
  echo No se pudieron traer los cambios automaticamente. Pidele ayuda a Claude antes de editar.
) else (
  echo.
  echo Listo: la carpeta esta al dia con GitHub.
)
pause
