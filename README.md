# Rentcars - Car Rental Management System

A complete car rental management system built with PHP, MySQL, HTML, CSS, and JavaScript. This system includes both a public-facing website for customers and a comprehensive admin dashboard for managing vehicles, bookings, clients, and more.

## Features

### Public Website
- 🚗 Vehicle browsing and search
- 📅 Booking system with date selection
- 💰 Multi-currency support (MAD/EUR)
- 📱 Responsive design
- 🔍 Advanced search filters
- 📄 Vehicle details pages

### Admin Dashboard
- 📊 Dashboard with statistics
- 🚙 Vehicle management (CRUD operations)
- 📋 Booking management
- 👥 Client management
- 📝 Activity logs
- 📞 Contact management
- ⚙️ Admin user management
- 🔐 Password change functionality
- 📅 Vehicle availability dates

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
git clone https://github.com/yourusername/rental_car.git
cd rental_car
```

### 2. Setup XAMPP
1. Install XAMPP from https://www.apachefriends.org/
2. Start Apache and MySQL services in XAMPP Control Panel

### 3. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. The database will be created automatically when you first access the application
3. Or manually create database: `location_voiture`

### 4. Configuration
1. Copy the project to `C:\xampp\htdocs\rental_car\` (or your XAMPP htdocs directory)
2. Update database credentials in `backend.php` if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'location_voiture');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

### 5. Access the Application
- **Public Website**: http://localhost/rental_car/
- **Admin Dashboard**: http://localhost/rental_car/admin_login.php
  - Default credentials:
    - Email: `admin@rentcars.com`
    - Password: `admin123`

## Project Structure

```
rental_car/
├── backend.php              # Main API endpoint
├── admin_dashboard.php      # Admin panel
├── admin_login.php          # Admin login page
├── index.php                 # Public homepage
├── backend/                  # Backend files
│   ├── auth/                # Authentication files
│   ├── db/                  # Database connection
│   └── uploads/             # Uploaded images
├── frontend/                 # Frontend assets
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   ├── components/          # Reusable components
│   └── images/              # Images
├── script/                  # JavaScript files
├── components/              # HTML components
└── images/                  # Vehicle images
```

## Features in Detail

### Vehicle Management
- Add, edit, delete vehicles
- Set availability dates
- Upload vehicle images
- Manage pricing in MAD
- Set vehicle specifications (passengers, transmission, etc.)

### Booking System
- Customer booking interface
- Admin booking management
- Booking status tracking
- Automatic price calculation

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

