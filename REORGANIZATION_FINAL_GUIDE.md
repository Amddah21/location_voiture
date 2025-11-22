# Complete Project Reorganization - Final Guide

## ✅ Completed Steps

The following files have been created in the new structure:

### Frontend Components
- ✅ `frontend/components/header.html` - Updated with new paths
- ✅ `frontend/components/footer.html` - Updated with new paths  
- ✅ `frontend/components/header.css` - Copied
- ✅ `frontend/components/footer.css` - Copied

### Frontend JavaScript
- ✅ `frontend/js/load-components.js` - Updated for new structure
- ✅ `frontend/js/main.js` - Consolidated from script.js
- ✅ `frontend/js/currency.js` - Copied
- ✅ `frontend/js/vehicle-details.js` - Copied

### Frontend CSS
- ✅ `frontend/css/styles.css` - Copied (main styles)

### Backend
- ✅ `backend/db/connection.php` - New centralized database connection

## 📋 Remaining Tasks

### 1. Move Backend Files

```powershell
# Move PHP files to backend/controllers
Move-Item backend.php backend/controllers/backend.php
Move-Item upload_image.php backend/controllers/upload_image.php
Move-Item test_connection.php backend/controllers/test_connection.php

# Move auth files
Move-Item admin_auth.php backend/auth/admin_auth.php
Move-Item client_auth.php backend/auth/client_auth.php

# Move admin files
Move-Item admin_dashboard.php backend/admin_dashboard.php
Move-Item admin_login.php backend/admin_login.php

# Move database scripts
Move-Item install_db.bat backend/db/install_db.bat
Move-Item install_db.sh backend/db/install_db.sh
Move-Item components/header/base_donnes/*.sql backend/db/
```

### 2. Move Frontend HTML Files

```powershell
# Move HTML files to frontend
Move-Item index.html frontend/index.html
Move-Item about.html frontend/about.html
Move-Item contact.html frontend/contact.html
Move-Item vehicle-details.html frontend/vehicle-details.html
Move-Item client-dashboard.html frontend/client-dashboard.html
Move-Item client-login.html frontend/client-login.html
Move-Item client-signup.html frontend/client-signup.html
Move-Item booking-confirmation.html frontend/booking-confirmation.html
```

### 3. Move Images

```powershell
# Move images to frontend/images
Move-Item images/* frontend/images/
```

### 4. Update backend.php to Use connection.php

Edit `backend/controllers/backend.php`:

**Replace lines 32-37:**
```php
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
```

**With:**
```php
// Use centralized database connection
require_once __DIR__ . '/../db/connection.php';
```

**And update the RentcarsAPI constructor (around line 60):**
```php
public function __construct() {
    $this->db = Database::getInstance()->getConnection();
    $this->initDatabase();
}
```

### 5. Update All HTML Files

For each HTML file in `frontend/`, update:

**CSS Links:**
```html
<!-- OLD -->
<link rel="stylesheet" href="styles.css">

<!-- NEW -->
<link rel="stylesheet" href="css/styles.css">
```

**JavaScript Links:**
```html
<!-- OLD -->
<script src="script/currency.js"></script>
<script src="script/load-components.js"></script>
<script src="script/script.js"></script>

<!-- NEW -->
<script src="js/currency.js" defer></script>
<script src="js/load-components.js" defer></script>
<script src="js/main.js" defer></script>
```

**Image Paths:**
```html
<!-- OLD -->
<img src="images/carhero.png">

<!-- NEW -->
<img src="images/carhero.png" loading="lazy" decoding="async">
```

**API Calls in JavaScript:**
```javascript
// OLD
const API_BASE = 'backend.php';

// NEW  
const API_BASE = '/rental_car/backend/controllers/backend.php';
```

### 6. Update vehicle-details.js

Edit `frontend/js/vehicle-details.js`:

**Line 7:**
```javascript
// OLD
const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'backend.php';

// NEW
const API_BASE = '/rental_car/backend/controllers/backend.php';
```

### 7. Update PHP Files That Include Other PHP Files

For `admin_dashboard.php`, `admin_login.php`, etc., update includes:

```php
// OLD
require_once 'backend.php';

// NEW
require_once __DIR__ . '/controllers/backend.php';
```

