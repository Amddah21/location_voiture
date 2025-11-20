-- ============================================
-- Rentcars Database Schema
-- MySQL 5.7+ / MariaDB 10.2+
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS location_voiture
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE location_voiture;

-- ============================================
-- Table: vehicles
-- Stores all available rental vehicles
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Vehicle model name',
    type VARCHAR(50) NOT NULL COMMENT 'Vehicle category (Economy, Compact, Luxury, SUV, Convertible)',
    price_per_day DECIMAL(10, 2) NOT NULL COMMENT 'Daily rental price',
    image_url VARCHAR(500) COMMENT 'URL to vehicle image',
    passengers INT DEFAULT 4 COMMENT 'Number of passengers',
    transmission VARCHAR(20) DEFAULT 'Auto' COMMENT 'Transmission type (Auto, Manual)',
    air_conditioning BOOLEAN DEFAULT TRUE COMMENT 'Has air conditioning',
    doors INT DEFAULT 4 COMMENT 'Number of doors',
    rating DECIMAL(3, 1) DEFAULT 4.5 COMMENT 'Average rating (0-5)',
    review_count INT DEFAULT 0 COMMENT 'Number of reviews',
    available BOOLEAN DEFAULT TRUE COMMENT 'Is vehicle available for rent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    -- Indexes for performance
    INDEX idx_type (type),
    INDEX idx_available (available),
    INDEX idx_price (price_per_day),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores rental vehicle information';

