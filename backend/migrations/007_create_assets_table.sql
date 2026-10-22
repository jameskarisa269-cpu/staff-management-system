CREATE TABLE IF NOT EXISTS assets (
    id INT NOT NULL AUTO_INCREMENT,
    asset_tag VARCHAR(50) NOT NULL,
    asset_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    serial_number VARCHAR(100) DEFAULT NULL,
    asset_condition ENUM('New', 'Good', 'Fair', 'Damaged')
        NOT NULL DEFAULT 'Good',
    status ENUM('Available', 'Assigned', 'Under Maintenance', 'Retired', 'Lost')
        NOT NULL DEFAULT 'Available',
    assigned_to INT DEFAULT NULL,
    purchase_date DATE DEFAULT NULL,
    purchase_cost DECIMAL(12, 2) DEFAULT NULL,
    location VARCHAR(150) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assets_asset_tag (asset_tag),
    UNIQUE KEY uq_assets_serial_number (serial_number),
    KEY idx_assets_assigned_to (assigned_to),
    KEY idx_assets_status (status),
    CONSTRAINT fk_assets_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES staff (id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
