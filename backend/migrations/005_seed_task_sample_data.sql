INSERT INTO staff
    (employee_id, first_name, last_name, email, department, position, employment_status)
SELECT 'EMP-101', 'Amina', 'Njoroge', 'amina.njoroge@staffhub.co',
       'Human Resources', 'HR Officer', 'Active'
WHERE NOT EXISTS (
    SELECT 1 FROM staff WHERE employee_id = 'EMP-101'
);

INSERT INTO staff
    (employee_id, first_name, last_name, email, department, position, employment_status)
SELECT 'EMP-102', 'Brian', 'Otieno', 'brian.otieno@staffhub.co',
       'Finance', 'Finance Assistant', 'Active'
WHERE NOT EXISTS (
    SELECT 1 FROM staff WHERE employee_id = 'EMP-102'
);

INSERT INTO staff
    (employee_id, first_name, last_name, email, department, position, employment_status)
SELECT 'EMP-103', 'Grace', 'Wanjiku', 'grace.wanjiku@staffhub.co',
       'Operations', 'Operations Coordinator', 'Active'
WHERE NOT EXISTS (
    SELECT 1 FROM staff WHERE employee_id = 'EMP-103'
);

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Review monthly staff records', 'Sample data - replace with actual task details.',
       id, 'High', 'Pending', '2026-10-22', '2026-10-28', NULL
FROM staff WHERE employee_id = 'EMP001'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Review monthly staff records');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Prepare onboarding checklist', 'Sample data - replace with actual task details.',
       id, 'Medium', 'Pending', '2026-10-22', '2026-10-30', NULL
FROM staff WHERE employee_id = 'EMP-101'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Prepare onboarding checklist');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Reconcile department expenses', 'Sample data - replace with actual task details.',
       id, 'Urgent', 'In Progress', '2026-10-20', '2026-10-25', NULL
FROM staff WHERE employee_id = 'EMP-102'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Reconcile department expenses');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Update staff contact directory', 'Sample data - replace with actual task details.',
       id, 'Medium', 'In Progress', '2026-10-21', '2026-10-26', NULL
FROM staff WHERE employee_id = 'EMP-103'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Update staff contact directory');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Organize team orientation', 'Sample data - replace with actual task details.',
       id, 'High', 'Completed', '2026-10-15', '2026-10-20', NOW()
FROM staff WHERE employee_id = 'EMP-101'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Organize team orientation');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Audit office equipment register', 'Sample data - replace with actual task details.',
       id, 'Low', 'Completed', '2026-10-16', '2026-10-21', NOW()
FROM staff WHERE employee_id = 'EMP-102'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Audit office equipment register');

INSERT INTO tasks
    (title, description, assigned_to, priority, status, start_date, due_date, completed_at)
SELECT 'Schedule quarterly planning meeting', 'Sample data - replace with actual task details.',
       id, 'Low', 'Cancelled', '2026-10-18', '2026-10-24', NULL
FROM staff WHERE employee_id = 'EMP-103'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Schedule quarterly planning meeting');
