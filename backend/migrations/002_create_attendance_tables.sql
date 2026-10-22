CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INT NOT NULL AUTO_INCREMENT,
    qr_token CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    status ENUM('Active', 'Closed') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_sessions_qr_token (qr_token)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT NOT NULL AUTO_INCREMENT,
    staff_id INT NOT NULL,
    session_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time DATETIME DEFAULT NULL,
    status ENUM('Present', 'Late', 'Absent') NOT NULL DEFAULT 'Present',
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_records_staff_date (staff_id, attendance_date),
    KEY idx_attendance_records_session_id (session_id),
    CONSTRAINT fk_attendance_records_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_attendance_records_session
        FOREIGN KEY (session_id)
        REFERENCES attendance_sessions (id)
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
