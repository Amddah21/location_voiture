# Schéma de Base de Données - Rentcars

## Base de données: `location_voiture`

### Tables Principales

#### 1. Table `clients`
Stocke toutes les informations des clients.

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL - Nom complet du client
- `phone` - VARCHAR(50) NOT NULL UNIQUE - Numéro de téléphone (identifiant unique)
- `email` - VARCHAR(255) - Adresse email
- `password_hash` - VARCHAR(255) NOT NULL - Mot de passe hashé
- `address` - TEXT - Adresse complète
- `city` - VARCHAR(100) - Ville
- `country` - VARCHAR(100) DEFAULT 'France' - Pays
- `date_of_birth` - DATE - Date de naissance
- `license_number` - VARCHAR(100) - Numéro de permis de conduire
- `license_expiry` - DATE - Date d'expiration du permis
- `total_bookings` - INT DEFAULT 0 - Nombre total de réservations
- `total_spent` - DECIMAL(10, 2) DEFAULT 0.00 - Montant total dépensé
- `last_booking_date` - DATETIME - Date de la dernière réservation
- `last_login_date` - DATETIME - Date de la dernière connexion
- `is_active` - BOOLEAN DEFAULT TRUE - Statut actif/inactif
- `notes` - TEXT - Notes administratives
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

**Index:**
- `unique_phone` - UNIQUE sur `phone`
- `idx_name` - INDEX sur `name`
- `idx_phone` - INDEX sur `phone`
- `idx_email` - INDEX sur `email`
- `idx_is_active` - INDEX sur `is_active`
- `idx_created_at` - INDEX sur `created_at`

#### 2. Table `client_logs`
Journalise toutes les actions des clients.

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `client_id` - INT NOT NULL - Référence au client (FOREIGN KEY)
- `client_phone` - VARCHAR(50) NOT NULL - Téléphone du client
- `action` - VARCHAR(100) NOT NULL - Type d'action (login, logout, booking_created, booking_viewed, profile_updated, password_changed)
- `description` - TEXT - Description de l'action
- `ip_address` - VARCHAR(45) - Adresse IP
- `user_agent` - TEXT - User agent du navigateur
- `session_id` - VARCHAR(255) - ID de session
- `metadata` - JSON - Données supplémentaires en format JSON
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Index:**
- `idx_client_id` - INDEX sur `client_id`
- `idx_client_phone` - INDEX sur `client_phone`
- `idx_action` - INDEX sur `action`
- `idx_created_at` - INDEX sur `created_at`

**Foreign Key:**
- `client_id` → `clients(id)` ON DELETE CASCADE

#### 3. Table `admin_logs`
Journalise toutes les actions des administrateurs.

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `admin_id` - INT NOT NULL - ID de l'administrateur
- `admin_email` - VARCHAR(255) NOT NULL - Email de l'administrateur
- `action` - VARCHAR(100) NOT NULL - Type d'action
- `description` - TEXT - Description de l'action
- `ip_address` - VARCHAR(45) - Adresse IP
- `user_agent` - TEXT - User agent du navigateur
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Index:**
- `idx_admin_id` - INDEX sur `admin_id`
- `idx_created_at` - INDEX sur `created_at`
- `idx_action` - INDEX sur `action`

#### 4. Table `bookings`
Stocke toutes les réservations.

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `vehicle_id` - INT - Référence au véhicule
- `customer_name` - VARCHAR(255) NOT NULL
- `customer_email` - VARCHAR(255) NOT NULL
- `customer_phone` - VARCHAR(50)
- `pickup_location` - VARCHAR(255) NOT NULL
- `pickup_date` - DATETIME NOT NULL
- `return_date` - DATETIME NOT NULL
- `total_price` - DECIMAL(10, 2) NOT NULL
- `status` - VARCHAR(50) DEFAULT 'pending'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Foreign Key:**
- `vehicle_id` → `vehicles(id)` ON DELETE SET NULL

#### 5. Table `vehicles`
Stocke les informations des véhicules.

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `type` - VARCHAR(50) NOT NULL
- `price_per_day` - DECIMAL(10, 2) NOT NULL
- `image_url` - VARCHAR(500)
- `passengers` - INT DEFAULT 4
- `transmission` - VARCHAR(20) DEFAULT 'Auto'
- `air_conditioning` - BOOLEAN DEFAULT TRUE
- `doors` - INT DEFAULT 4
- `rating` - DECIMAL(3, 1) DEFAULT 4.5
- `review_count` - INT DEFAULT 0
- `available` - BOOLEAN DEFAULT TRUE
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### 6. Table `contacts`
Stocke les informations de contact (téléphone, email, réseaux sociaux).

**Colonnes:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `contact_type` - VARCHAR(50) NOT NULL
- `label` - VARCHAR(255) NOT NULL
- `value` - VARCHAR(500) NOT NULL
- `icon` - VARCHAR(100)
- `is_active` - BOOLEAN DEFAULT TRUE
- `display_order` - INT DEFAULT 0
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Actions Loggées

### Actions Client (`client_logs`)
- `login` - Connexion du client
- `logout` - Déconnexion du client
- `booking_created` - Création d'une réservation
- `booking_viewed` - Consultation d'une réservation
- `profile_updated` - Mise à jour du profil
- `password_changed` - Changement de mot de passe

### Actions Admin (`admin_logs`)
- `create` - Création d'une ressource
- `update` - Mise à jour d'une ressource
- `delete` - Suppression d'une ressource
- `login` - Connexion admin
- `logout` - Déconnexion admin

## Création Automatique

Toutes les tables sont créées automatiquement lors du premier appel à `backend.php` via la méthode `initDatabase()`.

## Relations

```
clients (1) ──< (N) client_logs
clients (1) ──< (N) bookings (via customer_phone)
vehicles (1) ──< (N) bookings
```

