INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-001', 'Office Laptop', 'Computer',
       'DEMO DATA - replace with the organisation asset record.',
       'DEMO-SN-001', 'Good', 'Assigned', s.id, '2025-03-12', 85000.00,
       'IT Office'
FROM staff s
WHERE s.employee_id = 'EMP001'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-001');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-002', 'Desktop Workstation', 'Computer',
       'DEMO DATA - replace with the organisation asset record.',
       'DEMO-SN-002', 'Good', 'Assigned', s.id, '2025-05-08', 72000.00,
       'Human Resources'
FROM staff s
WHERE s.employee_id = 'DEMO-TASK-001'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-002');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-003', 'Department Laptop', 'Computer',
       'DEMO DATA - replace with the organisation asset record.',
       'DEMO-SN-003', 'New', 'Assigned', s.id, '2025-08-20', 91000.00,
       'Finance'
FROM staff s
WHERE s.employee_id = 'DEMO-TASK-002'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-003');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-004', 'Meeting Room Projector', 'Audio Visual',
       'DEMO DATA - available inventory sample.',
       'DEMO-SN-004', 'Good', 'Available', NULL, '2024-11-04', 48000.00,
       'Conference Room'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-004');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-005', 'Office Printer', 'Printer',
       'DEMO DATA - available inventory sample.',
       'DEMO-SN-005', 'Fair', 'Available', NULL, '2024-07-16', 32000.00,
       'Administration'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-005');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-006', 'Network Switch', 'Networking',
       'DEMO DATA - available inventory sample.',
       'DEMO-SN-006', 'New', 'Available', NULL, '2025-02-10', 27000.00,
       'Server Room'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-006');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-007', 'Backup Laptop', 'Computer',
       'DEMO DATA - currently undergoing maintenance.',
       'DEMO-SN-007', 'Damaged', 'Under Maintenance', NULL, '2023-09-25',
       65000.00, 'IT Workshop'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-007');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'DEMO-AST-008', 'Office Phone', 'Communication',
       'DEMO DATA - retired inventory sample.',
       'DEMO-SN-008', 'Fair', 'Retired', NULL, '2022-04-18', 12000.00,
       'Storage'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'DEMO-AST-008');
