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

These migrations link staff to department records, add password-hash storage,
and create the manual-report and weekly-brief tables.

## Create staff accounts and sign in

Sign in as the configured admin, open **Staff**, and create or edit a staff
record. Each staff account needs a unique email, a registered department, and
an initial password of at least eight characters. Existing staff accounts need
an admin to set their password in the edit form before they can sign in.

Admins can assign tasks from **Tasks**. Staff accounts see only **Tasks** and
**Reports**; staff can update assigned task statuses, send task-related or
manual reports to the administrator, and submit weekly briefs. Submitted
weekly briefs are visible to every signed-in staff member and to the admin.

## Start the application

Run the backend from `backend` with `node index.js`, then start the Vite
frontend from `frontend` with `npm.cmd run dev` in PowerShell (or `npm run dev`
in Command Prompt). Open the URL printed by Vite.
