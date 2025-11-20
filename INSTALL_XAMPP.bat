@echo off
REM Script pour installer/configurer avec XAMPP
echo ============================================
echo Configuration XAMPP - Location de Voitures
echo ============================================
echo.

REM Vérifier si XAMPP existe
set XAMPP_PATH=C:\xampp\htdocs
if not exist "%XAMPP_PATH%" (
    echo ERREUR: XAMPP n'est pas installe ou n'est pas a C:\xampp
    echo.
    echo Veuillez installer XAMPP depuis: https://www.apachefriends.org/
    echo.
    pause
    exit /b 1
)

echo XAMPP trouve a: %XAMPP_PATH%
echo.

REM Créer le dossier de destination
set DEST_PATH=%XAMPP_PATH%\rental_car
if exist "%DEST_PATH%" (
    echo Le dossier %DEST_PATH% existe deja.
    set /p OVERWRITE="Voulez-vous le remplacer? (O/N): "
    if /i not "%OVERWRITE%"=="O" (
        echo Operation annulee.
        pause
        exit /b 0
    )
    echo Suppression de l'ancien dossier...
    rmdir /s /q "%DEST_PATH%"
)

echo.
echo Copie des fichiers vers %DEST_PATH%...
xcopy /E /I /Y "%CD%\*" "%DEST_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Installation reussie!
    echo ============================================
    echo.
    echo Fichiers copies vers: %DEST_PATH%
    echo.
    echo Prochaines etapes:
    echo 1. Demarrez Apache et MySQL dans XAMPP Control Panel
    echo 2. Ouvrez phpMyAdmin: http://localhost/phpmyadmin
    echo 3. Importez database.sql pour creer la base de donnees
    echo 4. Accedez a l'application: http://localhost/rental_car/index.html
    echo.
    echo Voulez-vous ouvrir phpMyAdmin maintenant? (O/N)
    set /p OPEN_PHPMYADMIN=
    if /i "%OPEN_PHPMYADMIN%"=="O" (
        start http://localhost/phpmyadmin
    )
) else (
    echo.
    echo ERREUR lors de la copie des fichiers.
    echo Verifiez les permissions d'ecriture.
)

echo.
pause

