CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id INT NOT NULL,
    staff_id INT NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, staff_id),
    KEY idx_notification_reads_staff (staff_id),
    CONSTRAINT fk_notification_reads_notification
        FOREIGN KEY (notification_id)
        REFERENCES notifications (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notification_reads_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
