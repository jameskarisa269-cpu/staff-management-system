CREATE TABLE IF NOT EXISTS staff_reports (
    id INT NOT NULL AUTO_INCREMENT,
    staff_id INT NOT NULL,
    task_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_staff_reports_staff_id (staff_id),
    KEY idx_staff_reports_task_id (task_id),
    KEY idx_staff_reports_created_at (created_at),
    CONSTRAINT fk_staff_reports_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_staff_reports_task
        FOREIGN KEY (task_id)
        REFERENCES tasks (id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS weekly_briefs (
    id INT NOT NULL AUTO_INCREMENT,
    staff_id INT NOT NULL,
    department_id INT DEFAULT NULL,
    week_start DATE NOT NULL,
    work_done TEXT NOT NULL,
    next_week TEXT NOT NULL,
    challenges TEXT NOT NULL,
    impact TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_weekly_briefs_staff_week (staff_id, week_start),
    KEY idx_weekly_briefs_department_id (department_id),
    KEY idx_weekly_briefs_week_start (week_start),
    CONSTRAINT fk_weekly_briefs_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_weekly_briefs_department
        FOREIGN KEY (department_id)
        REFERENCES departments (id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
