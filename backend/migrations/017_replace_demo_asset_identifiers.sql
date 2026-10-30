UPDATE assets
SET asset_tag = CASE asset_tag
        WHEN 'DEMO-AST-001' THEN 'AST-1001'
        WHEN 'DEMO-AST-002' THEN 'AST-1002'
        WHEN 'DEMO-AST-003' THEN 'AST-1003'
        WHEN 'DEMO-AST-004' THEN 'AST-1004'
        WHEN 'DEMO-AST-005' THEN 'AST-1005'
        WHEN 'DEMO-AST-006' THEN 'AST-1006'
        WHEN 'DEMO-AST-007' THEN 'AST-1007'
        WHEN 'DEMO-AST-008' THEN 'AST-1008'
        ELSE asset_tag
    END,
    serial_number = CASE serial_number
        WHEN 'DEMO-SN-001' THEN 'AST-SN-001'
        WHEN 'DEMO-SN-002' THEN 'AST-SN-002'
        WHEN 'DEMO-SN-003' THEN 'AST-SN-003'
        WHEN 'DEMO-SN-004' THEN 'AST-SN-004'
        WHEN 'DEMO-SN-005' THEN 'AST-SN-005'
        WHEN 'DEMO-SN-006' THEN 'AST-SN-006'
        WHEN 'DEMO-SN-007' THEN 'AST-SN-007'
        WHEN 'DEMO-SN-008' THEN 'AST-SN-008'
        ELSE serial_number
    END
WHERE asset_tag IN (
    'DEMO-AST-001',
    'DEMO-AST-002',
    'DEMO-AST-003',
    'DEMO-AST-004',
    'DEMO-AST-005',
    'DEMO-AST-006',
    'DEMO-AST-007',
    'DEMO-AST-008'
);
