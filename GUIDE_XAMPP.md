# 🚀 Guide XAMPP - Location de Voitures

## Configuration avec XAMPP

Puisque vous avez XAMPP installé, vous n'avez pas besoin du serveur PHP intégré. Suivez ces étapes :

## 📁 Option 1: Déplacer le projet dans htdocs (Recommandé)

### Étape 1: Localiser le dossier htdocs
Le dossier `htdocs` de XAMPP se trouve généralement à :
- **Windows**: `C:\xampp\htdocs\`
- **Mac**: `/Applications/XAMPP/htdocs/`
- **Linux**: `/opt/lampp/htdocs/`

### Étape 2: Copier le projet
1. Copiez tout le contenu du dossier `rental_car`
2. Collez-le dans `C:\xampp\htdocs\rental_car\`

### Étape 3: Accéder à l'application
Ouvrez votre navigateur et allez à :
- **Application**: http://localhost/rental_car/index.php (ou http://localhost/rental_car/)
- **Test Connexion**: http://localhost/rental_car/test_connection.php
- **API**: http://localhost/rental_car/backend.php/vehicles

## 📁 Option 2: Créer un alias (Symlink)

Si vous préférez garder le projet à son emplacement actuel :

### Windows (PowerShell en tant qu'Administrateur)
```powershell
New-Item -ItemType SymbolicLink -Path "C:\xampp\htdocs\rental_car" -Target "C:\Users\amdda\rental_car"
```

### Linux/Mac
```bash
ln -s /chemin/vers/rental_car /opt/lampp/htdocs/rental_car
```

## ✅ Vérification XAMPP

Assurez-vous que dans le panneau de contrôle XAMPP :
- ✅ **Apache** est démarré (bouton vert)
- ✅ **MySQL** est démarré (bouton vert)

## 🗄️ Configuration de la Base de Données

### Étape 1: Créer la base de données

**Via phpMyAdmin (Recommandé):**
1. Ouvrez http://localhost/phpmyadmin
2. Cliquez sur "Nouvelle base de données"
3. Nom: `location_voiture`
4. Interclassement: `utf8mb4_unicode_ci`
5. Cliquez sur "Créer"

**Via ligne de commande:**
```bash
C:\xampp\mysql\bin\mysql.exe -u root -p < database.sql
```

### Étape 2: Vérifier la connexion
Ouvrez: http://localhost/rental_car/test_connection.php

## 🔧 Configuration Backend

Le fichier `backend.php` est déjà configuré pour :
- **Host**: `localhost`
- **Database**: `location_voiture`
- **User**: `root`
- **Password**: (vide par défaut dans XAMPP)

Si vous avez changé le mot de passe MySQL dans XAMPP, modifiez `backend.php` :
```php
define('DB_PASS', 'votre_mot_de_passe');
```

## 🌐 URLs d'Accès

Une fois configuré, accédez à :

| Service | URL |
|---------|-----|
| **Application Web** | http://localhost/rental_car/index.php |
| **Test Connexion DB** | http://localhost/rental_car/test_connection.php |
| **API Véhicules** | http://localhost/rental_car/backend.php/vehicles |
| **API Recherche** | http://localhost/rental_car/backend.php/search |
| **phpMyAdmin** | http://localhost/phpmyadmin |

## 🐛 Dépannage

### Erreur 404 - Page non trouvée
- Vérifiez que les fichiers sont dans `C:\xampp\htdocs\rental_car\`
- Vérifiez que Apache est démarré dans XAMPP
- Essayez: http://localhost/rental_car/ (avec le slash final)

### Erreur de connexion à la base de données
- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez les identifiants dans `backend.php`
- Testez la connexion via phpMyAdmin

### Port 80 déjà utilisé
Si Apache ne démarre pas :
1. Ouvrez XAMPP Control Panel
2. Cliquez sur "Config" à côté d'Apache
3. Sélectionnez "httpd.conf"
4. Changez `Listen 80` en `Listen 8080`
5. Redémarrez Apache
6. Accédez via: http://localhost:8080/rental_car/

## 📝 Notes Importantes

- **Ne pas utiliser** les scripts `start_server.bat` ou `start_server.ps1` avec XAMPP
- XAMPP gère déjà Apache et MySQL
- Les fichiers doivent être dans `htdocs` pour être accessibles
- Le serveur PHP intégré (`php -S`) n'est pas nécessaire avec XAMPP

## 🎯 Démarrage Rapide

1. ✅ Démarrer Apache et MySQL dans XAMPP
2. ✅ Copier le projet dans `C:\xampp\htdocs\rental_car\`
3. ✅ Créer la base de données `location_voiture` via phpMyAdmin
4. ✅ Ouvrir http://localhost/rental_car/index.php

C'est tout ! 🎉

