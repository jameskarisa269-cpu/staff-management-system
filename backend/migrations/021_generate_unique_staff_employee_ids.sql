CREATE TEMPORARY TABLE duplicate_staff_employee_ids AS
SELECT DISTINCT staff.id
FROM staff
JOIN staff AS earlier_staff
  ON earlier_staff.employee_id = staff.employee_id
 AND earlier_staff.id < staff.id;

UPDATE staff
JOIN duplicate_staff_employee_ids
  ON duplicate_staff_employee_ids.id = staff.id
SET staff.employee_id = CONCAT('EMP-', UPPER(REPLACE(UUID(), '-', '')));

DROP TEMPORARY TABLE duplicate_staff_employee_ids;

ALTER TABLE staff
    ADD UNIQUE KEY uq_staff_employee_id (employee_id);
