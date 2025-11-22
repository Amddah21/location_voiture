# Cars Location voiture - Car Rental Management System

A complete car rental management system built with PHP, MySQL, HTML, CSS, and JavaScript. This system includes both a public-facing website for customers and a comprehensive admin dashboard for managing vehicles, bookings, clients, and more.

**Cars Location voiture** is a premium car rental platform with advanced features including brand management, automatic logo rotation animations, booking notifications, and a modern responsive design.

## Features

### Public Website
- 🚗 Vehicle browsing and search
- 📅 Booking system with date selection
- 💰 Multi-currency support (MAD/EUR)
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔍 Advanced search filters with brand selection
- 📄 Vehicle details pages with image galleries
- 🎨 Premium animations and modern UI design
- 🏷️ Brand logo carousel with automatic rotation
- ⚡ Smooth animations and hover effects
- 🎯 Click on brand logos to filter vehicles automatically

### Admin Dashboard
- 📊 Dashboard with real-time statistics
- 🚙 Vehicle management (CRUD operations)
- 📋 Booking management with status updates
- 🔔 Notification system for pending bookings
- 👥 Client management
- 📝 Activity logs tracking
- 📞 Contact management
- 🏷️ Car brand logo management with file upload
- ⚙️ Admin user management
- 🔐 Password change functionality
- 📅 Vehicle availability dates management
- 📸 Image upload for vehicles and brands

## Technology Stack

- **Backend**: PHP 7.4+, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: MySQL/MariaDB
- **Server**: XAMPP (Apache, MySQL, PHP)

## Requirements

- XAMPP (or similar LAMP/WAMP stack)
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Modern web browser

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cars-location-voiture.git
cd cars-location-voiture
```

### 2. Setup XAMPP
1. Install XAMPP from https://www.apachefriends.org/
2. Start Apache and MySQL services in XAMPP Control Panel

### 3. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. The database will be created automatically when you first access the application
3. Or manually create database: `location_voiture`

### 4. Configuration
1. Copy the project to `C:\xampp\htdocs\location_voiture\` (or your XAMPP htdocs directory)
2. Update database credentials in `index.php` and `backend.php` if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'location_voiture');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

### 5. Access the Application
- **Public Website**: http://localhost/location_voiture/
- **Admin Dashboard**: http://localhost/location_voiture/admin_login.php
  - Default credentials:
    - Email: `admin@rentcars.com`
    - Password: `admin123`

## Project Structure

```
location_voiture/
├── backend.php              # Main API endpoint
├── admin_dashboard.php      # Admin panel
├── admin_login.php          # Admin login page
├── index.php                # Public homepage
├── backend/                 # Backend files
│   ├── db/                  # Database connection
│   └── uploads/             # Uploaded images
├── script/                  # JavaScript files
│   ├── script.js            # Main frontend JS
│   ├── admin_dashboard.js   # Admin panel JS
│   ├── vehicle-details.js   # Vehicle details JS
│   └── load-components.js   # Component loader
├── components/              # HTML components
│   ├── header/              # Header component
│   └── footer/              # Footer component
├── images/                  # Images
│   ├── logos/               # Brand logos
│   └── vehicles/            # Vehicle images
├── logo/                    # Main logo
├── styles.css               # Main stylesheet
├── admin_styles.css         # Admin dashboard styles
└── upload_brand_logo.php    # Brand logo upload handler
```

## Features in Detail

### Vehicle Management
- Add, edit, delete vehicles
- Set availability dates (available_from, available_to)
- Upload multiple vehicle images
- Manage pricing in MAD with EUR conversion
- Set vehicle specifications (passengers, transmission, doors, AC, etc.)
- Vehicle availability status

### Booking System
- Customer booking interface with date selection
- Admin booking management with status updates (pending, confirmed, active, completed, cancelled)
- Real-time booking notifications
- Booking status tracking and filtering
- Automatic price calculation based on rental days
- Client creation/update on booking

### Brand Management
- Add/Edit/Delete car brands (Mercedes, Audi, BMW, etc.)
- Upload brand logos (PNG, JPG, SVG, WebP, GIF)
- Automatic logo rotation animation on homepage
- Click on brand logo to filter vehicles by brand
- Display order management
- Active/Inactive brand status

### Admin Features
- User authentication
- Admin user management
- Password change
- Activity logging
- Statistics dashboard

## Default Currency

The system uses **Moroccan Dirham (MAD/DH)** as the default currency. Currency conversion to EUR is available on the frontend.

## Security Features

- Password hashing (bcrypt)
- SQL injection prevention (PDO prepared statements)
- XSS protection (HTML escaping)
- Session management
- Admin authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Author

Developed for car rental management.

---

**Note**: Remember to change default admin credentials after first login!

