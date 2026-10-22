INSERT INTO notifications (staff_id, title, message, type, is_read)
SELECT sample.staff_id, sample.title, sample.message, sample.type, sample.is_read
FROM (
    SELECT
        s.id AS staff_id,
        'DEMO DATA - Task reminder' AS title,
        'DEMO DATA - Please review your assigned tasks and update their status.' AS message,
        'Task' AS type,
        FALSE AS is_read
    FROM staff s
    WHERE s.employee_id = 'DEMO-TASK-001'

    UNION ALL

    SELECT
        s.id,
        'DEMO DATA - Attendance update',
        'DEMO DATA - Please check your attendance records and contact the administrator about any correction.',
        'Attendance',
        TRUE
    FROM staff s
    WHERE s.employee_id = 'DEMO-TASK-002'

    UNION ALL

    SELECT
        s.id,
        'DEMO DATA - Asset return reminder',
        'DEMO DATA - Please confirm that your assigned equipment is in good condition.',
        'Asset',
        FALSE
    FROM staff s
    WHERE s.employee_id = 'DEMO-TASK-003'

    UNION ALL

    SELECT
        s.id,
        'DEMO DATA - Staff directory update',
        'DEMO DATA - Your staff profile is available in the staff directory.',
        'General',
        TRUE
    FROM staff s
    WHERE s.employee_id = 'EMP001'

    UNION ALL

    SELECT
        NULL,
        'DEMO DATA - System notice',
        'DEMO DATA - The StaffHub system is available. Contact the administrator if you need assistance.',
        'System',
        FALSE
) AS sample
WHERE NOT EXISTS (
    SELECT 1
    FROM notifications existing
    WHERE existing.staff_id <=> sample.staff_id
      AND existing.title = sample.title
      AND existing.message = sample.message
);
