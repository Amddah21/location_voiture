<?php
/**
 * Admin Authentication Handler
 * Handles login, logout, and session management
 */

session_start();

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

class AdminAuth {
    private $db;

    public function __construct() {
        $this->connectDB();
        $this->initDatabase();
    }

    private function connectDB() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->db = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    private function initDatabase() {
        // Create admin_logs table if it doesn't exist
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

        // Create default admin user if it doesn't exist
        $stmt = $this->db->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        $result = $stmt->fetch();
        if ($result['count'] == 0) {
            // Default admin: admin@rentcars.com / admin123
            $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password_hash, full_name, role) 
                VALUES (:email, :password_hash, :full_name, 'admin')
            ");
            $stmt->execute([
                ':email' => 'admin@rentcars.com',
                ':password_hash' => $password_hash,
                ':full_name' => 'Administrator'
            ]);
        }
    }

    public function login($email, $password) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email AND role = 'admin'");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['admin_id'] = $user['id'];
                $_SESSION['admin_email'] = $user['email'];
                $_SESSION['admin_name'] = $user['full_name'];
                $_SESSION['admin_logged_in'] = true;

                // Log login action
                $this->logAction($user['id'], $user['email'], 'login', 'Admin logged in successfully');

                return ['success' => true, 'message' => 'Login successful'];
            } else {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function logout() {
        if (isset($_SESSION['admin_id'])) {
            $this->logAction(
                $_SESSION['admin_id'],
                $_SESSION['admin_email'] ?? '',
                'logout',
                'Admin logged out'
            );
        }
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }

    public function isLoggedIn() {
        return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    }

    public function requireLogin() {
        if (!$this->isLoggedIn()) {
            header('Location: admin_login.php');
            exit;
        }
    }

    public function getCurrentAdmin() {
        if ($this->isLoggedIn()) {
            return [
                'id' => $_SESSION['admin_id'],
                'email' => $_SESSION['admin_email'],
                'name' => $_SESSION['admin_name']
            ];
        }
        return null;
    }

    public function logAction($admin_id, $admin_email, $action, $description = '') {
        try {
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $stmt = $this->db->prepare("
                INSERT INTO admin_logs (admin_id, admin_email, action, description, ip_address, user_agent)
                VALUES (:admin_id, :admin_email, :action, :description, :ip_address, :user_agent)
            ");
            $stmt->execute([
                ':admin_id' => $admin_id,
                ':admin_email' => $admin_email,
                ':action' => $action,
                ':description' => $description,
                ':ip_address' => $ip_address,
                ':user_agent' => $user_agent
            ]);
        } catch (PDOException $e) {
            error_log("Failed to log admin action: " . $e->getMessage());
        }
    }

    public function getLogs($limit = 100) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM admin_logs 
                ORDER BY created_at DESC 
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Failed to fetch logs: " . $e->getMessage());
            return [];
        }
    }

    public function getStats() {
        try {
            $stats = [];

            // Total vehicles
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM vehicles");
            $stats['total_vehicles'] = $stmt->fetch()['count'];

            // Available vehicles
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM vehicles WHERE available = 1");
            $stats['available_vehicles'] = $stmt->fetch()['count'];

            // Total bookings
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM bookings");
            $stats['total_bookings'] = $stmt->fetch()['count'];

            // Pending bookings
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
            $stats['pending_bookings'] = $stmt->fetch()['count'];

            // Total revenue
            $stmt = $this->db->query("SELECT SUM(total_price) as total FROM bookings WHERE status IN ('confirmed', 'active', 'completed')");
            $result = $stmt->fetch();
            $stats['total_revenue'] = $result['total'] ?? 0;

            // Today's bookings
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = CURDATE()");
            $stats['today_bookings'] = $stmt->fetch()['count'];

            // This month's revenue
            $stmt = $this->db->query("
                SELECT SUM(total_price) as total 
                FROM bookings 
                WHERE status IN ('confirmed', 'active', 'completed') 
                AND MONTH(created_at) = MONTH(CURDATE()) 
                AND YEAR(created_at) = YEAR(CURDATE())
            ");
            $result = $stmt->fetch();
            $stats['month_revenue'] = $result['total'] ?? 0;

            return $stats;
        } catch (PDOException $e) {
            error_log("Failed to fetch stats: " . $e->getMessage());
            return [];
        }
    }
}

// Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    $auth = new AdminAuth();

    switch ($_POST['action']) {
        case 'login':
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            echo json_encode($auth->login($email, $password));
            exit;

        case 'logout':
            echo json_encode($auth->logout());
            exit;

        case 'get_logs':
            if (!$auth->isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            $limit = $_POST['limit'] ?? 100;
            echo json_encode(['success' => true, 'data' => $auth->getLogs($limit)]);
            exit;

        case 'get_stats':
            if (!$auth->isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            echo json_encode(['success' => true, 'data' => $auth->getStats()]);
            exit;
    }
}
?>

