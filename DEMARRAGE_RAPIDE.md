# 🚀 Guide de Démarrage Rapide

## Windows (PowerShell)

### Option 1: Script PowerShell (Recommandé)
```powershell
.\start_server.ps1
```

### Option 2: Script Batch
```powershell
.\start_server.bat
```

### Option 3: Commande Directe
```powershell
php -S localhost:8000 -t .
```

## Linux/Mac

```bash
chmod +x start_server.sh
./start_server.sh
```

## 📋 Étapes Complètes

### 1. Créer la Base de Données

**Windows (PowerShell):**
```powershell
mysql -u root -p < database.sql
```

**Linux/Mac:**
```bash
mysql -u root -p < database.sql
```

### 2. Démarrer le Serveur

**Windows:**
```powershell
.\start_server.ps1
```

**Linux/Mac:**
```bash
./start_server.sh
```

### 3. Tester la Connexion

Ouvrez dans votre navigateur:
- **Test**: http://localhost:8000/test_connection.php
- **Application**: http://localhost:8000/index.html
- **API**: http://localhost:8000/backend.php/vehicles

## ⚠️ Résolution des Erreurs PowerShell

### Erreur: "start_server.bat n'est pas reconnu"
**Solution:** Utilisez `.\start_server.bat` avec le point et la barre oblique

### Erreur: "chmod n'est pas reconnu"
**Solution:** `chmod` est une commande Unix. Sur Windows, utilisez:
- `.\start_server.ps1` (script PowerShell)
- `.\start_server.bat` (script batch)

### Erreur: "Scripts désactivés"
**Solution PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🔧 Configuration

Si vous devez modifier les identifiants de la base de données, éditez `backend.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', 'votre_mot_de_passe');
```

## ✅ Vérification

1. ✅ Base de données créée: `location_voiture`
2. ✅ Serveur démarré sur: `http://localhost:8000`
3. ✅ Test de connexion: Tous les tests verts ✅

