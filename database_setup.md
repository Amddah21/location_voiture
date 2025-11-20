# Guide de Configuration de la Base de Données MySQL

**Nom de la base de données:** `location_voiture`

## Prérequis

- MySQL 5.7+ ou MariaDB 10.2+
- Accès administrateur à MySQL
- Client MySQL (mysql, phpMyAdmin, ou autre)

## Installation

### Méthode 1 : Via ligne de commande MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Exécuter le script SQL
source database.sql

# Ou directement
mysql -u root -p < database.sql
```

### Méthode 2 : Via phpMyAdmin

1. Ouvrir phpMyAdmin
2. Cliquer sur "SQL" dans le menu supérieur
3. Copier-coller le contenu de `database.sql`
4. Cliquer sur "Exécuter"

### Méthode 3 : Via le backend PHP (automatique)

Le backend PHP crée automatiquement la base de données et les tables lors du premier appel API. Assurez-vous que les identifiants dans `backend.php` sont corrects :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'votre_utilisateur');
define('DB_PASS', 'votre_mot_de_passe');
```

## Structure de la Base de Données

### Table: `vehicles`
Stocke toutes les informations sur les véhicules disponibles.

**Colonnes principales:**
- `id` - Identifiant unique
- `name` - Nom du modèle (ex: "Jaguar XE L P250")
- `type` - Catégorie (Économique, Compact, Luxe, SUV, Cabriolet)
- `price_per_day` - Prix par jour
- `image_url` - URL de l'image
- `passengers` - Nombre de passagers
- `transmission` - Type de transmission
- `air_conditioning` - Climatisation (oui/non)
- `doors` - Nombre de portes
- `rating` - Note moyenne (0-5)
- `review_count` - Nombre d'avis
- `available` - Disponibilité

### Table: `bookings`
Stocke toutes les réservations des clients.

**Colonnes principales:**
- `id` - Identifiant unique
- `vehicle_id` - Référence au véhicule
- `customer_name` - Nom complet du client
- `customer_email` - Email du client
- `customer_phone` - Téléphone du client
- `pickup_location` - Lieu de prise en charge
- `pickup_date` - Date et heure de prise en charge
- `return_date` - Date et heure de retour
- `total_price` - Prix total
- `status` - Statut (pending, confirmed, active, completed, cancelled)

### Table: `users` (Optionnel)
Pour l'authentification future.

## Vues (Views)

### `v_available_vehicles`
Liste tous les véhicules disponibles avec leurs détails et un label de notation.

### `v_booking_summary`
Résumé des réservations avec les détails des véhicules associés.

## Procédures Stockées

### `sp_check_availability`
Vérifie si un véhicule est disponible pour une période donnée.

**Paramètres:**
- `p_vehicle_id` - ID du véhicule
- `p_pickup_date` - Date de prise en charge
- `p_return_date` - Date de retour

**Utilisation:**
```sql
CALL sp_check_availability(1, '2024-03-15 09:00:00', '2024-03-20 17:00:00');
```

### `sp_booking_stats`
Calcule les statistiques des réservations pour une période.

**Paramètres:**
- `p_start_date` - Date de début
- `p_end_date` - Date de fin

**Utilisation:**
```sql
CALL sp_booking_stats('2024-03-01', '2024-03-31');
```

## Données d'Exemple

Le script inclut 10 véhicules d'exemple :
- 6 véhicules de luxe (Jaguar, Audi, BMW, Lamborghini, Mercedes, Porsche)
- 2 véhicules économiques (Toyota, Honda)
- 1 SUV (Range Rover)
- 1 Cabriolet (BMW 4 Series)

## Vérification

Après l'installation, vérifiez que tout fonctionne :

```sql
-- Vérifier les tables
SHOW TABLES;

-- Compter les véhicules
SELECT COUNT(*) FROM vehicles;

-- Voir les véhicules disponibles
SELECT * FROM v_available_vehicles;

-- Vérifier les réservations
SELECT COUNT(*) FROM bookings;
```

## Maintenance

### Sauvegarde
```bash
mysqldump -u root -p location_voiture > backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
mysql -u root -p location_voiture < backup_20240315.sql
```

### Optimisation
```sql
OPTIMIZE TABLE vehicles;
OPTIMIZE TABLE bookings;
```

## Sécurité

1. **Changez les identifiants par défaut** dans `backend.php`
2. **Créez un utilisateur dédié** pour l'application :
```sql
CREATE USER 'rentcars_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT SELECT, INSERT, UPDATE, DELETE ON location_voiture.* TO 'rentcars_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Limitez les privilèges** - Ne donnez que les permissions nécessaires

## Dépannage

### Erreur: "Access denied"
- Vérifiez les identifiants MySQL dans `backend.php`
- Assurez-vous que l'utilisateur a les permissions nécessaires

### Erreur: "Table already exists"
- C'est normal si vous réexécutez le script
- Les tables sont créées avec `IF NOT EXISTS`

### Erreur: "Foreign key constraint fails"
- Vérifiez que la table `vehicles` existe avant `bookings`
- Assurez-vous que les `vehicle_id` référencent des véhicules existants

## Support

Pour toute question ou problème, consultez :
- Documentation MySQL : https://dev.mysql.com/doc/
- Documentation PHP PDO : https://www.php.net/manual/fr/book.pdo.php

