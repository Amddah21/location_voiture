<?php
/**
 * Rentcars Backend API
 * Handles car rentals, bookings, and vehicle management
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Performance optimizations
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Cache control for GET requests (5 minutes)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['nocache'])) {
    header('Cache-Control: public, max-age=300');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');
} else {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session early for admin authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

class Database
{
    private static $instance = null;
    private $conn;

    private function __construct()
    {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->conn;
    }
}

class RentcarsAPI
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->initDatabase();
    }

    private function initDatabase()
    {
        try {
            // Create database if it doesn't exist
            $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET, DB_USER, DB_PASS);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
            $pdo = null;

            // Create tables
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    price_per_day DECIMAL(10, 2) NOT NULL,
                    image_url VARCHAR(500),
                    passengers INT DEFAULT 4,
                    transmission VARCHAR(20) DEFAULT 'Auto',
                    air_conditioning BOOLEAN DEFAULT TRUE,
                    doors INT DEFAULT 4,
                    rating DECIMAL(3, 1) DEFAULT 4.5,
                    review_count INT DEFAULT 0,
                    available BOOLEAN DEFAULT TRUE,
                    available_from DATE NULL COMMENT 'Date de début de disponibilité',
                    available_to DATE NULL COMMENT 'Date de fin de disponibilité',
                    description TEXT COMMENT 'Detailed description of the vehicle',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Add new columns if they don't exist (migration)
            $this->migrateVehiclesTable();

            $this->db->exec("
                CREATE TABLE IF NOT EXISTS bookings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_id INT,
                    client_id INT NULL COMMENT 'Client ID if logged in',
                    customer_name VARCHAR(255) NOT NULL,
                    customer_email VARCHAR(255) NOT NULL,
                    customer_phone VARCHAR(50),
                    pickup_location VARCHAR(255) NOT NULL,
                    pickup_date DATETIME NOT NULL,
                    return_date DATETIME NOT NULL,
                    total_price DECIMAL(10, 2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_client_id (client_id),
                    INDEX idx_customer_phone (customer_phone),
                    INDEX idx_customer_email (customer_email),
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $this->db->exec("
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    contact_type VARCHAR(50) NOT NULL COMMENT 'Type: phone, email, facebook, instagram, whatsapp, twitter, linkedin, youtube, address',
                    label VARCHAR(255) NOT NULL COMMENT 'Label: Téléphone, Email, Facebook, etc.',
                    value VARCHAR(500) NOT NULL COMMENT 'Contact value: number, email, URL, etc.',
                    icon VARCHAR(100) COMMENT 'Icon class (FontAwesome)',
                    is_active BOOLEAN DEFAULT TRUE,
                    display_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_type (contact_type),
                    INDEX idx_active (is_active),
                    INDEX idx_order (display_order)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create clients table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(50) NOT NULL,
                    email VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    total_bookings INT DEFAULT 0,
                    last_booking_date DATETIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_phone (phone),
                    INDEX idx_name (name),
                    INDEX idx_phone (phone),
                    INDEX idx_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Add new columns if they don't exist (migration)
            $this->migrateVehiclesTable();
            $this->migrateClientsTable();

            $this->db->exec("
                CREATE TABLE IF NOT EXISTS client_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    client_phone VARCHAR(50) NOT NULL,
                    action VARCHAR(100) NOT NULL COMMENT 'Type: login, logout, booking_created, booking_viewed, profile_updated, password_changed',
                    description TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    session_id VARCHAR(255),
                    metadata JSON COMMENT 'Additional data in JSON format',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_client_id (client_id),
                    INDEX idx_client_phone (client_phone),
                    INDEX idx_action (action),
                    INDEX idx_created_at (created_at),
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $this->db->exec("
                CREATE TABLE IF NOT EXISTS admin_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT NOT NULL,
                    admin_email VARCHAR(255) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    description TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_admin_id (admin_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_action (action)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create users table for admin management
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'admin',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_role (role)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create offers table for promotions and special offers
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS offers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    offer_type VARCHAR(50) NOT NULL COMMENT 'Type: percentage, fixed_amount, free_days',
                    discount_value DECIMAL(10, 2) NOT NULL COMMENT 'Percentage or fixed amount',
                    vehicle_id INT NULL COMMENT 'NULL for all vehicles, or specific vehicle ID',
                    image_url VARCHAR(500) COMMENT 'Image URL for the offer/car',
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    sales_count INT DEFAULT 0 COMMENT 'Number of times this offer was used',
                    max_uses INT NULL COMMENT 'Maximum number of times offer can be used, NULL for unlimited',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_vehicle_id (vehicle_id),
                    INDEX idx_start_date (start_date),
                    INDEX idx_end_date (end_date),
                    INDEX idx_is_active (is_active),
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            
            // Add image_url column if it doesn't exist (migration)
            try {
                $this->db->exec("ALTER TABLE offers ADD COLUMN image_url VARCHAR(500) COMMENT 'Image URL for the offer/car' AFTER vehicle_id");
            } catch (PDOException $e) {
                // Column might already exist, ignore error
                error_log("Offers image_url column migration: " . $e->getMessage());
            }

            // Create reviews table for client reviews and ratings
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS reviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NULL COMMENT 'Client ID if logged in',
                    client_name VARCHAR(255) NOT NULL,
                    client_email VARCHAR(255),
                    client_location VARCHAR(255) COMMENT 'City, Country',
                    vehicle_id INT NULL COMMENT 'Vehicle ID if review is for specific vehicle',
                    booking_id INT NULL COMMENT 'Booking ID if review is for a specific booking',
                    rating INT NOT NULL COMMENT 'Rating from 1 to 5 stars',
                    comment TEXT NOT NULL COMMENT 'Review comment',
                    service_rating INT NULL COMMENT 'Service rating from 1 to 5',
                    car_rating INT NULL COMMENT 'Car condition rating from 1 to 5',
                    is_approved BOOLEAN DEFAULT FALSE COMMENT 'Admin approval before showing publicly',
                    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Featured reviews shown prominently',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_client_id (client_id),
                    INDEX idx_vehicle_id (vehicle_id),
                    INDEX idx_booking_id (booking_id),
                    INDEX idx_rating (rating),
                    INDEX idx_is_approved (is_approved),
                    INDEX idx_is_featured (is_featured),
                    INDEX idx_created_at (created_at),
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Add new columns if they don't exist (migration)
            $this->migrateUsersTable();

            // Create vehicle_images table for multiple images per vehicle
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS vehicle_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_id INT NOT NULL,
                    image_url VARCHAR(500) NOT NULL,
                    display_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_vehicle_id (vehicle_id),
                    INDEX idx_display_order (display_order),
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create car_brands table for managing car brand logos
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS car_brands (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    logo_url VARCHAR(500) NOT NULL,
                    display_order INT DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_display_order (display_order),
                    INDEX idx_is_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Insert sample vehicles if table is empty
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM vehicles");
            $result = $stmt->fetch();
            if ($result['count'] == 0) {
                $this->insertSampleVehicles();
            }

            // Insert sample car brands if table is empty
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM car_brands");
            $result = $stmt->fetch();
            if ($result['count'] == 0) {
                $this->insertSampleCarBrands();
            }
        } catch (PDOException $e) {
            error_log("Database initialization error: " . $e->getMessage());
        }
    }

    private function migrateVehiclesTable()
    {
        try {
            // Check if description column exists
            $stmt = $this->db->query("SHOW COLUMNS FROM vehicles LIKE 'description'");
            if ($stmt->rowCount() == 0) {
                $this->db->exec("ALTER TABLE vehicles ADD COLUMN description TEXT COMMENT 'Detailed description of the vehicle'");
            }

            // Check if available_from column exists
            $stmt = $this->db->query("SHOW COLUMNS FROM vehicles LIKE 'available_from'");
            if ($stmt->rowCount() == 0) {
                $this->db->exec("ALTER TABLE vehicles ADD COLUMN available_from DATE NULL COMMENT 'Date de début de disponibilité'");
            }

            // Check if available_to column exists
            $stmt = $this->db->query("SHOW COLUMNS FROM vehicles LIKE 'available_to'");
            if ($stmt->rowCount() == 0) {
                $this->db->exec("ALTER TABLE vehicles ADD COLUMN available_to DATE NULL COMMENT 'Date de fin de disponibilité'");
            }
        } catch (PDOException $e) {
            // Table might not exist yet, ignore error
            error_log("Migration error (may be expected): " . $e->getMessage());
        }
    }

    private function migrateClientsTable()
    {
        try {
            // Check if columns exist and add them if they don't
            $columns_to_add = [
                'address' => "ALTER TABLE clients ADD COLUMN address TEXT AFTER email",
                'city' => "ALTER TABLE clients ADD COLUMN city VARCHAR(100) AFTER address",
                'country' => "ALTER TABLE clients ADD COLUMN country VARCHAR(100) DEFAULT 'France' AFTER city",
                'date_of_birth' => "ALTER TABLE clients ADD COLUMN date_of_birth DATE AFTER country",
                'license_number' => "ALTER TABLE clients ADD COLUMN license_number VARCHAR(100) AFTER date_of_birth",
                'license_expiry' => "ALTER TABLE clients ADD COLUMN license_expiry DATE AFTER license_number",
                'total_spent' => "ALTER TABLE clients ADD COLUMN total_spent DECIMAL(10, 2) DEFAULT 0.00 AFTER total_bookings",
                'last_login_date' => "ALTER TABLE clients ADD COLUMN last_login_date DATETIME AFTER last_booking_date",
                'is_active' => "ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER last_login_date",
                'notes' => "ALTER TABLE clients ADD COLUMN notes TEXT AFTER is_active"
            ];

            // Get existing columns
            $stmt = $this->db->query("SHOW COLUMNS FROM clients");
            $existing_columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Add missing columns
            foreach ($columns_to_add as $column => $sql) {
                if (!in_array($column, $existing_columns)) {
                    try {
                        $this->db->exec($sql);
                        error_log("Added column '{$column}' to clients table");
                    } catch (PDOException $e) {
                        error_log("Could not add column '{$column}': " . $e->getMessage());
                    }
                }
            }

            // Add indexes if they don't exist
            $indexes_to_add = [
                'idx_is_active' => "CREATE INDEX idx_is_active ON clients(is_active)",
                'idx_created_at' => "CREATE INDEX idx_created_at ON clients(created_at)"
            ];

            $stmt = $this->db->query("SHOW INDEXES FROM clients");
            $existing_indexes = $stmt->fetchAll(PDO::FETCH_COLUMN, 2); // Column 2 is Key_name

            foreach ($indexes_to_add as $index_name => $sql) {
                if (!in_array($index_name, $existing_indexes)) {
                    try {
                        $this->db->exec($sql);
                        error_log("Added index '{$index_name}' to clients table");
                    } catch (PDOException $e) {
                        error_log("Could not add index '{$index_name}': " . $e->getMessage());
                    }
                }
            }
        } catch (PDOException $e) {
            error_log("Migration error: " . $e->getMessage());
        }
    }

    private function migrateUsersTable()
    {
        try {
            // Check if is_active column exists
            $stmt = $this->db->query("SHOW COLUMNS FROM users LIKE 'is_active'");
            if ($stmt->rowCount() == 0) {
                $this->db->exec("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER role");
                error_log("Added column 'is_active' to users table");
            }
        } catch (PDOException $e) {
            // Table might not exist yet, ignore error
            error_log("Users table migration error (may be expected): " . $e->getMessage());
        }
    }

    private function migrateBookingsTable()
    {
        try {
            // Check if client_id column exists
            $stmt = $this->db->query("SHOW COLUMNS FROM bookings LIKE 'client_id'");
            if ($stmt->rowCount() == 0) {
                $this->db->exec("ALTER TABLE bookings ADD COLUMN client_id INT NULL COMMENT 'Client ID if logged in' AFTER vehicle_id");
                error_log("Added column 'client_id' to bookings table");
                
                // Add foreign key if it doesn't exist
                try {
                    $this->db->exec("ALTER TABLE bookings ADD CONSTRAINT fk_bookings_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL");
                } catch (PDOException $e) {
                    // Foreign key might already exist or table doesn't exist yet
                    error_log("Could not add foreign key for bookings.client_id: " . $e->getMessage());
                }
                
                // Add index if it doesn't exist
                try {
                    $this->db->exec("CREATE INDEX idx_client_id ON bookings(client_id)");
                } catch (PDOException $e) {
                    // Index might already exist
                    error_log("Could not add index for bookings.client_id: " . $e->getMessage());
                }
            }
        } catch (PDOException $e) {
            // Table might not exist yet, ignore error
            error_log("Bookings table migration error (may be expected): " . $e->getMessage());
        }
    }

    private function insertSampleVehicles()
    {
        $vehicles = [
            [
                'name' => 'Jaguar XE L P250',
                'type' => 'Luxury',
                'price_per_day' => 19440.00, // 1800 EUR * 10.8 = 19440 MAD
                'image_url' => 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80',
                'passengers' => 4,
                'transmission' => 'Auto',
                'air_conditioning' => true,
                'doors' => 4,
                'rating' => 4.8,
                'review_count' => 2436
            ],
            [
                'name' => 'Audi R8',
                'type' => 'Luxury',
                'price_per_day' => 22680.00, // 2100 EUR * 10.8 = 22680 MAD
                'image_url' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
                'passengers' => 2,
                'transmission' => 'Auto',
                'air_conditioning' => true,
                'doors' => 2,
                'rating' => 4.6,
                'review_count' => 1936
            ],
            [
                'name' => 'BMW M3 Competition',
                'type' => 'Luxury',
                'price_per_day' => 17280.00, // 1600 EUR * 10.8 = 17280 MAD
                'image_url' => 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
                'passengers' => 4,
                'transmission' => 'Auto',
                'air_conditioning' => true,
                'doors' => 4,
                'rating' => 4.5,
                'review_count' => 2036
            ],
            [
                'name' => 'Lamborghini Huracán',
                'type' => 'Luxury',
                'price_per_day' => 24840.00, // 2300 EUR * 10.8 = 24840 MAD
                'image_url' => 'https://images.unsplash.com/photo-1590868309235-32f32f5a1ef6?auto=format&fit=crop&w=800&q=80',
                'passengers' => 2,
                'transmission' => 'Auto',
                'air_conditioning' => true,
                'doors' => 2,
                'rating' => 4.3,
                'review_count' => 2236
            ]
        ];

        $stmt = $this->db->prepare("
            INSERT INTO vehicles (name, type, price_per_day, image_url, passengers, transmission, air_conditioning, doors, rating, review_count)
            VALUES (:name, :type, :price_per_day, :image_url, :passengers, :transmission, :air_conditioning, :doors, :rating, :review_count)
        ");

        foreach ($vehicles as $vehicle) {
            $stmt->execute($vehicle);
        }
    }

    public function handleRequest()
    {
        $method = $_SERVER['REQUEST_METHOD'];

        // Check for query parameter first (for XAMPP compatibility)
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;

        if ($action) {
            // Handle via query parameters
            $path = $action;
            if ($id) {
                $path .= '/' . $id;
            }
        } else {
            // Handle via URL path
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $path = str_replace('/backend.php', '', $path);
            $path = trim($path, '/');
        }

        switch ($method) {
            case 'GET':
                $this->handleGet($path);
                break;
            case 'POST':
                $this->handlePost($path);
                break;
            case 'PUT':
                $this->handlePut($path);
                break;
            case 'DELETE':
                $this->handleDelete($path);
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }
    }

    private function handleGet($path)
    {
        if ($path === '' || $path === 'vehicles') {
            $this->getVehicles();
        } elseif (preg_match('/^vehicles\/(\d+)$/', $path, $matches)) {
            $this->getVehicle($matches[1]);
        } elseif ($path === 'vehicles/' . ($_GET['id'] ?? '')) {
            $this->getVehicle($_GET['id']);
        } elseif ($path === 'bookings') {
            // Check if ID is provided via query parameter
            $id = $_GET['id'] ?? null;
            if ($id) {
                $this->getBooking($id);
            } else {
                $this->getBookings();
            }
        } elseif (preg_match('/^bookings\/(\d+)$/', $path, $matches)) {
            $this->getBooking($matches[1]);
        } elseif ($path === 'search') {
            $this->searchVehicles();
        } elseif ($path === 'contacts') {
            $this->getContacts();
        } elseif (preg_match('/^contacts\/(\d+)$/', $path, $matches)) {
            $this->getContact($matches[1]);
        } elseif ($path === 'clients') {
            $this->getClients();
        } elseif (preg_match('/^clients\/(\d+)$/', $path, $matches)) {
            $this->getClient($matches[1]);
        } elseif ($path === 'admins') {
            $this->getAdmins();
        } elseif (preg_match('/^admins\/(\d+)$/', $path, $matches)) {
            $this->getAdmin($matches[1]);
        } elseif ($path === 'car_brands' || $path === 'brands') {
            $this->getCarBrands();
        } elseif (preg_match('/^car_brands\/(\d+)$/', $path, $matches) || preg_match('/^brands\/(\d+)$/', $path, $matches)) {
            $id = $matches[1] ?? $_GET['id'] ?? null;
            if ($id) {
                $this->getCarBrand($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Brand ID required']);
            }
        } elseif ($path === 'offers') {
            $this->getOffers();
        } elseif (preg_match('/^offers\/(\d+)$/', $path, $matches)) {
            $this->getOffer($matches[1]);
        } elseif ($path === 'reviews') {
            $this->getReviews();
        } elseif (preg_match('/^reviews\/(\d+)$/', $path, $matches)) {
            $this->getReview($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        }
    }

    private function handlePost($path)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if ($path === 'bookings' || $path === 'book') {
            $this->createBooking($data);
        } elseif ($path === 'vehicles') {
            $this->createVehicle($data);
        } elseif ($path === 'contacts') {
            $this->createContact($data);
        } elseif ($path === 'clients') {
            // This endpoint is for creating clients directly (not through booking)
            $client_id = $this->createOrUpdateClient($data, 0);
            if ($client_id) {
                echo json_encode(['success' => true, 'message' => 'Client created/updated', 'client_id' => $client_id]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Failed to create/update client']);
            }
        } elseif ($path === 'admins/change-password') {
            $this->changeAdminPassword($data);
        } elseif ($path === 'admins') {
            $this->createAdmin($data);
        } elseif ($path === 'car_brands' || $path === 'brands') {
            $this->createCarBrand($data);
        } elseif ($path === 'offers') {
            $this->createOffer($data);
        } elseif ($path === 'reviews') {
            $this->createReview($data);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        }
    }

    private function handlePut($path)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (preg_match('/^bookings\/(\d+)$/', $path, $matches)) {
            $this->updateBooking($matches[1], $data);
        } elseif (preg_match('/^vehicles\/(\d+)$/', $path, $matches)) {
            $this->updateVehicle($matches[1], $data);
        } elseif (preg_match('/^contacts\/(\d+)$/', $path, $matches)) {
            $this->updateContact($matches[1], $data);
        } elseif (preg_match('/^clients\/(\d+)$/', $path, $matches)) {
            $this->updateClient($matches[1], $data);
        } elseif (preg_match('/^admins\/(\d+)$/', $path, $matches)) {
            $this->updateAdmin($matches[1], $data);
        } elseif (preg_match('/^car_brands\/(\d+)$/', $path, $matches) || preg_match('/^brands\/(\d+)$/', $path, $matches)) {
            $id = $matches[1] ?? $_GET['id'] ?? null;
            if ($id) {
                $this->updateCarBrand($id, $data);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Brand ID required']);
            }
        } elseif (preg_match('/^offers\/(\d+)$/', $path, $matches)) {
            $this->updateOffer($matches[1], $data);
        } elseif (preg_match('/^reviews\/(\d+)$/', $path, $matches)) {
            $this->updateReview($matches[1], $data);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
    }

    private function handleDelete($path)
    {
        if (preg_match('/^bookings\/(\d+)$/', $path, $matches)) {
            $this->deleteBooking($matches[1]);
        } elseif (preg_match('/^vehicles\/(\d+)$/', $path, $matches)) {
            $this->deleteVehicle($matches[1]);
        } elseif (preg_match('/^contacts\/(\d+)$/', $path, $matches)) {
            $this->deleteContact($matches[1]);
        } elseif (preg_match('/^clients\/(\d+)$/', $path, $matches)) {
            $this->deleteClient($matches[1]);
        } elseif (preg_match('/^admins\/(\d+)$/', $path, $matches)) {
            $this->deleteAdmin($matches[1]);
        } elseif (preg_match('/^car_brands\/(\d+)$/', $path, $matches) || preg_match('/^brands\/(\d+)$/', $path, $matches)) {
            $id = $matches[1] ?? $_GET['id'] ?? null;
            if ($id) {
                $this->deleteCarBrand($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Brand ID required']);
            }
        } elseif (preg_match('/^offers\/(\d+)$/', $path, $matches)) {
            $this->deleteOffer($matches[1]);
        } elseif (preg_match('/^reviews\/(\d+)$/', $path, $matches)) {
            $this->deleteReview($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
    }

    // Vehicle methods
    private function getVehicles()
    {
        try {
            $type = $_GET['type'] ?? null;
            $available = $_GET['available'] ?? null;
            $id = $_GET['id'] ?? null;

            // If ID is provided, get single vehicle
            if ($id) {
                $this->getVehicle($id);
                return;
            }

            $sql = "SELECT * FROM vehicles WHERE 1=1";
            $params = [];

            if ($type && $type !== 'Any type' && $type !== 'Tous types') {
                $sql .= " AND type = :type";
                $params[':type'] = $type;
            }

            // Handle available filter - if 'true' is passed, only show available vehicles
            // If not specified, show all vehicles
            if ($available !== null && $available !== '') {
                if ($available === 'true' || $available === true || $available === '1') {
                    $sql .= " AND available = 1";
                } elseif ($available === 'false' || $available === false || $available === '0') {
                    $sql .= " AND available = 0";
                }
            }

            $sql .= " ORDER BY created_at DESC";

            // Add limit for performance (default 50, can be overridden)
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;
            $limit = min(max($limit, 1), 100); // Between 1 and 100
            $sql .= " LIMIT " . (int) $limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $vehicles = $stmt->fetchAll();

            // Format response
            foreach ($vehicles as &$vehicle) {
                $vehicle['air_conditioning'] = (bool) $vehicle['air_conditioning'];
                $vehicle['available'] = (bool) $vehicle['available'];
                $vehicle['price_per_day'] = (float) $vehicle['price_per_day'];
                $vehicle['rating'] = (float) $vehicle['rating'];
            }

            echo json_encode(['success' => true, 'data' => $vehicles]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch vehicles: ' . $e->getMessage()]);
        }
    }

    private function getVehicle($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM vehicles WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $vehicle = $stmt->fetch();

            if (!$vehicle) {
                http_response_code(404);
                echo json_encode(['error' => 'Vehicle not found']);
                return;
            }

            $vehicle['air_conditioning'] = (bool) $vehicle['air_conditioning'];
            $vehicle['available'] = (bool) $vehicle['available'];
            $vehicle['price_per_day'] = (float) $vehicle['price_per_day'];
            $vehicle['rating'] = (float) $vehicle['rating'];

            // Fetch all images for this vehicle
            $imagesStmt = $this->db->prepare("SELECT id, image_url, display_order FROM vehicle_images WHERE vehicle_id = :id ORDER BY display_order ASC, id ASC");
            $imagesStmt->execute([':id' => $id]);
            $images = $imagesStmt->fetchAll();
            $vehicle['images'] = array_column($images, 'image_url');
            // If no images, use the main image_url as fallback
            if (empty($vehicle['images']) && !empty($vehicle['image_url'])) {
                $vehicle['images'] = [$vehicle['image_url']];
            }

            echo json_encode(['success' => true, 'data' => $vehicle]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch vehicle: ' . $e->getMessage()]);
        }
    }

    private function searchVehicles()
    {
        try {
            $location = $_GET['location'] ?? '';
            $pickup_date = $_GET['pickup_date'] ?? '';
            $return_date = $_GET['return_date'] ?? '';
            $vehicle_type = $_GET['vehicle_type'] ?? 'Any type';

            $sql = "SELECT v.* FROM vehicles v WHERE v.available = 1";
            $params = [];

            if ($vehicle_type && $vehicle_type !== 'Any type') {
                $sql .= " AND v.type = :type";
                $params[':type'] = $vehicle_type;
            }

            // Check availability (exclude vehicles with overlapping bookings)
            if ($pickup_date && $return_date) {
                $sql .= " AND v.id NOT IN (
                    SELECT DISTINCT vehicle_id FROM bookings 
                    WHERE status IN ('pending', 'confirmed', 'active')
                    AND (
                        (pickup_date <= :return_date AND return_date >= :pickup_date)
                    )
                )";
                $params[':pickup_date'] = $pickup_date;
                $params[':return_date'] = $return_date;
            }

            $sql .= " ORDER BY v.price_per_day ASC";

            // Add limit for performance
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;
            $limit = min(max($limit, 1), 100);
            $sql .= " LIMIT " . (int) $limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $vehicles = $stmt->fetchAll();

            foreach ($vehicles as &$vehicle) {
                $vehicle['air_conditioning'] = (bool) $vehicle['air_conditioning'];
                $vehicle['available'] = (bool) $vehicle['available'];
                $vehicle['price_per_day'] = (float) $vehicle['price_per_day'];
                $vehicle['rating'] = (float) $vehicle['rating'];
            }

            echo json_encode([
                'success' => true,
                'data' => $vehicles,
                'search_params' => [
                    'location' => $location,
                    'pickup_date' => $pickup_date,
                    'return_date' => $return_date,
                    'vehicle_type' => $vehicle_type
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Search failed: ' . $e->getMessage()]);
        }
    }

    private function createVehicle($data)
    {
        try {
            $required = ['name', 'type', 'price_per_day'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }

            $stmt = $this->db->prepare("
                INSERT INTO vehicles (name, type, price_per_day, image_url, passengers, transmission, air_conditioning, doors, rating, review_count, available, description, available_from, available_to)
                VALUES (:name, :type, :price_per_day, :image_url, :passengers, :transmission, :air_conditioning, :doors, :rating, :review_count, :available, :description, :available_from, :available_to)
            ");

            $stmt->execute([
                ':name' => $data['name'],
                ':type' => $data['type'],
                ':price_per_day' => $data['price_per_day'],
                ':image_url' => $data['image_url'] ?? null,
                ':passengers' => $data['passengers'] ?? 4,
                ':transmission' => $data['transmission'] ?? 'Auto',
                ':air_conditioning' => isset($data['air_conditioning']) ? (int) $data['air_conditioning'] : 1,
                ':doors' => $data['doors'] ?? 4,
                ':rating' => $data['rating'] ?? 4.5,
                ':review_count' => $data['review_count'] ?? 0,
                ':available' => isset($data['available']) ? (int) $data['available'] : 1,
                ':description' => $data['description'] ?? null,
                ':available_from' => !empty($data['available_from']) ? $data['available_from'] : null,
                ':available_to' => !empty($data['available_to']) ? $data['available_to'] : null
            ]);

            $id = $this->db->lastInsertId();

            // Save multiple images if provided
            if (!empty($data['images']) && is_array($data['images'])) {
                $imageStmt = $this->db->prepare("INSERT INTO vehicle_images (vehicle_id, image_url, display_order) VALUES (:vehicle_id, :image_url, :display_order)");
                foreach ($data['images'] as $index => $imageUrl) {
                    if (!empty($imageUrl)) {
                        $imageStmt->execute([
                            ':vehicle_id' => $id,
                            ':image_url' => $imageUrl,
                            ':display_order' => $index
                        ]);
                    }
                }
            } elseif (!empty($data['image_url'])) {
                // If only one image is provided, save it to vehicle_images table as well
                $imageStmt = $this->db->prepare("INSERT INTO vehicle_images (vehicle_id, image_url, display_order) VALUES (:vehicle_id, :image_url, 0)");
                $imageStmt->execute([
                    ':vehicle_id' => $id,
                    ':image_url' => $data['image_url']
                ]);
            }

            // Log admin action
            $this->logAdminAction('create', "Vehicle created: {$data['name']} (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Vehicle created', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create vehicle: ' . $e->getMessage()]);
        }
    }

    private function updateVehicle($id, $data)
    {
        try {
            $fields = [];
            $params = [':id' => $id];

            $allowed = ['name', 'type', 'price_per_day', 'image_url', 'passengers', 'transmission', 'air_conditioning', 'doors', 'rating', 'review_count', 'available', 'description', 'available_from', 'available_to'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    if ($field === 'air_conditioning' || $field === 'available') {
                        $params[":$field"] = (int) $data[$field];
                    } elseif ($field === 'available_from' || $field === 'available_to') {
                        $params[":$field"] = !empty($data[$field]) ? $data[$field] : null;
                    } else {
                        $params[":$field"] = $data[$field];
                    }
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE vehicles SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Update images if provided
            if (isset($data['images']) && is_array($data['images'])) {
                // Delete existing images
                $deleteStmt = $this->db->prepare("DELETE FROM vehicle_images WHERE vehicle_id = :id");
                $deleteStmt->execute([':id' => $id]);

                // Insert new images
                if (!empty($data['images'])) {
                    $imageStmt = $this->db->prepare("INSERT INTO vehicle_images (vehicle_id, image_url, display_order) VALUES (:vehicle_id, :image_url, :display_order)");
                    foreach ($data['images'] as $index => $imageUrl) {
                        if (!empty($imageUrl)) {
                            $imageStmt->execute([
                                ':vehicle_id' => $id,
                                ':image_url' => $imageUrl,
                                ':display_order' => $index
                            ]);
                        }
                    }
                }
            }

            // Log admin action
            $this->logAdminAction('update', "Vehicle #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Vehicle updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update vehicle: ' . $e->getMessage()]);
        }
    }

    private function deleteVehicle($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM vehicles WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Vehicle not found']);
                return;
            }

            // Log admin action if session exists
            $this->logAdminAction('delete', "Vehicle #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Vehicle deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete vehicle: ' . $e->getMessage()]);
        }
    }

    private function logAdminAction($action, $description = '')
    {
        // Check if admin session exists
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION['admin_id']) && isset($_SESSION['admin_email'])) {
            try {
                $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
                $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

                $stmt = $this->db->prepare("
                    INSERT INTO admin_logs (admin_id, admin_email, action, description, ip_address, user_agent)
                    VALUES (:admin_id, :admin_email, :action, :description, :ip_address, :user_agent)
                ");
                $stmt->execute([
                    ':admin_id' => $_SESSION['admin_id'],
                    ':admin_email' => $_SESSION['admin_email'],
                    ':action' => $action,
                    ':description' => $description,
                    ':ip_address' => $ip_address,
                    ':user_agent' => $user_agent
                ]);
            } catch (PDOException $e) {
                error_log("Failed to log admin action: " . $e->getMessage());
            }
        }
    }

    private function logClientAction($client_id, $client_phone, $action, $description = '', $metadata = null)
    {
        try {
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $session_id = session_id();

            $stmt = $this->db->prepare("
                INSERT INTO client_logs (client_id, client_phone, action, description, ip_address, user_agent, session_id, metadata)
                VALUES (:client_id, :client_phone, :action, :description, :ip_address, :user_agent, :session_id, :metadata)
            ");
            $stmt->execute([
                ':client_id' => $client_id,
                ':client_phone' => $client_phone,
                ':action' => $action,
                ':description' => $description,
                ':ip_address' => $ip_address,
                ':user_agent' => $user_agent,
                ':session_id' => $session_id,
                ':metadata' => $metadata ? json_encode($metadata) : null
            ]);
        } catch (PDOException $e) {
            error_log("Failed to log client action: " . $e->getMessage());
        }
    }

    // Booking methods
    private function createBooking($data)
    {
        try {
            $required = ['vehicle_id', 'customer_name', 'customer_email', 'pickup_location', 'pickup_date', 'return_date'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }
            
            // Check if client is logged in (from session)
            $logged_in_client_id = null;
            if (isset($_SESSION['client_id']) && $_SESSION['client_id']) {
                $logged_in_client_id = $_SESSION['client_id'];
            }

            // Get vehicle price
            $stmt = $this->db->prepare("SELECT price_per_day FROM vehicles WHERE id = :id");
            $stmt->execute([':id' => $data['vehicle_id']]);
            $vehicle = $stmt->fetch();

            if (!$vehicle) {
                http_response_code(404);
                echo json_encode(['error' => 'Vehicle not found']);
                return;
            }

            // Calculate total price
            $pickup = new DateTime($data['pickup_date']);
            $return = new DateTime($data['return_date']);
            $days = max(1, $return->diff($pickup)->days);
            $total_price = $vehicle['price_per_day'] * $days;

            // Check availability
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM bookings 
                WHERE vehicle_id = :vehicle_id 
                AND status IN ('pending', 'confirmed', 'active')
                AND (
                    (pickup_date <= :return_date AND return_date >= :pickup_date)
                )
            ");
            $stmt->execute([
                ':vehicle_id' => $data['vehicle_id'],
                ':pickup_date' => $data['pickup_date'],
                ':return_date' => $data['return_date']
            ]);
            $conflict = $stmt->fetch();

            if ($conflict['count'] > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Vehicle is not available for the selected dates']);
                return;
            }

            // If client is logged in, use their ID directly
            // Otherwise, create or update client from booking data
            $client_id = $logged_in_client_id;
            
            if (!$client_id) {
                // Client not logged in, create/update client from booking data
                $client_id = $this->createOrUpdateClient($data, $total_price);
            } else {
                // Client is logged in - update their booking stats
                $stmt = $this->db->prepare("SELECT phone, email FROM clients WHERE id = :id");
                $stmt->execute([':id' => $client_id]);
                $clientInfo = $stmt->fetch();
                
                // Update client booking stats
                if ($clientInfo) {
                    $updateStmt = $this->db->prepare("
                        UPDATE clients 
                        SET total_bookings = total_bookings + 1,
                            total_spent = total_spent + :booking_total,
                            last_booking_date = NOW()
                        WHERE id = :id
                    ");
                    $updateStmt->execute([
                        ':id' => $client_id,
                        ':booking_total' => $total_price
                    ]);
                }
            }

            // Create booking
            $stmt = $this->db->prepare("
                INSERT INTO bookings (vehicle_id, client_id, customer_name, customer_email, customer_phone, pickup_location, pickup_date, return_date, total_price, status)
                VALUES (:vehicle_id, :client_id, :customer_name, :customer_email, :customer_phone, :pickup_location, :pickup_date, :return_date, :total_price, 'pending')
            ");

            $stmt->execute([
                ':vehicle_id' => $data['vehicle_id'],
                ':client_id' => $client_id,
                ':customer_name' => $data['customer_name'],
                ':customer_email' => $data['customer_email'],
                ':customer_phone' => $data['customer_phone'] ?? null,
                ':pickup_location' => $data['pickup_location'],
                ':pickup_date' => $data['pickup_date'],
                ':return_date' => $data['return_date'],
                ':total_price' => $total_price
            ]);

            $id = $this->db->lastInsertId();

            // Log admin action if admin is logged in
            if (isset($_SESSION['admin_id'])) {
                $this->logAdminAction('create', "Booking created: #{$id} for {$data['customer_name']} ({$data['customer_phone']})");
            }

            echo json_encode([
                'success' => true,
                'message' => 'Booking created successfully',
                'booking_id' => $id,
                'total_price' => $total_price,
                'days' => $days,
                'client_id' => $client_id
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create booking: ' . $e->getMessage()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Invalid date format']);
        }
    }

    private function getBookings()
    {
        try {
            $email = $_GET['email'] ?? null;
            $sql = "SELECT b.*, v.name as vehicle_name, v.image_url as vehicle_image FROM bookings b LEFT JOIN vehicles v ON b.vehicle_id = v.id WHERE 1=1";
            $params = [];

            if ($email) {
                $sql .= " AND b.customer_email = :email";
                $params[':email'] = $email;
            }

            $sql .= " ORDER BY b.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Ensure all bookings have proper format
            foreach ($bookings as &$booking) {
                $booking['id'] = (int) $booking['id'];
                $booking['vehicle_id'] = $booking['vehicle_id'] ? (int) $booking['vehicle_id'] : null;
                $booking['total_price'] = (float) $booking['total_price'];
                $booking['status'] = $booking['status'] ?? 'pending';
                // Ensure dates are properly formatted
                if (isset($booking['pickup_date'])) {
                    $booking['pickup_date'] = date('Y-m-d H:i:s', strtotime($booking['pickup_date']));
                }
                if (isset($booking['return_date'])) {
                    $booking['return_date'] = date('Y-m-d H:i:s', strtotime($booking['return_date']));
                }
                if (isset($booking['created_at'])) {
                    $booking['created_at'] = date('Y-m-d H:i:s', strtotime($booking['created_at']));
                }
            }

            echo json_encode(['success' => true, 'data' => $bookings], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch bookings: ' . $e->getMessage()]);
        }
    }

    private function getBooking($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT b.*, v.name as vehicle_name, v.image_url as vehicle_image 
                FROM bookings b 
                LEFT JOIN vehicles v ON b.vehicle_id = v.id 
                WHERE b.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $booking = $stmt->fetch();

            if (!$booking) {
                http_response_code(404);
                echo json_encode(['error' => 'Booking not found']);
                return;
            }

            $booking['total_price'] = (float) $booking['total_price'];

            echo json_encode(['success' => true, 'data' => $booking]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch booking: ' . $e->getMessage()]);
        }
    }

    private function updateBooking($id, $data)
    {
        try {
            $fields = [];
            $params = [':id' => $id];

            $allowed = ['status', 'customer_name', 'customer_email', 'customer_phone', 'pickup_location', 'pickup_date', 'return_date'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE bookings SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Log admin action
            $status = isset($data['status']) ? $data['status'] : 'updated';
            $this->logAdminAction('update', "Booking #{$id} status changed to: {$status}");

            echo json_encode(['success' => true, 'message' => 'Booking updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update booking: ' . $e->getMessage()]);
        }
    }

    private function deleteBooking($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM bookings WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Booking not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Booking #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Booking deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete booking: ' . $e->getMessage()]);
        }
    }

    // Contact methods
    private function getContacts()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM contacts ORDER BY display_order ASC, created_at DESC");
            $contacts = $stmt->fetchAll();

            foreach ($contacts as &$contact) {
                $contact['is_active'] = (bool) $contact['is_active'];
            }

            echo json_encode(['success' => true, 'data' => $contacts]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch contacts: ' . $e->getMessage()]);
        }
    }

    private function getContact($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM contacts WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $contact = $stmt->fetch();

            if (!$contact) {
                http_response_code(404);
                echo json_encode(['error' => 'Contact not found']);
                return;
            }

            $contact['is_active'] = (bool) $contact['is_active'];

            echo json_encode(['success' => true, 'data' => $contact]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch contact: ' . $e->getMessage()]);
        }
    }

    private function createContact($data)
    {
        try {
            $required = ['contact_type', 'label', 'value'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }

            $stmt = $this->db->prepare("
                INSERT INTO contacts (contact_type, label, value, icon, is_active, display_order)
                VALUES (:contact_type, :label, :value, :icon, :is_active, :display_order)
            ");

            $stmt->execute([
                ':contact_type' => $data['contact_type'],
                ':label' => $data['label'],
                ':value' => $data['value'],
                ':icon' => $data['icon'] ?? $this->getDefaultIcon($data['contact_type']),
                ':is_active' => isset($data['is_active']) ? (int) $data['is_active'] : 1,
                ':display_order' => $data['display_order'] ?? 0
            ]);

            $id = $this->db->lastInsertId();

            // Log admin action
            $this->logAdminAction('create', "Contact created: {$data['label']} (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Contact created', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create contact: ' . $e->getMessage()]);
        }
    }

    private function updateContact($id, $data)
    {
        try {
            $fields = [];
            $params = [':id' => $id];

            $allowed = ['contact_type', 'label', 'value', 'icon', 'is_active', 'display_order'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $field === 'is_active' ? (int) $data[$field] : $data[$field];
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE contacts SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Log admin action
            $this->logAdminAction('update', "Contact #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Contact updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update contact: ' . $e->getMessage()]);
        }
    }

    private function deleteContact($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM contacts WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Contact not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Contact #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Contact deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete contact: ' . $e->getMessage()]);
        }
    }

    // Client methods
    private function createOrUpdateClient($data, $booking_total = 0)
    {
        try {
            $name = $data['customer_name'] ?? '';
            $phone = $data['customer_phone'] ?? '';
            $email = $data['customer_email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($name) || empty($phone)) {
                return null;
            }

            // Check if client exists by phone
            $stmt = $this->db->prepare("SELECT id FROM clients WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Update existing client
                $client_id = $existing['id'];

                // Update password if provided
                if (!empty($password)) {
                    $password_hash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $this->db->prepare("
                        UPDATE clients 
                        SET name = :name, email = :email, password_hash = :password_hash,
                            total_bookings = total_bookings + 1, 
                            total_spent = total_spent + :booking_total,
                            last_booking_date = NOW()
                        WHERE id = :id
                    ");
                    $stmt->execute([
                        ':id' => $client_id,
                        ':name' => $name,
                        ':email' => $email,
                        ':password_hash' => $password_hash,
                        ':booking_total' => $booking_total
                    ]);
                } else {
                    $stmt = $this->db->prepare("
                        UPDATE clients 
                        SET name = :name, email = :email,
                            total_bookings = total_bookings + 1, 
                            total_spent = total_spent + :booking_total,
                            last_booking_date = NOW()
                        WHERE id = :id
                    ");
                    $stmt->execute([
                        ':id' => $client_id,
                        ':name' => $name,
                        ':email' => $email,
                        ':booking_total' => $booking_total
                    ]);
                }
            } else {
                // Create new client
                if (empty($password)) {
                    // Generate a default password if not provided
                    $password = bin2hex(random_bytes(4)); // Simple 8-char password
                }
                $password_hash = password_hash($password, PASSWORD_DEFAULT);

                $stmt = $this->db->prepare("
                    INSERT INTO clients (name, phone, email, password_hash, total_bookings, total_spent, last_booking_date)
                    VALUES (:name, :phone, :email, :password_hash, 1, :booking_total, NOW())
                ");
                $stmt->execute([
                    ':name' => $name,
                    ':phone' => $phone,
                    ':email' => $email,
                    ':password_hash' => $password_hash,
                    ':booking_total' => $booking_total
                ]);
                $client_id = $this->db->lastInsertId();
            }

            return $client_id;
        } catch (PDOException $e) {
            error_log("Failed to create/update client: " . $e->getMessage());
            return null;
        }
    }

    private function getClients()
    {
        try {
            $stmt = $this->db->query("
                SELECT id, name, phone, email, total_bookings, total_spent, last_booking_date, last_login_date, is_active, created_at
                FROM clients 
                ORDER BY created_at DESC
            ");
            $clients = $stmt->fetchAll();

            foreach ($clients as &$client) {
                $client['total_bookings'] = (int) $client['total_bookings'];
                $client['total_spent'] = (float) $client['total_spent'];
                $client['is_active'] = (bool) $client['is_active'];
            }

            echo json_encode(['success' => true, 'data' => $clients]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch clients: ' . $e->getMessage()]);
        }
    }

    private function getClient($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT id, name, phone, email, address, city, country, total_bookings, total_spent, 
                       last_booking_date, last_login_date, is_active, created_at
                FROM clients WHERE id = :id
            ");
            $stmt->execute([':id' => $id]);
            $client = $stmt->fetch();

            if (!$client) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                return;
            }

            $client['total_bookings'] = (int) $client['total_bookings'];
            $client['total_spent'] = (float) $client['total_spent'];
            $client['is_active'] = (bool) $client['is_active'];
            echo json_encode(['success' => true, 'data' => $client]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch client: ' . $e->getMessage()]);
        }
    }

    private function updateClient($id, $data)
    {
        try {
            $updates = [];
            $params = [':id' => $id];

            if (isset($data['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = $data['name'];
            }
            if (isset($data['phone'])) {
                $updates[] = "phone = :phone";
                $params[':phone'] = $data['phone'];
            }
            if (isset($data['email'])) {
                $updates[] = "email = :email";
                $params[':email'] = $data['email'];
            }
            if (isset($data['password']) && !empty($data['password'])) {
                $updates[] = "password_hash = :password_hash";
                $params[':password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE clients SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('update', "Client #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Client updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update client: ' . $e->getMessage()]);
        }
    }

    private function deleteClient($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM clients WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Client #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Client deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete client: ' . $e->getMessage()]);
        }
    }

    // Admin management methods
    private function getAdmins()
    {
        try {
            $stmt = $this->db->query("SELECT id, email, full_name, role, is_active, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC");
            $admins = $stmt->fetchAll();

            // Remove password hashes from response
            foreach ($admins as &$admin) {
                unset($admin['password_hash']);
                $admin['is_active'] = (bool) $admin['is_active'];
            }

            echo json_encode(['success' => true, 'data' => $admins]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch admins: ' . $e->getMessage()]);
        }
    }

    private function getAdmin($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = :id AND role = 'admin'");
            $stmt->execute([':id' => $id]);
            $admin = $stmt->fetch();

            if (!$admin) {
                http_response_code(404);
                echo json_encode(['error' => 'Admin not found']);
                return;
            }

            unset($admin['password_hash']);
            $admin['is_active'] = (bool) $admin['is_active'];

            echo json_encode(['success' => true, 'data' => $admin]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch admin: ' . $e->getMessage()]);
        }
    }

    private function createAdmin($data)
    {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized - Please log in again. Session not found.']);
                return;
            }

            // Validate required fields
            $required = ['email', 'password', 'full_name'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }

            // Check if email already exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute([':email' => $data['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists']);
                return;
            }

            // Hash password
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

            $stmt = $this->db->prepare("
                INSERT INTO users (email, password_hash, full_name, role, is_active)
                VALUES (:email, :password_hash, :full_name, 'admin', :is_active)
            ");

            $stmt->execute([
                ':email' => $data['email'],
                ':password_hash' => $password_hash,
                ':full_name' => $data['full_name'],
                ':is_active' => isset($data['is_active']) ? (int) $data['is_active'] : 1
            ]);

            $id = $this->db->lastInsertId();

            // Log admin action
            $this->logAdminAction('create', "Admin created: {$data['email']} (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Admin created successfully', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create admin: ' . $e->getMessage()]);
        }
    }

    private function updateAdmin($id, $data)
    {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $fields = [];
            $params = [':id' => $id];

            // Allow updating email, full_name, is_active, and password
            if (isset($data['email'])) {
                // Check if email is already taken by another admin
                $stmt = $this->db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
                $stmt->execute([':email' => $data['email'], ':id' => $id]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email already exists']);
                    return;
                }
                $fields[] = "email = :email";
                $params[':email'] = $data['email'];
            }

            if (isset($data['full_name'])) {
                $fields[] = "full_name = :full_name";
                $params[':full_name'] = $data['full_name'];
            }

            if (isset($data['is_active'])) {
                $fields[] = "is_active = :is_active";
                $params[':is_active'] = (int) $data['is_active'];
            }

            if (isset($data['password']) && !empty($data['password'])) {
                $fields[] = "password_hash = :password_hash";
                $params[':password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id AND role = 'admin'";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Admin not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('update', "Admin #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Admin updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update admin: ' . $e->getMessage()]);
        }
    }

    private function deleteAdmin($id)
    {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            // Prevent deleting yourself
            if ($_SESSION['admin_id'] == $id) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete your own account']);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id AND role = 'admin'");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Admin not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Admin #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Admin deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete admin: ' . $e->getMessage()]);
        }
    }

    private function changeAdminPassword($data)
    {
        try {
            // Check if session exists
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $admin_id = $_SESSION['admin_id'];
            $current_password = $data['current_password'] ?? '';
            $new_password = $data['new_password'] ?? '';
            $confirm_password = $data['confirm_password'] ?? '';

            // Validate required fields
            if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
                http_response_code(400);
                echo json_encode(['error' => 'All password fields are required']);
                return;
            }

            // Check if new passwords match
            if ($new_password !== $confirm_password) {
                http_response_code(400);
                echo json_encode(['error' => 'New passwords do not match']);
                return;
            }

            // Validate password length
            if (strlen($new_password) < 6) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 6 characters long']);
                return;
            }

            // Verify current password
            $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE id = :id AND role = 'admin'");
            $stmt->execute([':id' => $admin_id]);
            $admin = $stmt->fetch();

            if (!$admin || !password_verify($current_password, $admin['password_hash'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect']);
                return;
            }

            // Update password
            $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :id");
            $stmt->execute([
                ':password_hash' => $new_password_hash,
                ':id' => $admin_id
            ]);

            // Log admin action
            $this->logAdminAction('password_change', 'Password changed successfully');

            echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to change password: ' . $e->getMessage()]);
        }
    }

    // Car Brands methods
    private function getCarBrands()
    {
        try {
            $stmt = $this->db->query("
                SELECT * FROM car_brands 
                WHERE is_active = 1 
                ORDER BY display_order ASC, name ASC
            ");
            $brands = $stmt->fetchAll();
            echo json_encode($brands);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch car brands: ' . $e->getMessage()]);
        }
    }

    private function getCarBrand($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM car_brands WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $brand = $stmt->fetch();

            if (!$brand) {
                http_response_code(404);
                echo json_encode(['error' => 'Car brand not found']);
                return;
            }

            echo json_encode($brand);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch car brand: ' . $e->getMessage()]);
        }
    }

    private function createCarBrand($data)
    {
        try {
            // Check authentication
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            // Validate required fields
            $name = $data['name'] ?? '';
            $logo_url = $data['logo_url'] ?? '';

            if (empty($name) || empty($logo_url)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and logo_url are required']);
                return;
            }

            // Insert new brand
            $stmt = $this->db->prepare("
                INSERT INTO car_brands (name, logo_url, display_order, is_active) 
                VALUES (:name, :logo_url, :display_order, :is_active)
            ");

            $stmt->execute([
                ':name' => $name,
                ':logo_url' => $logo_url,
                ':display_order' => $data['display_order'] ?? 0,
                ':is_active' => isset($data['is_active']) ? (int) $data['is_active'] : 1
            ]);

            $id = $this->db->lastInsertId();

            // Log admin action
            $this->logAdminAction('create', "Car brand '{$name}' created (ID: {$id})");

            echo json_encode([
                'success' => true,
                'message' => 'Car brand created successfully',
                'id' => $id
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create car brand: ' . $e->getMessage()]);
        }
    }

    private function updateCarBrand($id, $data)
    {
        try {
            // Check authentication
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            // Build update query
            $allowed = ['name', 'logo_url', 'display_order', 'is_active'];
            $updates = [];
            $params = [':id' => $id];

            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $updates[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $data[$field];
                }
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE car_brands SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Car brand not found']);
                return;
            }

            // Log admin action
            $name = $data['name'] ?? "Brand #{$id}";
            $this->logAdminAction('update', "Car brand '{$name}' updated (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Car brand updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update car brand: ' . $e->getMessage()]);
        }
    }

    private function deleteCarBrand($id)
    {
        try {
            // Check authentication
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            // Get brand name for logging
            $stmt = $this->db->prepare("SELECT name FROM car_brands WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $brand = $stmt->fetch();

            // Delete brand
            $stmt = $this->db->prepare("DELETE FROM car_brands WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Car brand not found']);
                return;
            }

            // Log admin action
            $name = $brand ? $brand['name'] : "Brand #{$id}";
            $this->logAdminAction('delete', "Car brand '{$name}' deleted (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Car brand deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete car brand: ' . $e->getMessage()]);
        }
    }

    private function insertSampleCarBrands()
    {
        $brands = [
            [
                'name' => 'Mercedes-Benz',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/05/Mercedes-Benz-Logo.png',
                'display_order' => 1,
                'is_active' => 1
            ],
            [
                'name' => 'Dacia',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2021/03/Dacia-Logo.png',
                'display_order' => 2,
                'is_active' => 1
            ],
            [
                'name' => 'Opel',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/05/Opel-Logo.png',
                'display_order' => 3,
                'is_active' => 1
            ],
            [
                'name' => 'Audi',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/04/Audi-Logo.png',
                'display_order' => 4,
                'is_active' => 1
            ],
            [
                'name' => 'Kia',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/11/Kia-Logo.png',
                'display_order' => 5,
                'is_active' => 1
            ],
            [
                'name' => 'Renault',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/04/Renault-Logo.png',
                'display_order' => 6,
                'is_active' => 1
            ],
            [
                'name' => 'Ford',
                'logo_url' => 'https://logos-world.net/wp-content/uploads/2020/05/Ford-Logo.png',
                'display_order' => 7,
                'is_active' => 1
            ]
        ];

        $stmt = $this->db->prepare("
            INSERT INTO car_brands (name, logo_url, display_order, is_active) 
            VALUES (:name, :logo_url, :display_order, :is_active)
        ");

        foreach ($brands as $brand) {
            try {
                $stmt->execute($brand);
            } catch (PDOException $e) {
                error_log("Failed to insert brand {$brand['name']}: " . $e->getMessage());
            }
        }
    }

    // Offer management methods
    private function getOffers() {
        try {
            $stmt = $this->db->query("
                SELECT o.*, v.name as vehicle_name, v.image_url as vehicle_image 
                FROM offers o 
                LEFT JOIN vehicles v ON o.vehicle_id = v.id 
                ORDER BY o.created_at DESC
            ");
            $offers = $stmt->fetchAll();
            
            foreach ($offers as &$offer) {
                $offer['is_active'] = (bool)$offer['is_active'];
                $offer['discount_value'] = (float)$offer['discount_value'];
                $offer['sales_count'] = (int)$offer['sales_count'];
                $offer['max_uses'] = $offer['max_uses'] ? (int)$offer['max_uses'] : null;
                // Use offer image if available, otherwise vehicle image
                if (empty($offer['image_url']) && !empty($offer['vehicle_image'])) {
                    $offer['image_url'] = $offer['vehicle_image'];
                }
            }
            
            echo json_encode(['success' => true, 'data' => $offers]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch offers: ' . $e->getMessage()]);
        }
    }

    private function getOffer($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT o.*, v.name as vehicle_name, v.image_url as vehicle_image 
                FROM offers o 
                LEFT JOIN vehicles v ON o.vehicle_id = v.id 
                WHERE o.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $offer = $stmt->fetch();
            
            // Use offer image if available, otherwise vehicle image
            if ($offer && empty($offer['image_url']) && !empty($offer['vehicle_image'])) {
                $offer['image_url'] = $offer['vehicle_image'];
            }

            if (!$offer) {
                http_response_code(404);
                echo json_encode(['error' => 'Offer not found']);
                return;
            }

            $offer['is_active'] = (bool)$offer['is_active'];
            $offer['discount_value'] = (float)$offer['discount_value'];
            $offer['sales_count'] = (int)$offer['sales_count'];
            $offer['max_uses'] = $offer['max_uses'] ? (int)$offer['max_uses'] : null;
            
            echo json_encode(['success' => true, 'data' => $offer]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch offer: ' . $e->getMessage()]);
        }
    }

    private function createOffer($data) {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $required = ['title', 'offer_type', 'discount_value', 'start_date', 'end_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }

            // Validate offer type
            $validTypes = ['percentage', 'fixed_amount', 'free_days'];
            if (!in_array($data['offer_type'], $validTypes)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid offer type. Must be: percentage, fixed_amount, or free_days']);
                return;
            }

            // Validate dates
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            if ($endDate < $startDate) {
                http_response_code(400);
                echo json_encode(['error' => 'End date must be after start date']);
                return;
            }

            $stmt = $this->db->prepare("
                INSERT INTO offers (title, description, offer_type, discount_value, vehicle_id, image_url, start_date, end_date, is_active, max_uses)
                VALUES (:title, :description, :offer_type, :discount_value, :vehicle_id, :image_url, :start_date, :end_date, :is_active, :max_uses)
            ");

            $stmt->execute([
                ':title' => $data['title'],
                ':description' => $data['description'] ?? null,
                ':offer_type' => $data['offer_type'],
                ':discount_value' => $data['discount_value'],
                ':vehicle_id' => !empty($data['vehicle_id']) ? (int)$data['vehicle_id'] : null,
                ':image_url' => !empty($data['image_url']) ? $data['image_url'] : null,
                ':start_date' => $data['start_date'],
                ':end_date' => $data['end_date'],
                ':is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1,
                ':max_uses' => !empty($data['max_uses']) ? (int)$data['max_uses'] : null
            ]);

            $id = $this->db->lastInsertId();
            
            // Log admin action
            $this->logAdminAction('create', "Offer created: {$data['title']} (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Offer created successfully', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create offer: ' . $e->getMessage()]);
        }
    }

    private function updateOffer($id, $data) {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $fields = [];
            $params = [':id' => $id];

            $allowed = ['title', 'description', 'offer_type', 'discount_value', 'vehicle_id', 'image_url', 'start_date', 'end_date', 'is_active', 'max_uses'];
            
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    if ($field === 'offer_type') {
                        $validTypes = ['percentage', 'fixed_amount', 'free_days'];
                        if (!in_array($data[$field], $validTypes)) {
                            http_response_code(400);
                            echo json_encode(['error' => 'Invalid offer type']);
                            return;
                        }
                    }
                    
                    if ($field === 'vehicle_id') {
                        $fields[] = "$field = :$field";
                        // Handle empty string, null, 0, or false as null (all vehicles)
                        $vehicleId = $data[$field];
                        if (empty($vehicleId) || $vehicleId === '0' || $vehicleId === 0 || $vehicleId === false) {
                            $params[":$field"] = null;
                        } else {
                            $params[":$field"] = (int)$vehicleId;
                        }
                    } elseif ($field === 'is_active') {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = (int)$data[$field];
                    } elseif ($field === 'max_uses') {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = !empty($data[$field]) ? (int)$data[$field] : null;
                    } elseif ($field === 'discount_value') {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = (float)$data[$field];
                    } else {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = $data[$field];
                    }
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            // Validate dates if both are being updated
            if (isset($data['start_date']) && isset($data['end_date'])) {
                $startDate = new DateTime($data['start_date']);
                $endDate = new DateTime($data['end_date']);
                if ($endDate < $startDate) {
                    http_response_code(400);
                    echo json_encode(['error' => 'End date must be after start date']);
                    return;
                }
            }

            $sql = "UPDATE offers SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Offer not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('update', "Offer #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Offer updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update offer: ' . $e->getMessage()]);
        }
    }

    private function deleteOffer($id) {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM offers WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Offer not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Offer #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Offer deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete offer: ' . $e->getMessage()]);
        }
    }

    // Review management methods
    private function getReviews() {
        try {
            $vehicle_id = $_GET['vehicle_id'] ?? null;
            $approved_only = $_GET['approved'] ?? 'true';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $limit = min(max($limit, 1), 100);
            
            $sql = "
                SELECT r.*, v.name as vehicle_name 
                FROM reviews r 
                LEFT JOIN vehicles v ON r.vehicle_id = v.id 
                WHERE 1=1
            ";
            $params = [];
            
            if ($approved_only === 'true' || $approved_only === true) {
                $sql .= " AND r.is_approved = 1";
            }
            
            if ($vehicle_id) {
                $sql .= " AND r.vehicle_id = :vehicle_id";
                $params[':vehicle_id'] = (int)$vehicle_id;
            }
            
            $sql .= " ORDER BY r.is_featured DESC, r.created_at DESC LIMIT :limit";
            $params[':limit'] = $limit;
            
            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                if ($key === ':limit') {
                    $stmt->bindValue($key, $value, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($key, $value);
                }
            }
            $stmt->execute();
            $reviews = $stmt->fetchAll();
            
            foreach ($reviews as &$review) {
                $review['rating'] = (int)$review['rating'];
                $review['service_rating'] = $review['service_rating'] ? (int)$review['service_rating'] : null;
                $review['car_rating'] = $review['car_rating'] ? (int)$review['car_rating'] : null;
                $review['is_approved'] = (bool)$review['is_approved'];
                $review['is_featured'] = (bool)$review['is_featured'];
            }
            
            echo json_encode(['success' => true, 'data' => $reviews]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch reviews: ' . $e->getMessage()]);
        }
    }

    private function getReview($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, v.name as vehicle_name 
                FROM reviews r 
                LEFT JOIN vehicles v ON r.vehicle_id = v.id 
                WHERE r.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $review = $stmt->fetch();

            if (!$review) {
                http_response_code(404);
                echo json_encode(['error' => 'Review not found']);
                return;
            }

            $review['rating'] = (int)$review['rating'];
            $review['service_rating'] = $review['service_rating'] ? (int)$review['service_rating'] : null;
            $review['car_rating'] = $review['car_rating'] ? (int)$review['car_rating'] : null;
            $review['is_approved'] = (bool)$review['is_approved'];
            $review['is_featured'] = (bool)$review['is_featured'];
            
            echo json_encode(['success' => true, 'data' => $review]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch review: ' . $e->getMessage()]);
        }
    }

    private function createReview($data) {
        try {
            $required = ['client_name', 'rating', 'comment'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }

            // Validate rating
            $rating = (int)$data['rating'];
            if ($rating < 1 || $rating > 5) {
                http_response_code(400);
                echo json_encode(['error' => 'Rating must be between 1 and 5']);
                return;
            }

            // Validate service and car ratings if provided
            if (isset($data['service_rating'])) {
                $serviceRating = (int)$data['service_rating'];
                if ($serviceRating < 1 || $serviceRating > 5) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Service rating must be between 1 and 5']);
                    return;
                }
            }

            if (isset($data['car_rating'])) {
                $carRating = (int)$data['car_rating'];
                if ($carRating < 1 || $carRating > 5) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Car rating must be between 1 and 5']);
                    return;
                }
            }

            $stmt = $this->db->prepare("
                INSERT INTO reviews (client_name, client_email, client_location, vehicle_id, rating, comment, service_rating, car_rating, is_approved)
                VALUES (:client_name, :client_email, :client_location, :vehicle_id, :rating, :comment, :service_rating, :car_rating, :is_approved)
            ");

            $stmt->execute([
                ':client_name' => $data['client_name'],
                ':client_email' => $data['client_email'] ?? null,
                ':client_location' => $data['client_location'] ?? null,
                ':vehicle_id' => !empty($data['vehicle_id']) ? (int)$data['vehicle_id'] : null,
                ':rating' => $rating,
                ':comment' => $data['comment'],
                ':service_rating' => !empty($data['service_rating']) ? (int)$data['service_rating'] : null,
                ':car_rating' => !empty($data['car_rating']) ? (int)$data['car_rating'] : null,
                ':is_approved' => 0 // Reviews need admin approval
            ]);

            $id = $this->db->lastInsertId();
            
            echo json_encode(['success' => true, 'message' => 'Review submitted successfully. It will be published after approval.', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create review: ' . $e->getMessage()]);
        }
    }

    private function updateReview($id, $data) {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $fields = [];
            $params = [':id' => $id];

            $allowed = ['client_name', 'client_email', 'client_location', 'vehicle_id', 'rating', 'comment', 'service_rating', 'car_rating', 'is_approved', 'is_featured'];
            
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    if ($field === 'rating' || $field === 'service_rating' || $field === 'car_rating') {
                        $rating = (int)$data[$field];
                        if ($rating < 1 || $rating > 5) {
                            http_response_code(400);
                            echo json_encode(['error' => "$field must be between 1 and 5"]);
                            return;
                        }
                        $fields[] = "$field = :$field";
                        $params[":$field"] = $rating;
                    } elseif ($field === 'vehicle_id') {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = !empty($data[$field]) ? (int)$data[$field] : null;
                    } elseif ($field === 'is_approved' || $field === 'is_featured') {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = (int)$data[$field];
                    } else {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = $data[$field];
                    }
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $sql = "UPDATE reviews SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Review not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('update', "Review #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Review updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update review: ' . $e->getMessage()]);
        }
    }

    private function deleteReview($id) {
        try {
            // Check if session exists and user is admin
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['admin_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM reviews WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Review not found']);
                return;
            }

            // Log admin action
            $this->logAdminAction('delete', "Review #{$id} deleted");

            echo json_encode(['success' => true, 'message' => 'Review deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete review: ' . $e->getMessage()]);
        }
    }

    private function getDefaultIcon($type)
    {
        $icons = [
            'phone' => 'fas fa-phone',
            'email' => 'fas fa-envelope',
            'whatsapp' => 'fab fa-whatsapp',
            'facebook' => 'fab fa-facebook',
            'instagram' => 'fab fa-instagram',
            'twitter' => 'fab fa-twitter',
            'linkedin' => 'fab fa-linkedin',
            'youtube' => 'fab fa-youtube',
            'address' => 'fas fa-map-marker-alt',
            'website' => 'fas fa-globe'
        ];
        return $icons[$type] ?? 'fas fa-link';
    }
}

// Initialize and handle request
try {
    $api = new RentcarsAPI();
    $api->handleRequest();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>