### 8. Create index.html from index.php

Convert `index.php` to `frontend/index.html`:

1. Remove PHP code for stats (or use JavaScript to fetch)
2. Update all paths
3. Use component loading for header/footer

### 9. Move Duplicate Files to Archives

```powershell
# Move old frontend folder contents to archives
Move-Item frontend/about.html backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/contact.html backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/index.html backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/vehicle-details.html backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/components/* backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/js/* backend/archives/ -ErrorAction SilentlyContinue
Move-Item frontend/css/* backend/archives/ -ErrorAction SilentlyContinue

# Move old script folder
Move-Item script backend/archives/script_old -ErrorAction SilentlyContinue

# Move old components folder
Move-Item components backend/archives/components_old -ErrorAction SilentlyContinue
```

## 🧪 Smoke Test Plan

### Test 1: Homepage
1. Navigate to: `http://localhost/rental_car/frontend/index.html`
2. Expected: Page loads, header/footer appear, vehicles display

### Test 2: Component Loading
1. Check browser console for errors
2. Verify header logo loads
3. Verify footer contacts load dynamically

### Test 3: API Endpoints
1. Test: `http://localhost/rental_car/backend/controllers/backend.php?action=vehicles`
2. Expected: JSON response with vehicles array

### Test 4: Admin Login
1. Navigate to: `http://localhost/rental_car/backend/admin_login.php`
2. Expected: Login form loads, can submit to backend/auth/admin_auth.php

### Test 5: Vehicle Details
1. Click a vehicle card
2. Navigate to: `http://localhost/rental_car/frontend/vehicle-details.html?id=1`
3. Expected: Vehicle details load correctly

## 📝 Manual Configuration Steps

1. **Update Database Credentials**
   - Edit `backend/db/connection.php`
   - Update DB_HOST, DB_NAME, DB_USER, DB_PASS if needed

2. **Set Upload Directory Permissions**
   - Ensure `backend/uploads/` is writable by web server

3. **Update .htaccess (if using Apache)**
   - May need to add rewrite rules for new paths

4. **Test All Pages**
   - Go through each page and verify functionality
   - Check browser console for 404 errors
   - Verify all images load

## 🗂️ Final File Structure

```
rental_car/
├── frontend/
│   ├── components/
│   │   ├── header.html ✅
│   │   ├── footer.html ✅
│   │   ├── header.css ✅
│   │   └── footer.css ✅
│   ├── css/
│   │   └── styles.css ✅
│   ├── js/
│   │   ├── load-components.js ✅
│   │   ├── main.js ✅
│   │   ├── currency.js ✅
│   │   └── vehicle-details.js ✅
│   ├── images/
│   │   └── (all images)
│   ├── index.html (needs conversion from index.php)
│   ├── about.html
│   ├── contact.html
│   ├── vehicle-details.html
│   ├── client-dashboard.html
│   ├── client-login.html
│   ├── client-signup.html
│   └── booking-confirmation.html
│
├── backend/
│   ├── auth/
│   │   ├── admin_auth.php
│   │   └── client_auth.php
│   ├── db/
│   │   ├── connection.php ✅
│   │   ├── database.sql
│   │   ├── install_db.bat
│   │   └── install_db.sh
│   ├── controllers/
│   │   ├── backend.php (needs update)
│   │   ├── upload_image.php
│   │   └── test_connection.php
│   ├── uploads/
│   ├── archives/
│   ├── admin_dashboard.php
│   └── admin_login.php
│
└── logo/
    └── logo1.png
```

## ⚠️ Important Notes

1. **Path Updates**: All paths now use absolute paths from project root (`/rental_car/...`)
2. **Component Loading**: Header/footer are loaded dynamically via JavaScript
3. **Database Connection**: Centralized in `backend/db/connection.php`
4. **API Base URL**: Updated to `/rental_car/backend/controllers/backend.php`

## 🔄 Next Steps After Reorganization

1. Test all functionality
2. Update any hardcoded paths in PHP files
3. Verify image uploads work with new paths
4. Check admin dashboard loads correctly
5. Test booking flow end-to-end

---

**Status**: Core structure created. Remaining: Move files, update paths in HTML/PHP, test.

