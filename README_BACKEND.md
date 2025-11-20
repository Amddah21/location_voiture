# Rentcars PHP Backend Setup Guide

## Requirements

- PHP 7.4 or higher
- MySQL/MariaDB database server
- PDO extension enabled
- Web server (Apache/Nginx) or PHP built-in server

## Database Configuration

1. **Update database credentials** in `backend.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'rentals_db');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

2. **The database and tables will be created automatically** on first API call.

## Quick Start

### Option 1: PHP Built-in Server
```bash
php -S localhost:8000
```
Then open `http://localhost:8000/index.html` in your browser.

### Option 2: Apache/Nginx
- Place files in your web server's document root
- Ensure mod_rewrite is enabled (if using .htaccess)
- Access via your configured domain

## API Endpoints

### Vehicles
- `GET /backend.php/vehicles` - List all vehicles
- `GET /backend.php/vehicles/{id}` - Get vehicle by ID
- `GET /backend.php/search?location=...&pickup_date=...&return_date=...&vehicle_type=...` - Search vehicles
- `POST /backend.php/vehicles` - Create vehicle (admin)
- `PUT /backend.php/vehicles/{id}` - Update vehicle (admin)
- `DELETE /backend.php/vehicles/{id}` - Delete vehicle (admin)

### Bookings
- `GET /backend.php/bookings` - List bookings (optionally filter by ?email=...)
- `GET /backend.php/bookings/{id}` - Get booking by ID
- `POST /backend.php/bookings` - Create new booking
- `PUT /backend.php/bookings/{id}` - Update booking
- `DELETE /backend.php/bookings/{id}` - Cancel booking

## Example API Usage

### Search for vehicles:
```javascript
fetch('backend.php/search?location=New York&pickup_date=2024-03-15&return_date=2024-03-20&vehicle_type=Luxury')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Create a booking:
```javascript
fetch('backend.php/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicle_id: 1,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1234567890',
    pickup_location: 'New York Airport',
    pickup_date: '2024-03-15 09:00:00',
    return_date: '2024-03-20 17:00:00'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## Database Schema

### Vehicles Table
- `id` (INT, Primary Key)
- `name` (VARCHAR)
- `type` (VARCHAR)
- `price_per_day` (DECIMAL)
- `image_url` (VARCHAR)
- `passengers` (INT)
- `transmission` (VARCHAR)
- `air_conditioning` (BOOLEAN)
- `doors` (INT)
- `rating` (DECIMAL)
- `review_count` (INT)
- `available` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Bookings Table
- `id` (INT, Primary Key)
- `vehicle_id` (INT, Foreign Key)
- `customer_name` (VARCHAR)
- `customer_email` (VARCHAR)
- `customer_phone` (VARCHAR)
- `pickup_location` (VARCHAR)
- `pickup_date` (DATETIME)
- `return_date` (DATETIME)
- `total_price` (DECIMAL)
- `status` (VARCHAR) - pending, confirmed, active, completed, cancelled
- `created_at` (TIMESTAMP)

## Features

- ✅ Automatic database initialization
- ✅ Sample vehicle data seeding
- ✅ Vehicle availability checking
- ✅ Booking conflict detection
- ✅ RESTful API design
- ✅ CORS support
- ✅ JSON responses
- ✅ Error handling

## Troubleshooting

**Database connection error:**
- Verify MySQL is running
- Check credentials in `backend.php`
- Ensure PDO extension is enabled

**Tables not created:**
- Check database user has CREATE privileges
- Review PHP error logs

**API returns 404:**
- Verify URL routing (ensure `backend.php` is in the correct path)
- Check web server configuration

## Security Notes

⚠️ **For production use:**
- Add authentication/authorization
- Implement rate limiting
- Use prepared statements (already implemented)
- Add input validation
- Enable HTTPS
- Sanitize file uploads
- Add CSRF protection

