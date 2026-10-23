INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Staff', s.id,
       CONCAT('Sample data - Initial staff record for ', s.first_name, ' ', s.last_name, '.'),
       '127.0.0.1'
FROM staff s
WHERE s.employee_id = 'EMP-101'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('Sample data - Initial staff record for ', s.first_name, ' ', s.last_name, '.')
  );

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Department', d.id,
       CONCAT('Sample data - Initial department record for ', d.department_name, '.'),
       '127.0.0.1'
FROM departments d
JOIN staff s ON s.employee_id = 'EMP-102'
WHERE d.department_name = s.department
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('Sample data - Initial department record for ', d.department_name, '.')
  );

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Check-in', 'Attendance', ar.id,
       CONCAT('Sample data - Attendance recorded for ', s.first_name, ' ', s.last_name, '.'),
       '127.0.0.1'
FROM attendance_records ar
JOIN staff s ON s.id = ar.staff_id
WHERE s.employee_id = 'EMP-103'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('Sample data - Attendance recorded for ', s.first_name, ' ', s.last_name, '.')
  )
ORDER BY ar.id
LIMIT 1;

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Task', t.id,
       CONCAT('Sample data - Initial task record: ', t.title, '.'),
       '127.0.0.1'
FROM tasks t
JOIN staff s ON s.id = t.assigned_to
WHERE s.employee_id = 'EMP-101'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('Sample data - Initial task record: ', t.title, '.')
  )
ORDER BY t.id
LIMIT 1;

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Asset', a.id,
       CONCAT('Sample data - Initial asset record: ', a.asset_name, '.'),
       '127.0.0.1'
FROM assets a
JOIN staff s ON s.id = a.assigned_to
WHERE s.employee_id = 'EMP-102'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('Sample data - Initial asset record: ', a.asset_name, '.')
  )
ORDER BY a.id
LIMIT 1;
