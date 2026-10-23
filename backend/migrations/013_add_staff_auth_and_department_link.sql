ALTER TABLE staff
    ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL,
    ADD COLUMN department_id INT DEFAULT NULL,
    ADD KEY idx_staff_department_id (department_id),
    ADD CONSTRAINT fk_staff_department
        FOREIGN KEY (department_id)
        REFERENCES departments (id)
        ON DELETE SET NULL;

UPDATE staff s
JOIN departments d ON d.department_name = s.department
SET s.department_id = d.id;
