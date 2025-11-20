# Project Reorganization Guide

## New Folder Structure

```
rental_car/
├── frontend/
│   ├── components/
│   │   ├── header.html
│   │   ├── header.css
│   │   ├── footer.html
│   │   └── footer.css
│   ├── css/
│   │   ├── styles.css
│   │   ├── admin_styles.css
│   │   └── vehicle-details.css
│   ├── js/
│   │   ├── load-components.js
│   │   ├── script.js
│   │   ├── vehicle-details.js
│   │   └── admin_dashboard.js
│   ├── images/
│   │   └── (all image files)
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   └── vehicle-details.html
│
├── backend/
│   ├── auth/
│   │   ├── admin_auth.php
│   │   └── admin_login.php
│   ├── db/
│   │   ├── database.sql
│   │   ├── CREER_DATABASE_XAMPP.sql
│   │   ├── install_db.bat
│   │   └── install_db.sh
│   ├── controllers/
│   │   └── backend.php
│   ├── uploads/
│   │   └── (uploaded images)
│   ├── admin_dashboard.php
│   ├── test_connection.php
│   ├── upload_image.php
│   └── index.php
│
└── (root documentation files)
```

## Path Updates Summary

### Frontend Files

#### HTML Files
- **CSS imports**: `css/styles.css`, `css/vehicle-details.css`
- **JS imports**: `js/load-components.js`, `js/script.js`, `js/vehicle-details.js`
- **Images**: `images/logo.png`, `images/carhero.png`, etc.
- **Backend API**: `../backend/backend.php`

#### JavaScript Files
- **API calls**: `../backend/backend.php?action=...`
- **Component loading**: `components/header.html`, `components/footer.html`
- **CSS loading**: `components/header.css`, `components/footer.css`

### Backend Files

#### PHP Files
- **Includes/Requires**: Update relative paths based on new location
- **Image uploads**: `uploads/` directory
- **Database config**: `db/` directory

## Migration Steps

1. **Create folder structure** (already done)
2. **Move files to new locations**
3. **Update all paths in files**
4. **Test all functionality**

## Key Path Changes

### From Root to Frontend:
- `styles.css` → `frontend/css/styles.css`
- `script.js` → `frontend/js/script.js`
- `images/` → `frontend/images/`
- `components/` → `frontend/components/`

### From Root to Backend:
- `backend.php` → `backend/controllers/backend.php`
- `admin_auth.php` → `backend/auth/admin_auth.php`
- `admin_login.php` → `backend/auth/admin_login.php`
- `admin_dashboard.php` → `backend/admin_dashboard.php`
- `upload_image.php` → `backend/upload_image.php`

## Important Notes

- All frontend pages access backend via: `../backend/backend.php`
- Component loader uses: `components/header.html` (relative to frontend/)
- Image paths in HTML: `images/logo.png` (relative to frontend/)
- Admin dashboard JS: `../js/admin_dashboard.js` (from backend/)

