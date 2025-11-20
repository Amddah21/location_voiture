@echo off
REM Script d'installation rapide de la base de données MySQL pour Windows
REM Usage: install_db.bat [username] [password]

echo ============================================
echo Installation de la base de données Rentcars
echo ============================================
echo.

if "%1"=="" (
    set /p DB_USER="Entrez le nom d'utilisateur MySQL (root par défaut): "
    if "!DB_USER!"=="" set DB_USER=root
) else (
    set DB_USER=%1
)

if "%2"=="" (
    set /p DB_PASS="Entrez le mot de passe MySQL: "
) else (
    set DB_PASS=%2
)

echo.
echo Connexion à MySQL avec l'utilisateur: %DB_USER%
echo.

mysql -u %DB_USER% -p%DB_PASS% < database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Installation réussie!
    echo ============================================
    echo.
    echo La base de données 'rentcars_db' a ete creee avec succes.
    echo.
    echo Pour verifier, connectez-vous a MySQL et executez:
    echo   USE rentcars_db;
    echo   SHOW TABLES;
    echo   SELECT COUNT(*) FROM vehicles;
    echo.
) else (
    echo.
    echo ============================================
    echo ERREUR lors de l'installation
    echo ============================================
    echo.
    echo Verifiez vos identifiants MySQL et reessayez.
    echo.
    echo Si le probleme persiste, executez manuellement:
    echo   mysql -u %DB_USER% -p < database.sql
    echo.
)

pause

