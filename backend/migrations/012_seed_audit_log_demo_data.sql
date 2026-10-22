INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Staff', s.id,
       CONCAT('DEMO DATA - Initial staff record for ', s.first_name, ' ', s.last_name, '.'),
       'DEMO'
FROM staff s
WHERE s.employee_id = 'DEMO-TASK-001'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('DEMO DATA - Initial staff record for ', s.first_name, ' ', s.last_name, '.')
  );

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Department', d.id,
       CONCAT('DEMO DATA - Initial department record for ', d.department_name, '.'),
       'DEMO'
FROM departments d
JOIN staff s ON s.employee_id = 'DEMO-TASK-002'
WHERE d.department_name = s.department
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('DEMO DATA - Initial department record for ', d.department_name, '.')
  );

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Check-in', 'Attendance', ar.id,
       CONCAT('DEMO DATA - Attendance recorded for ', s.first_name, ' ', s.last_name, '.'),
       'DEMO'
FROM attendance_records ar
JOIN staff s ON s.id = ar.staff_id
WHERE s.employee_id = 'DEMO-TASK-003'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('DEMO DATA - Attendance recorded for ', s.first_name, ' ', s.last_name, '.')
  )
ORDER BY ar.id
LIMIT 1;

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Task', t.id,
       CONCAT('DEMO DATA - Initial task record: ', t.title, '.'),
       'DEMO'
FROM tasks t
JOIN staff s ON s.id = t.assigned_to
WHERE s.employee_id = 'DEMO-TASK-001'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('DEMO DATA - Initial task record: ', t.title, '.')
  )
ORDER BY t.id
LIMIT 1;

INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
SELECT NULL, 'Created', 'Asset', a.id,
       CONCAT('DEMO DATA - Initial asset record: ', a.asset_name, '.'),
       'DEMO'
FROM assets a
JOIN staff s ON s.id = a.assigned_to
WHERE s.employee_id = 'DEMO-TASK-002'
  AND NOT EXISTS (
      SELECT 1 FROM audit_logs
      WHERE description = CONCAT('DEMO DATA - Initial asset record: ', a.asset_name, '.')
  )
ORDER BY a.id
LIMIT 1;
