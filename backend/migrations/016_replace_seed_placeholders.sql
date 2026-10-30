UPDATE notifications
SET title = CASE
        WHEN title LIKE 'DEMO DATA - %'
            THEN SUBSTRING(title, LENGTH('DEMO DATA - ') + 1)
        WHEN title LIKE 'Sample data - %'
            THEN SUBSTRING(title, LENGTH('Sample data - ') + 1)
        ELSE title
    END,
    message = CASE
        WHEN message LIKE 'DEMO DATA - %'
            THEN SUBSTRING(message, LENGTH('DEMO DATA - ') + 1)
        WHEN message LIKE 'Sample data - %'
            THEN SUBSTRING(message, LENGTH('Sample data - ') + 1)
        ELSE message
    END
WHERE title LIKE 'DEMO DATA - %'
   OR title LIKE 'Sample data - %'
   OR message LIKE 'DEMO DATA - %'
   OR message LIKE 'Sample data - %';

UPDATE tasks
SET description = CASE
        WHEN title = 'Review monthly staff records'
            THEN 'Review staff records for completeness and submit any corrections.'
        WHEN title = 'Prepare onboarding checklist'
            THEN 'Prepare onboarding materials and confirm required documents for new starters.'
        WHEN title = 'Reconcile department expenses'
            THEN 'Review department expenses and resolve outstanding entries.'
        WHEN title = 'Update staff contact directory'
            THEN 'Verify staff contact details and submit any corrections.'
        WHEN title = 'Organize team orientation'
            THEN 'Coordinate the team orientation schedule and materials.'
        WHEN title = 'Audit office equipment register'
            THEN 'Verify equipment assignments and update the register.'
        WHEN title = 'Schedule quarterly planning meeting'
            THEN 'Coordinate availability and circulate the quarterly planning agenda.'
        WHEN description = 'Sample data - replace with actual task details.'
            THEN NULL
        WHEN description LIKE 'DEMO DATA - %'
            THEN SUBSTRING(description, LENGTH('DEMO DATA - ') + 1)
        ELSE description
    END
WHERE description = 'Sample data - replace with actual task details.'
   OR description LIKE 'DEMO DATA - %';

UPDATE departments
SET description = CONCAT(
    'Managed by ',
    CASE
        WHEN description LIKE 'Sample data - managed by %'
            THEN SUBSTRING(description, LENGTH('Sample data - managed by ') + 1)
        ELSE SUBSTRING(description, LENGTH('DEMO DATA - ') + 1)
    END
)
WHERE description LIKE 'Sample data - managed by %'
   OR description LIKE 'DEMO DATA - %';

UPDATE attendance_records
SET remarks = NULL
WHERE remarks = 'Sample data - replace with actual attendance.'
   OR remarks LIKE 'DEMO DATA - %';

UPDATE assets
SET description = CASE
        WHEN asset_tag = 'AST-1001' THEN 'Assigned office laptop.'
        WHEN asset_tag = 'AST-1002' THEN 'Assigned desktop workstation.'
        WHEN asset_tag = 'AST-1003' THEN 'Assigned department laptop.'
        WHEN asset_tag = 'AST-1004' THEN 'Meeting room projector available for use.'
        WHEN asset_tag = 'AST-1005' THEN 'Office printer located in Administration.'
        WHEN asset_tag = 'AST-1006' THEN 'Network switch for office network connectivity.'
        WHEN asset_tag = 'AST-1007' THEN 'Backup laptop currently under maintenance.'
        WHEN asset_tag = 'AST-1008' THEN 'Office phone retired from service.'
        WHEN description LIKE 'Sample data - %' THEN NULL
        WHEN description LIKE 'DEMO DATA - %'
            THEN SUBSTRING(description, LENGTH('DEMO DATA - ') + 1)
        ELSE description
    END
WHERE description IN (
    'Sample data - replace with the organisation asset record.',
    'Sample data - available inventory sample.',
    'Sample data - currently undergoing maintenance.',
    'Sample data - retired inventory sample.'
)
   OR description LIKE 'DEMO DATA - %';

UPDATE audit_logs
SET description = CASE
        WHEN description LIKE 'Sample data - %'
            THEN SUBSTRING(description, LENGTH('Sample data - ') + 1)
        ELSE SUBSTRING(description, LENGTH('DEMO DATA - ') + 1)
    END
WHERE description LIKE 'Sample data - %'
   OR description LIKE 'DEMO DATA - %';
