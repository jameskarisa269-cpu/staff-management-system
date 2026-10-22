CREATE TABLE IF NOT EXISTS tasks (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    assigned_to INT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled')
        NOT NULL DEFAULT 'Pending',
    start_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tasks_assigned_to (assigned_to),
    KEY idx_tasks_created_by (created_by),
    KEY idx_tasks_status_due_date (status, due_date),
    CONSTRAINT fk_tasks_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES staff (id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by)
        REFERENCES staff (id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
