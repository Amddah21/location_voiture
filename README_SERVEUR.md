# Guide de Démarrage du Serveur - Location de Voitures

## 🚀 Démarrage Rapide

### Option 1: Double-clic (Windows - Le plus simple!)
Double-cliquez sur `DEMARRER.bat` dans l'explorateur Windows

### Option 2: Script PowerShell (Windows)

**PowerShell:**
```powershell
.\start_server.ps1
```

**Si erreur de politique d'exécution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start_server.ps1
```

### Option 3: Script Batch (Windows)

**PowerShell ou CMD:**
```powershell
.\start_server.bat
```

**Important:** Utilisez `.\` devant le nom du fichier dans PowerShell!

### Option 4: Linux/Mac
```bash
chmod +x start_server.sh
./start_server.sh
```

Le serveur démarrera sur `http://localhost:8000`

### Option 2: Ligne de Commande Manuelle

```bash
php -S localhost:8000 -t .
```

### Option 3: Port Personnalisé

**Windows:**
```bash
start_server.bat 8080
```

**Linux/Mac:**
```bash
./start_server.sh 8080
```

## 📋 Prérequis

1. **PHP 7.4+** installé et dans le PATH
2. **MySQL/MariaDB** en cours d'exécution
3. **Base de données** `location_voiture` créée

## 🔧 Configuration

### 1. Vérifier PHP

```bash
php -v
```

Si PHP n'est pas installé:
- **Windows**: Téléchargez depuis [php.net](https://www.php.net/downloads.php)
- **Linux**: `sudo apt-get install php php-mysql` (Ubuntu/Debian)
- **Mac**: `brew install php`

### 2. Créer la Base de Données

```bash
mysql -u root -p < database.sql
```

Ou utilisez phpMyAdmin pour exécuter le script SQL.

### 3. Configurer les Identifiants

Éditez `backend.php` si nécessaire:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', 'votre_mot_de_passe');
```

## ✅ Test de Connexion

1. Démarrez le serveur
2. Ouvrez dans votre navigateur: `http://localhost:8000/test_connection.php`
3. Vérifiez que tous les tests sont verts ✅

## 🌐 Accès à l'Application

Une fois le serveur démarré:

- **Interface Web**: http://localhost:8000/index.php (ou http://localhost:8000/)
- **API Backend**: http://localhost:8000/backend.php
- **Test Connexion**: http://localhost:8000/test_connection.php

## 📡 Endpoints API Disponibles

### Véhicules
- `GET /backend.php/vehicles` - Liste tous les véhicules
- `GET /backend.php/vehicles/{id}` - Détails d'un véhicule
- `GET /backend.php/search?location=...&pickup_date=...&return_date=...` - Recherche

### Réservations
- `GET /backend.php/bookings` - Liste des réservations
- `POST /backend.php/bookings` - Créer une réservations
- `GET /backend.php/bookings/{id}` - Détails d'une réservation

## 🐛 Dépannage

### Erreur: "PHP n'est pas installé"
- Installez PHP et ajoutez-le au PATH système
- Redémarrez le terminal après installation

### Erreur: "Port déjà utilisé"
- Utilisez un autre port: `start_server.bat 8080`
- Ou arrêtez le processus utilisant le port 8000

### Erreur: "Connexion à la base de données échouée"
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `backend.php`
- Exécutez `test_connection.php` pour diagnostiquer

### Erreur: "Base de données n'existe pas"
- Exécutez `database.sql` pour créer la base
- Vérifiez que le nom de la base est `location_voiture`

## 🔒 Sécurité (Production)

Pour un environnement de production:

1. **Ne pas utiliser le serveur PHP intégré** - Utilisez Apache/Nginx
2. **Changer les identifiants** par défaut
3. **Créer un utilisateur MySQL dédié** avec permissions limitées
4. **Activer HTTPS**
5. **Configurer un firewall**

## 📝 Notes

- Le serveur PHP intégré est **uniquement pour le développement**
- Pour la production, utilisez Apache ou Nginx avec PHP-FPM
- Le serveur s'arrête quand vous fermez le terminal (Ctrl+C)

## 🆘 Support

En cas de problème:
1. Vérifiez `test_connection.php`
2. Consultez les logs PHP
3. Vérifiez les logs MySQL

