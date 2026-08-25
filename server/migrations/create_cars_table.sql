

CREATE TABLE IF NOT EXISTS cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT NULL,
  price_per_day INT NOT NULL DEFAULT 0,
  -- available is stored as TINYINT(1) so 1 means available and 0 means not available
  available TINYINT(1) NOT NULL DEFAULT 1,
  model_year INT DEFAULT NULL,
  brand VARCHAR(50) DEFAULT NULL,
  seats INT DEFAULT NULL,
  -- ac indicates whether the car has air‑conditioning (1 for true, 0 for false)
  ac TINYINT(1) DEFAULT NULL,
  fuel_type VARCHAR(50) DEFAULT NULL,
  transmission VARCHAR(50) DEFAULT NULL,
  image_path VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

