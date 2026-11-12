# Elimu Staff Management System setup

## Configure the administrator

Add these values to `backend/.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-strong-private-password
AUTH_TOKEN_SECRET=use-a-long-random-secret
```

Keep these credentials private and do not commit `backend/.env`. A strong token
secret can be generated in PowerShell with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Apply database migrations

After the existing application migrations have been applied, apply:

- `backend/migrations/013_add_staff_auth_and_department_link.sql`
- `backend/migrations/014_create_staff_submissions.sql`
- `backend/migrations/015_allow_manual_attendance_records.sql`
- `backend/migrations/016_replace_seed_placeholders.sql`
- `backend/migrations/017_replace_demo_asset_identifiers.sql`
- `backend/migrations/018_create_notification_reads_table.sql`
- `backend/migrations/019_create_staff_account_requests.sql`
- `backend/migrations/020_add_senior_staff_assignment.sql`
- `backend/migrations/021_generate_unique_staff_employee_ids.sql`
- `backend/migrations/022_replace_remaining_demo_asset_identifiers.sql`

These migrations link staff to department records, add password-hash storage,
create the manual-report and weekly-brief tables, and allow admins to record
attendance without a QR session. Migration 016 removes placeholder prefixes
and descriptions from existing notification and module records. Migration 017
replaces `DEMO-` asset tags and serial numbers with the inventory identifiers
used by the asset seed data.
Migration 018 stores notification read status separately for each staff member.
Migration 019 creates the pending staff account request queue used by public signup.
Migration 020 adds admin-managed Senior Staff access for departmental position assignments.
Migration 021 repairs any existing duplicate employee IDs and enforces uniqueness
in the database.
Migration 022 replaces any remaining `DEMO-` asset identifiers with the
inventory tags and serial numbers used by the asset records.

Migration 015 is required for **Add Attendance** on databases created before
manual attendance was supported. Apply it before using the form; without it,
the database rejects records that do not belong to a QR session.

## Record attendance

In **Attendance**, an admin creates a QR session and displays its QR code for
staff to scan. Staff open **Attendance**, scan the active code with their
camera, or paste its token, then select **Check in**. Successful check-ins
appear in both the staff member's attendance history and the admin attendance
records. The admin can also use **Staff Check-In** or record a status directly
with **Add Attendance**. Check-in time is optional for manual entries and is
cleared for Absent records. Only one record per staff member per date is
allowed; edit the existing record if that staff member has already checked in.

## Create staff accounts and sign in

Sign in as the configured admin, open **Staff**, and create or edit a staff
record. New employee IDs are generated automatically; each account needs a
unique email, a registered department, and an initial password of at least
eight characters. Existing staff accounts need
an admin to set their password in the edit form before they can sign in.

Guests can use **Request an account** on the sign-in page. The request remains
pending until an admin opens **Account Requests**, selects an active department,
then approves it. The system generates the employee ID. Rejected applicants may submit a new
request later.

Admins can grant or remove **Senior Staff access** when creating, editing, or
approving staff accounts. Senior staff can use **Team Roles** to assign job
positions to active staff in their own department. Only admins can grant senior
access, and senior staff cannot assign positions across departments.

Admins can assign tasks from **Tasks**. When an admin assigns a task to a staff
member, the staff member receives a **Task** notification naming the assigned
task. Reassigning a task to a different staff member also notifies the new
assignee. Staff accounts can access **Attendance**, **Tasks**, **Reports**, and
**Notifications**; staff can check in, view their attendance history and
notifications, update assigned task statuses, send task-related or manual
reports to the administrator, and submit weekly briefs.
Submitted weekly briefs are visible to every signed-in staff member and to the
admin.

## Start the application

Run the backend from `backend` with `node index.js`, then start the Vite
frontend from `frontend` with `npm.cmd run dev` in PowerShell (or `npm run dev`
in Command Prompt). Open the URL printed by Vite.
