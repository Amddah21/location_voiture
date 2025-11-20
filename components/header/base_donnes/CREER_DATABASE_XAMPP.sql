-- Script SQL simplifié pour XAMPP/phpMyAdmin
-- Copiez-collez ce script dans phpMyAdmin > SQL

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS location_voiture
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE location_voiture;

-- Table: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    passengers INT DEFAULT 4,
    transmission VARCHAR(20) DEFAULT 'Auto',
    air_conditioning BOOLEAN DEFAULT TRUE,
    doors INT DEFAULT 4,
    rating DECIMAL(3, 1) DEFAULT 4.5,
    review_count INT DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_available (available),
    INDEX idx_price (price_per_day),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    pickup_location VARCHAR(255) NOT NULL,
    pickup_date DATETIME NOT NULL,
    return_date DATETIME NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_customer_email (customer_email),
    INDEX idx_status (status),
    INDEX idx_pickup_date (pickup_date),
    INDEX idx_return_date (return_date),
    INDEX idx_dates (pickup_date, return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer des véhicules d'exemple
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
('BMW 4 Series Convertible', 'Cabriolet', 1500.00, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80', 4, 'Auto', TRUE, 2, 4.5, 1890, TRUE);

