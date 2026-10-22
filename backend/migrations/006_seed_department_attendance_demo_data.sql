INSERT INTO departments (department_name, description, manager_id, status)
SELECT
    s.department,
    CONCAT('DEMO DATA - managed by ', s.first_name, ' ', s.last_name),
    s.id,
    'Active'
FROM staff s
WHERE s.employee_id IN ('DEMO-TASK-001', 'DEMO-TASK-002', 'DEMO-TASK-003')
  AND NOT EXISTS (
      SELECT 1
      FROM departments d
      WHERE d.department_name = s.department
  );

INSERT INTO attendance_sessions (qr_token, expires_at, status)
SELECT SHA2('staff-management-demo-attendance-2026-10', 256),
       DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Closed'
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_sessions
    WHERE qr_token = SHA2('staff-management-demo-attendance-2026-10', 256)
);

INSERT INTO attendance_records
    (staff_id, session_id, attendance_date, check_in_time, status, remarks)
SELECT s.id,
       demo_session.id,
       sample.attendance_date,
       CASE
           WHEN sample.status = 'Absent' THEN NULL
           ELSE TIMESTAMP(sample.attendance_date, sample.check_in_time)
       END,
       sample.status,
       'DEMO DATA - replace with actual attendance.'
FROM (
    SELECT 'EMP001' AS employee_id, DATE('2026-10-13') AS attendance_date,
           'Present' AS status, TIME('08:42:00') AS check_in_time
    UNION ALL SELECT 'EMP001', DATE('2026-10-14'), 'Late', TIME('09:17:00')
    UNION ALL SELECT 'EMP001', DATE('2026-10-15'), 'Absent', NULL
    UNION ALL SELECT 'DEMO-TASK-001', DATE('2026-10-13'), 'Late', TIME('09:12:00')
    UNION ALL SELECT 'DEMO-TASK-001', DATE('2026-10-14'), 'Present', TIME('08:49:00')
    UNION ALL SELECT 'DEMO-TASK-001', DATE('2026-10-15'), 'Present', TIME('08:55:00')
    UNION ALL SELECT 'DEMO-TASK-002', DATE('2026-10-13'), 'Present', TIME('08:46:00')
    UNION ALL SELECT 'DEMO-TASK-002', DATE('2026-10-14'), 'Absent', NULL
    UNION ALL SELECT 'DEMO-TASK-002', DATE('2026-10-15'), 'Late', TIME('09:24:00')
    UNION ALL SELECT 'DEMO-TASK-003', DATE('2026-10-13'), 'Absent', NULL
    UNION ALL SELECT 'DEMO-TASK-003', DATE('2026-10-14'), 'Late', TIME('09:08:00')
    UNION ALL SELECT 'DEMO-TASK-003', DATE('2026-10-15'), 'Present', TIME('08:51:00')
) AS sample
JOIN staff s ON s.employee_id = sample.employee_id
JOIN attendance_sessions demo_session
    ON demo_session.qr_token = SHA2('staff-management-demo-attendance-2026-10', 256)
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_records existing
    WHERE existing.staff_id = s.id
      AND existing.attendance_date = sample.attendance_date
);