-- ============================================
-- Table: bookings
-- Stores customer rental bookings
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT COMMENT 'Reference to vehicles table',
    customer_name VARCHAR(255) NOT NULL COMMENT 'Customer full name',
    customer_email VARCHAR(255) NOT NULL COMMENT 'Customer email address',
    customer_phone VARCHAR(50) COMMENT 'Customer phone number',
    pickup_location VARCHAR(255) NOT NULL COMMENT 'Pickup location address',
    pickup_date DATETIME NOT NULL COMMENT 'Pickup date and time',
    return_date DATETIME NOT NULL COMMENT 'Return date and time',
    total_price DECIMAL(10, 2) NOT NULL COMMENT 'Total booking price',
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'Booking status (pending, confirmed, active, completed, cancelled)',
    notes TEXT COMMENT 'Additional notes or special requests',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Booking creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    -- Foreign key constraint
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_customer_email (customer_email),
    INDEX idx_status (status),
    INDEX idx_pickup_date (pickup_date),
    INDEX idx_return_date (return_date),
    INDEX idx_dates (pickup_date, return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores customer rental bookings';

-- ============================================
-- Table: users (Optional - for future authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email (unique)',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    full_name VARCHAR(255) NOT NULL COMMENT 'User full name',
    phone VARCHAR(50) COMMENT 'User phone number',
    role VARCHAR(50) DEFAULT 'customer' COMMENT 'User role (admin, customer)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts for authentication';

-- ============================================
-- Insert Sample Vehicles
-- ============================================
INSERT INTO vehicles (name, type, price_per_day, image_url, passengers, transmission, air_conditioning, doors, rating, review_count, available) VALUES
('Jaguar XE L P250', 'Luxe', 1800.00, 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80', 4, 'Auto', TRUE, 4, 4.8, 2436, TRUE),
('Audi R8', 'Luxe', 2100.00, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80', 2, 'Auto', TRUE, 2, 4.6, 1936, TRUE),
('BMW M3 Competition', 'Luxe', 1600.00, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80', 4, 'Auto', TRUE, 4, 4.5, 2036, TRUE),
('Lamborghini Huracán', 'Luxe', 2300.00, 'https://images.unsplash.com/photo-1590868309235-32f32f5a1ef6?auto=format&fit=crop&w=800&q=80', 2, 'Auto', TRUE, 2, 4.3, 2236, TRUE),
('Mercedes-Benz C-Class', 'Luxe', 1200.00, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', 5, 'Auto', TRUE, 4, 4.7, 1850, TRUE),
('Porsche 911', 'Luxe', 2500.00, 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80', 2, 'Auto', TRUE, 2, 4.9, 3120, TRUE),
('Toyota Corolla', 'Économique', 450.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80', 5, 'Auto', TRUE, 4, 4.4, 5420, TRUE),
('Honda Civic', 'Compact', 550.00, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80', 5, 'Auto', TRUE, 4, 4.5, 4890, TRUE),
('Range Rover Sport', 'SUV', 1900.00, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 7, 'Auto', TRUE, 5, 4.6, 2150, TRUE),
('BMW 4 Series Convertible', 'Cabriolet', 1500.00, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80', 4, 'Auto', TRUE, 2, 4.5, 1890, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- Create Views for Common Queries
-- ============================================

-- View: Available vehicles with details
CREATE OR REPLACE VIEW v_available_vehicles AS
SELECT 
    v.*,
    CASE 
        WHEN v.rating >= 4.5 THEN 'Excellent'
        WHEN v.rating >= 4.0 THEN 'Très bon'
        WHEN v.rating >= 3.5 THEN 'Bon'
        ELSE 'Moyen'
    END AS rating_label
FROM vehicles v
WHERE v.available = TRUE
ORDER BY v.rating DESC, v.price_per_day ASC;

-- View: Booking summary with vehicle details
CREATE OR REPLACE VIEW v_booking_summary AS
SELECT 
    b.id AS booking_id,
    b.customer_name,
    b.customer_email,
    b.pickup_location,
    b.pickup_date,
    b.return_date,
    b.total_price,
    b.status,
    b.created_at AS booking_date,
    v.name AS vehicle_name,
    v.type AS vehicle_type,
    v.image_url AS vehicle_image,
    DATEDIFF(b.return_date, b.pickup_date) AS rental_days
FROM bookings b
LEFT JOIN vehicles v ON b.vehicle_id = v.id
ORDER BY b.created_at DESC;

-- ============================================
-- Stored Procedures (Optional)
-- ============================================

DELIMITER //

-- Procedure: Check vehicle availability
CREATE PROCEDURE IF NOT EXISTS sp_check_availability(
    IN p_vehicle_id INT,
    IN p_pickup_date DATETIME,
    IN p_return_date DATETIME
)
BEGIN
    SELECT 
        v.*,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM bookings b
                WHERE b.vehicle_id = p_vehicle_id
                AND b.status IN ('pending', 'confirmed', 'active')
                AND (
                    (b.pickup_date <= p_return_date AND b.return_date >= p_pickup_date)
                )
            ) THEN FALSE
            ELSE TRUE
        END AS is_available
    FROM vehicles v
    WHERE v.id = p_vehicle_id;
END //

-- Procedure: Get booking statistics
CREATE PROCEDURE IF NOT EXISTS sp_booking_stats(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        COUNT(*) AS total_bookings,
        SUM(total_price) AS total_revenue,
        AVG(total_price) AS avg_booking_value,
        COUNT(DISTINCT customer_email) AS unique_customers,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_bookings
    FROM bookings
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date;
END //

DELIMITER ;

-- ============================================
-- Sample Data: Test Bookings (Optional)
-- ============================================
-- Uncomment to insert sample bookings for testing

/*
INSERT INTO bookings (vehicle_id, customer_name, customer_email, customer_phone, pickup_location, pickup_date, return_date, total_price, status) VALUES
(1, 'Jean Dupont', 'jean.dupont@example.com', '+33 6 12 34 56 78', 'Aéroport Charles de Gaulle', '2024-03-15 09:00:00', '2024-03-20 17:00:00', 9000.00, 'confirmed'),
(2, 'Marie Martin', 'marie.martin@example.com', '+33 6 98 76 54 32', 'Gare du Nord, Paris', '2024-03-18 10:00:00', '2024-03-22 18:00:00', 8400.00, 'pending');
*/

-- ============================================
-- Database Setup Complete
-- ============================================
-- To verify the setup, run:
-- SELECT COUNT(*) FROM vehicles;
-- SELECT COUNT(*) FROM bookings;
-- SHOW TABLES;

