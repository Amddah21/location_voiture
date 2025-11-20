<?php
/**
 * Client Authentication Handler
 * Handles login, logout, and session management for clients
 */

session_start();

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

class ClientAuth {
    private $db;

    public function __construct() {
        $this->connectDB();
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

    public function register($name, $phone, $email, $password) {
        try {
            // Validate required fields
            if (empty($name) || empty($phone) || empty($password)) {
                return ['success' => false, 'message' => 'Tous les champs obligatoires doivent être remplis'];
            }

            // Validate password length
            if (strlen($password) < 6) {
                return ['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères'];
            }

            // Check if phone already exists
            $stmt = $this->db->prepare("SELECT id FROM clients WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Ce numéro de téléphone est déjà utilisé'];
            }

            // Check if email already exists (if provided)
            if (!empty($email)) {
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE email = :email");
                $stmt->execute([':email' => $email]);
                if ($stmt->fetch()) {
                    return ['success' => false, 'message' => 'Cet email est déjà utilisé'];
                }
            }

            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // Insert new client
            $stmt = $this->db->prepare("
                INSERT INTO clients (name, phone, email, password_hash, created_at)
                VALUES (:name, :phone, :email, :password_hash, NOW())
            ");

            $stmt->execute([
                ':name' => $name,
                ':phone' => $phone,
                ':email' => $email ?: null,
                ':password_hash' => $passwordHash
            ]);

            $clientId = $this->db->lastInsertId();

            // Log registration action
            $this->logAction(
                $clientId,
                $phone,
                'register',
                'Client account created'
            );

            return [
                'success' => true,
                'message' => 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
                'client_id' => $clientId
            ];
        } catch (PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de la création du compte: ' . $e->getMessage()];
        }
    }

    public function login($identifier, $password) {
        try {
            // Determine if identifier is email or phone
            $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);
            
            // Try with is_active first, fallback to simple query if column doesn't exist
            try {
                if ($isEmail) {
                    $stmt = $this->db->prepare("SELECT * FROM clients WHERE email = :identifier AND (is_active = TRUE OR is_active IS NULL)");
                } else {
                    $stmt = $this->db->prepare("SELECT * FROM clients WHERE phone = :identifier AND (is_active = TRUE OR is_active IS NULL)");
                }
                $stmt->execute([':identifier' => $identifier]);
            } catch (PDOException $e) {
                // Column doesn't exist, use simple query
                if ($isEmail) {
                    $stmt = $this->db->prepare("SELECT * FROM clients WHERE email = :identifier");
                } else {
                    $stmt = $this->db->prepare("SELECT * FROM clients WHERE phone = :identifier");
                }
                $stmt->execute([':identifier' => $identifier]);
            }
            
            $client = $stmt->fetch();

            if ($client && password_verify($password, $client['password_hash'])) {
                // Update last login date (if column exists)
                try {
                    $updateStmt = $this->db->prepare("UPDATE clients SET last_login_date = NOW() WHERE id = :id");
                    $updateStmt->execute([':id' => $client['id']]);
                } catch (PDOException $e) {
                    // Column might not exist yet, ignore error
                    error_log("Could not update last_login_date: " . $e->getMessage());
                }

                $_SESSION['client_id'] = $client['id'];
                $_SESSION['client_name'] = $client['name'];
                $_SESSION['client_phone'] = $client['phone'];
                $_SESSION['client_email'] = $client['email'];
                $_SESSION['client_logged_in'] = true;
                $_SESSION['client_session_id'] = session_id();

                // Log login action
                $this->logAction(
                    $client['id'],
                    $client['phone'],
                    'login',
                    'Client logged in successfully'
                );

                return ['success' => true, 'message' => 'Login successful', 'client' => [
                    'id' => $client['id'],
                    'name' => $client['name'],
                    'phone' => $client['phone'],
                    'email' => $client['email']
                ]];
            } else {
                return ['success' => false, 'message' => 'Email/Numéro de téléphone ou mot de passe incorrect'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()];
        }
    }

    public function logout() {
        if (isset($_SESSION['client_id'])) {
            // Log logout action
            $this->logAction(
                $_SESSION['client_id'],
                $_SESSION['client_phone'] ?? '',
                'logout',
                'Client logged out'
            );
        }
        session_destroy();
        return ['success' => true, 'message' => 'Déconnexion réussie'];
    }

    public function isLoggedIn() {
        return isset($_SESSION['client_logged_in']) && $_SESSION['client_logged_in'] === true;
    }

    public function requireLogin() {
        if (!$this->isLoggedIn()) {
            header('Location: client-login.html');
            exit;
        }
    }

    public function getCurrentClient() {
        if ($this->isLoggedIn()) {
            return [
                'id' => $_SESSION['client_id'],
                'name' => $_SESSION['client_name'],
                'phone' => $_SESSION['client_phone'],
                'email' => $_SESSION['client_email']
            ];
        }
        return null;
    }

    public function getClientBookings($client_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT b.*, v.name as vehicle_name, v.image_url as vehicle_image 
                FROM bookings b 
                LEFT JOIN vehicles v ON b.vehicle_id = v.id 
                WHERE b.customer_phone = (
                    SELECT phone FROM clients WHERE id = :client_id
                )
                ORDER BY b.created_at DESC
            ");
            $stmt->execute([':client_id' => $client_id]);
            $bookings = $stmt->fetchAll();

            // Log action
            if (isset($_SESSION['client_id'])) {
                $this->logAction(
                    $client_id,
                    $_SESSION['client_phone'] ?? '',
                    'bookings_viewed',
                    'Client viewed bookings list'
                );
            }

            return $bookings;
        } catch (PDOException $e) {
            error_log("Failed to fetch client bookings: " . $e->getMessage());
            return [];
        }
    }

    public function logAction($client_id, $client_phone, $action, $description = '', $metadata = null) {
        try {
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $session_id = $_SESSION['client_session_id'] ?? session_id();

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

    public function getClientLogs($client_id, $limit = 100) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM client_logs 
                WHERE client_id = :client_id 
                ORDER BY created_at DESC 
                LIMIT :limit
            ");
            $stmt->bindValue(':client_id', $client_id, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Failed to fetch client logs: " . $e->getMessage());
            return [];
        }
    }
}

// Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    $auth = new ClientAuth();

    switch ($_POST['action']) {
        case 'register':
            $name = $_POST['name'] ?? '';
            $phone = $_POST['phone'] ?? '';
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            echo json_encode($auth->register($name, $phone, $email, $password));
            exit;

        case 'login':
            $identifier = $_POST['identifier'] ?? $_POST['phone'] ?? $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            echo json_encode($auth->login($identifier, $password));
            exit;

        case 'logout':
            echo json_encode($auth->logout());
            exit;

        case 'get_bookings':
            if (!$auth->isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            $client = $auth->getCurrentClient();
            $bookings = $auth->getClientBookings($client['id']);
            echo json_encode(['success' => true, 'data' => $bookings]);
            exit;

        case 'get_client_info':
            if (!$auth->isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            echo json_encode(['success' => true, 'data' => $auth->getCurrentClient()]);
            exit;

        case 'get_client_logs':
            if (!$auth->isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            $client = $auth->getCurrentClient();
            $limit = $_POST['limit'] ?? 100;
            $logs = $auth->getClientLogs($client['id'], $limit);
            echo json_encode(['success' => true, 'data' => $logs]);
            exit;
    }
}
?>

