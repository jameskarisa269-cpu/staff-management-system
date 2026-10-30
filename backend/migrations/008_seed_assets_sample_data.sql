INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1001', 'Office Laptop', 'Computer',
       'Assigned office laptop.',
       'AST-SN-001', 'Good', 'Assigned', s.id, '2025-03-12', 85000.00,
       'IT Office'
FROM staff s
WHERE s.employee_id = 'EMP001'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1001');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1002', 'Desktop Workstation', 'Computer',
       'Assigned desktop workstation.',
       'AST-SN-002', 'Good', 'Assigned', s.id, '2025-05-08', 72000.00,
       'Human Resources'
FROM staff s
WHERE s.employee_id = 'EMP-101'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1002');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1003', 'Department Laptop', 'Computer',
       'Assigned department laptop.',
       'AST-SN-003', 'New', 'Assigned', s.id, '2025-08-20', 91000.00,
       'Finance'
FROM staff s
WHERE s.employee_id = 'EMP-102'
  AND NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1003');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1004', 'Meeting Room Projector', 'Audio Visual',
       'Meeting room projector available for use.',
       'AST-SN-004', 'Good', 'Available', NULL, '2024-11-04', 48000.00,
       'Conference Room'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1004');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1005', 'Office Printer', 'Printer',
       'Office printer located in Administration.',
       'AST-SN-005', 'Fair', 'Available', NULL, '2024-07-16', 32000.00,
       'Administration'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1005');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1006', 'Network Switch', 'Networking',
       'Network switch for office network connectivity.',
       'AST-SN-006', 'New', 'Available', NULL, '2025-02-10', 27000.00,
       'Server Room'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1006');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1007', 'Backup Laptop', 'Computer',
       'Backup laptop currently under maintenance.',
       'AST-SN-007', 'Damaged', 'Under Maintenance', NULL, '2023-09-25',
       65000.00, 'IT Workshop'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1007');

INSERT INTO assets
    (asset_tag, asset_name, category, description, serial_number,
     asset_condition, status, assigned_to, purchase_date, purchase_cost, location)
SELECT 'AST-1008', 'Office Phone', 'Communication',
       'Office phone retired from service.',
       'AST-SN-008', 'Fair', 'Retired', NULL, '2022-04-18', 12000.00,
       'Storage'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE asset_tag = 'AST-1008');
