# StaffHub setup

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

These migrations link staff to department records, add password-hash storage,
create the manual-report and weekly-brief tables, and allow admins to record
attendance without a QR session. Migration 016 removes placeholder prefixes
and descriptions from existing notification and module records. Migration 017
replaces `DEMO-` asset tags and serial numbers with the inventory identifiers
used by the asset seed data.
Migration 018 stores notification read status separately for each staff member.

## Record attendance

In **Attendance**, an admin creates a QR session and displays its QR code for
staff to scan. Staff open **Attendance**, scan the active code with their
camera, or paste its token, then select **Check in**. Successful check-ins
appear in both the staff member's attendance history and the admin attendance
records. The admin can also use **Staff Check-In** or record a status directly
with **Add Attendance**. Check-in time is optional for manual entries and is
cleared for Absent records.

## Create staff accounts and sign in

Sign in as the configured admin, open **Staff**, and create or edit a staff
record. Each staff account needs a unique email, a registered department, and
an initial password of at least eight characters. Existing staff accounts need
an admin to set their password in the edit form before they can sign in.

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
