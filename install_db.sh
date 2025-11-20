#!/bin/bash
# Script d'installation rapide de la base de données MySQL pour Linux/Mac
# Usage: ./install_db.sh [username] [password]

echo "============================================"
echo "Installation de la base de données Rentcars"
echo "============================================"
echo ""

# Récupérer les identifiants
if [ -z "$1" ]; then
    read -p "Entrez le nom d'utilisateur MySQL (root par défaut): " DB_USER
    DB_USER=${DB_USER:-root}
else
    DB_USER=$1
fi

if [ -z "$2" ]; then
    read -s -p "Entrez le mot de passe MySQL: " DB_PASS
    echo ""
else
    DB_PASS=$2
fi

echo ""
echo "Connexion à MySQL avec l'utilisateur: $DB_USER"
echo ""

# Exécuter le script SQL
if [ -z "$DB_PASS" ]; then
    mysql -u "$DB_USER" < database.sql
else
    mysql -u "$DB_USER" -p"$DB_PASS" < database.sql
fi

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "Installation réussie!"
    echo "============================================"
    echo ""
    echo "La base de données 'rentcars_db' a été créée avec succès."
    echo ""
    echo "Pour vérifier, connectez-vous à MySQL et exécutez:"
    echo "  USE rentcars_db;"
    echo "  SHOW TABLES;"
    echo "  SELECT COUNT(*) FROM vehicles;"
    echo ""
else
    echo ""
    echo "============================================"
    echo "ERREUR lors de l'installation"
    echo "============================================"
    echo ""
    echo "Vérifiez vos identifiants MySQL et réessayez."
    echo ""
    echo "Si le problème persiste, exécutez manuellement:"
    echo "  mysql -u $DB_USER -p < database.sql"
    echo ""
    exit 1
fi

