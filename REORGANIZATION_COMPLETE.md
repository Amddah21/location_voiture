# Complete Project Reorganization Guide

## Final File Structure

```
rental_car/
├── frontend/
│   ├── components/
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── header.css
│   │   └── footer.css
│   ├── css/
│   │   ├── styles.css
│   │   └── admin-styles.css
│   ├── js/
│   │   ├── load-components.js
│   │   ├── main.js
│   │   ├── vehicle-details.js
│   │   └── currency.js
│   ├── images/
│   │   └── (all image files moved here)
│   ├── index.html (converted from index.php)
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
│   │   ├── connection.php (new)
│   │   ├── database.sql
│   │   ├── CREER_DATABASE_XAMPP.sql
│   │   ├── install_db.bat
│   │   └── install_db.sh
│   ├── controllers/
│   │   ├── backend.php
│   │   ├── upload_image.php
│   │   └── test_connection.php
│   ├── uploads/
│   │   └── (uploaded images)
│   ├── archives/
│   │   └── (duplicate/old files)
│   ├── admin_dashboard.php
│   └── admin_login.php
│
├── logo/
│   └── logo1.png
│
└── (documentation files remain in root)
```

## Key Changes Summary

1. **Frontend Structure**: All HTML, CSS, JS, and images consolidated under `/frontend`
2. **Backend Structure**: All PHP files organized under `/backend` with logical subdirectories
3. **Path Updates**: All references updated to work with new structure
4. **Component Loading**: Header/footer loaded dynamically via JavaScript
5. **Database Connection**: Centralized in `/backend/db/connection.php`

## Migration Steps

### Step 1: Move Files
See detailed file movements in sections below.

### Step 2: Update Database Configuration
Edit `/backend/db/connection.php` with your database credentials.

### Step 3: Test
Follow the smoke test plan at the end of this document.

## Files to Create/Update

See the following sections for complete file contents with updated paths.

