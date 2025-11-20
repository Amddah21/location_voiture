# Migration Instructions - Complete Project Reorganization

## ✅ Completed Files

The following files have been created in the new structure with updated paths:

### Frontend Structure Created:
- ✅ `frontend/components/header.html`
- ✅ `frontend/components/header.css`
- ✅ `frontend/components/footer.html`
- ✅ `frontend/components/footer.css`
- ✅ `frontend/js/load-components.js` (updated paths)
- ✅ `frontend/js/script.js` (API path: `../backend/backend.php`)
- ✅ `frontend/js/vehicle-details.js` (API path: `../backend/backend.php`)
- ✅ `frontend/index.html` (all paths updated)
- ✅ `frontend/about.html` (all paths updated)
- ✅ `frontend/contact.html` (all paths updated)
- ✅ `frontend/vehicle-details.html` (all paths updated)

## 📋 Remaining Tasks

### 1. Move CSS Files
```bash
# Move CSS files to frontend/css/
mv styles.css frontend/css/styles.css
mv admin_styles.css frontend/css/admin_styles.css
mv vehicle-details.css frontend/css/vehicle-details.css
```

### 2. Move JavaScript Files
```bash
# Admin dashboard JS (needs path updates)
mv script/admin_dashboard.js frontend/js/admin_dashboard.js
```

### 3. Move Images
```bash
# Move all images
mv images/* frontend/images/
```

### 4. Move PHP Files to Backend
```bash
# Create backend structure
mkdir -p backend/auth
mkdir -p backend/db
mkdir -p backend/controllers
mkdir -p backend/uploads

# Move PHP files
mv admin_auth.php backend/auth/
mv admin_login.php backend/auth/
mv backend.php backend/controllers/backend.php
mv admin_dashboard.php backend/
mv upload_image.php backend/
mv test_connection.php backend/
mv index.php backend/

# Move database files
mv components/header/base_donnes/* backend/db/
mv install_db.bat backend/db/
mv install_db.sh backend/db/
```

### 5. Update PHP File Paths

#### backend/controllers/backend.php
- Update image upload path: `../uploads/` or `uploads/`
- Update any include/require paths

#### backend/auth/admin_auth.php
- Update paths to `../controllers/backend.php` if needed
- Update session paths

#### backend/auth/admin_login.php
- Update paths to `../auth/admin_auth.php`
- Update redirect paths

#### backend/admin_dashboard.php
- Update JS path: `../frontend/js/admin_dashboard.js` or `js/admin_dashboard.js`
- Update CSS path: `../frontend/css/admin_styles.css` or `css/admin_styles.css`
- Update any image paths

#### backend/upload_image.php
- Update upload directory: `uploads/` or `../uploads/`

### 6. Update admin_dashboard.js

In `frontend/js/admin_dashboard.js`, update:
- API calls: `../backend/controllers/backend.php` or `backend.php` (if accessed from backend/)
- Image upload: `../backend/upload_image.php` or `upload_image.php`

**Note:** Since `admin_dashboard.php` is in `backend/`, the JS file should use relative paths from there:
- If JS is in `frontend/js/`, use: `../backend/controllers/backend.php`
- If JS is loaded from `backend/admin_dashboard.php`, use: `controllers/backend.php`

### 7. Update Image References

All image paths in HTML should be relative to `frontend/`:
- `images/logo.png` ✅ (already correct)
- `images/carhero.png` ✅ (already correct)

### 8. Update Database Connection Paths

In `backend/controllers/backend.php`:
- Ensure database connection uses correct paths
- Update image storage path to `../uploads/` or absolute path

## 🔧 Path Reference Guide

### From Frontend HTML to Backend:
- API: `../backend/controllers/backend.php`
- Or: `../backend/backend.php` (if backend.php is in backend root)

### From Backend PHP to Frontend:
- JS: `../frontend/js/admin_dashboard.js`
- CSS: `../frontend/css/admin_styles.css`
- Images: `../frontend/images/`

### From Frontend JS to Components:
- Header: `components/header.html`
- Footer: `components/footer.html`
- CSS: `components/header.css`, `components/footer.css`

### From Frontend JS to Backend:
- API: `../backend/controllers/backend.php`

## 🧪 Testing Checklist

After migration, test:

1. ✅ Frontend pages load correctly
2. ✅ Header and footer load dynamically
3. ✅ Images display correctly
4. ✅ API calls work (vehicles, bookings, contacts)
5. ✅ Admin login works
6. ✅ Admin dashboard loads
7. ✅ Image uploads work
8. ✅ All forms submit correctly
9. ✅ Navigation links work
10. ✅ Mobile menu works

## 📝 Important Notes

1. **XAMPP Configuration**: Ensure your XAMPP document root points to the project root, or update all paths accordingly.

2. **Backend Access**: The backend can be accessed via:
   - `http://localhost/rental_car/backend/admin_dashboard.php`
   - `http://localhost/rental_car/backend/auth/admin_login.php`

3. **Frontend Access**: The frontend can be accessed via:
   - `http://localhost/rental_car/frontend/index.html`
   - Or set `frontend/` as document root

4. **API Endpoints**: All API calls should go to:
   - `http://localhost/rental_car/backend/controllers/backend.php`

## 🚀 Quick Start After Migration

1. Move all files according to instructions above
2. Update PHP file paths (especially includes/requires)
3. Update `admin_dashboard.js` API paths
4. Test all functionality
5. Update `.htaccess` if needed for URL rewriting

## ⚠️ Backup First!

**IMPORTANT:** Before moving files, create a backup of your entire project!

```bash
cp -r rental_car rental_car_backup
```

