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

class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
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

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }
}

class RentcarsAPI {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->initDatabase();
    }

    private function initDatabase() {
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
                    customer_name VARCHAR(255) NOT NULL,
                    customer_email VARCHAR(255) NOT NULL,
                    customer_phone VARCHAR(50),
                    pickup_location VARCHAR(255) NOT NULL,
                    pickup_date DATETIME NOT NULL,
                    return_date DATETIME NOT NULL,
                    total_price DECIMAL(10, 2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
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

            // Insert sample vehicles if table is empty
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM vehicles");
            $result = $stmt->fetch();
            if ($result['count'] == 0) {
                $this->insertSampleVehicles();
            }
        } catch (PDOException $e) {
            error_log("Database initialization error: " . $e->getMessage());
        }
    }

    private function migrateVehiclesTable() {
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

    private function migrateClientsTable() {
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

    private function insertSampleVehicles() {
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

    public function handleRequest() {
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

    private function handleGet($path) {
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
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        }
    }

    private function handlePost($path) {
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
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        }
    }

    private function handlePut($path) {
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
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
    }

    private function handleDelete($path) {
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
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
    }

    // Vehicle methods
    private function getVehicles() {
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
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $limit = min(max($limit, 1), 100); // Between 1 and 100
            $sql .= " LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $vehicles = $stmt->fetchAll();

            // Format response
            foreach ($vehicles as &$vehicle) {
                $vehicle['air_conditioning'] = (bool)$vehicle['air_conditioning'];
                $vehicle['available'] = (bool)$vehicle['available'];
                $vehicle['price_per_day'] = (float)$vehicle['price_per_day'];
                $vehicle['rating'] = (float)$vehicle['rating'];
            }

            echo json_encode(['success' => true, 'data' => $vehicles]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch vehicles: ' . $e->getMessage()]);
        }
    }

    private function getVehicle($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM vehicles WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $vehicle = $stmt->fetch();

            if (!$vehicle) {
                http_response_code(404);
                echo json_encode(['error' => 'Vehicle not found']);
                return;
            }

            $vehicle['air_conditioning'] = (bool)$vehicle['air_conditioning'];
            $vehicle['available'] = (bool)$vehicle['available'];
            $vehicle['price_per_day'] = (float)$vehicle['price_per_day'];
            $vehicle['rating'] = (float)$vehicle['rating'];

            echo json_encode(['success' => true, 'data' => $vehicle]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch vehicle: ' . $e->getMessage()]);
        }
    }

    private function searchVehicles() {
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
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $limit = min(max($limit, 1), 100);
            $sql .= " LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $vehicles = $stmt->fetchAll();

            foreach ($vehicles as &$vehicle) {
                $vehicle['air_conditioning'] = (bool)$vehicle['air_conditioning'];
                $vehicle['available'] = (bool)$vehicle['available'];
                $vehicle['price_per_day'] = (float)$vehicle['price_per_day'];
                $vehicle['rating'] = (float)$vehicle['rating'];
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

    private function createVehicle($data) {
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
                ':air_conditioning' => isset($data['air_conditioning']) ? (int)$data['air_conditioning'] : 1,
                ':doors' => $data['doors'] ?? 4,
                ':rating' => $data['rating'] ?? 4.5,
                ':review_count' => $data['review_count'] ?? 0,
                ':available' => isset($data['available']) ? (int)$data['available'] : 1,
                ':description' => $data['description'] ?? null,
                ':available_from' => !empty($data['available_from']) ? $data['available_from'] : null,
                ':available_to' => !empty($data['available_to']) ? $data['available_to'] : null
            ]);

            $id = $this->db->lastInsertId();
            
            // Log admin action
            $this->logAdminAction('create', "Vehicle created: {$data['name']} (ID: {$id})");

            echo json_encode(['success' => true, 'message' => 'Vehicle created', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create vehicle: ' . $e->getMessage()]);
        }
    }

    private function updateVehicle($id, $data) {
        try {
            $fields = [];
            $params = [':id' => $id];

            $allowed = ['name', 'type', 'price_per_day', 'image_url', 'passengers', 'transmission', 'air_conditioning', 'doors', 'rating', 'review_count', 'available', 'description'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $field === 'air_conditioning' || $field === 'available' ? (int)$data[$field] : $data[$field];
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

            // Log admin action
            $this->logAdminAction('update', "Vehicle #{$id} updated");

            echo json_encode(['success' => true, 'message' => 'Vehicle updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update vehicle: ' . $e->getMessage()]);
        }
    }

    private function deleteVehicle($id) {
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

    private function logAdminAction($action, $description = '') {
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

    private function logClientAction($client_id, $client_phone, $action, $description = '', $metadata = null) {
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
    private function createBooking($data) {
        try {
            $required = ['vehicle_id', 'customer_name', 'customer_email', 'pickup_location', 'pickup_date', 'return_date'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
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

            // Create or update client
            $client_id = $this->createOrUpdateClient($data);

            // Create booking
            $stmt = $this->db->prepare("
                INSERT INTO bookings (vehicle_id, customer_name, customer_email, customer_phone, pickup_location, pickup_date, return_date, total_price, status)
                VALUES (:vehicle_id, :customer_name, :customer_email, :customer_phone, :pickup_location, :pickup_date, :return_date, :total_price, 'pending')
            ");

            $stmt->execute([
                ':vehicle_id' => $data['vehicle_id'],
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

    private function getBookings() {
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
            $bookings = $stmt->fetchAll();

            foreach ($bookings as &$booking) {
                $booking['total_price'] = (float)$booking['total_price'];
            }

            echo json_encode(['success' => true, 'data' => $bookings]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch bookings: ' . $e->getMessage()]);
        }
    }

    private function getBooking($id) {
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

            $booking['total_price'] = (float)$booking['total_price'];

            echo json_encode(['success' => true, 'data' => $booking]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch booking: ' . $e->getMessage()]);
        }
    }

    private function updateBooking($id, $data) {
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

    private function deleteBooking($id) {
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
    private function getContacts() {
        try {
            $stmt = $this->db->query("SELECT * FROM contacts ORDER BY display_order ASC, created_at DESC");
            $contacts = $stmt->fetchAll();

            foreach ($contacts as &$contact) {
                $contact['is_active'] = (bool)$contact['is_active'];
            }

            echo json_encode(['success' => true, 'data' => $contacts]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch contacts: ' . $e->getMessage()]);
        }
    }

    private function getContact($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM contacts WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $contact = $stmt->fetch();

            if (!$contact) {
                http_response_code(404);
                echo json_encode(['error' => 'Contact not found']);
                return;
            }

            $contact['is_active'] = (bool)$contact['is_active'];

            echo json_encode(['success' => true, 'data' => $contact]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch contact: ' . $e->getMessage()]);
        }
    }

    private function createContact($data) {
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
                ':is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1,
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

    private function updateContact($id, $data) {
        try {
            $fields = [];
            $params = [':id' => $id];

            $allowed = ['contact_type', 'label', 'value', 'icon', 'is_active', 'display_order'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $field === 'is_active' ? (int)$data[$field] : $data[$field];
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

    private function deleteContact($id) {
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
    private function createOrUpdateClient($data, $booking_total = 0) {
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

    private function getClients() {
        try {
            $stmt = $this->db->query("
                SELECT id, name, phone, email, total_bookings, total_spent, last_booking_date, last_login_date, is_active, created_at
                FROM clients 
                ORDER BY created_at DESC
            ");
            $clients = $stmt->fetchAll();

            foreach ($clients as &$client) {
                $client['total_bookings'] = (int)$client['total_bookings'];
                $client['total_spent'] = (float)$client['total_spent'];
                $client['is_active'] = (bool)$client['is_active'];
            }

            echo json_encode(['success' => true, 'data' => $clients]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch clients: ' . $e->getMessage()]);
        }
    }

    private function getClient($id) {
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

            $client['total_bookings'] = (int)$client['total_bookings'];
            $client['total_spent'] = (float)$client['total_spent'];
            $client['is_active'] = (bool)$client['is_active'];
            echo json_encode(['success' => true, 'data' => $client]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch client: ' . $e->getMessage()]);
        }
    }

    private function updateClient($id, $data) {
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

    private function deleteClient($id) {
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
    private function getAdmins() {
        try {
            $stmt = $this->db->query("SELECT id, email, full_name, role, is_active, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC");
            $admins = $stmt->fetchAll();
            
            // Remove password hashes from response
            foreach ($admins as &$admin) {
                unset($admin['password_hash']);
                $admin['is_active'] = (bool)$admin['is_active'];
            }
            
            echo json_encode(['success' => true, 'data' => $admins]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch admins: ' . $e->getMessage()]);
        }
    }

    private function getAdmin($id) {
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
            $admin['is_active'] = (bool)$admin['is_active'];
            
            echo json_encode(['success' => true, 'data' => $admin]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch admin: ' . $e->getMessage()]);
        }
    }

    private function createAdmin($data) {
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
                ':is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1
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

    private function updateAdmin($id, $data) {
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
                $params[':is_active'] = (int)$data['is_active'];
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

    private function deleteAdmin($id) {
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

    private function changeAdminPassword($data) {
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

    private function getDefaultIcon($type) {
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

