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

The repository does not include the original schema migrations for core tables
such as `staff`; `013_add_staff_auth_and_department_link.sql` assumes `staff`
already exists. An empty database cannot be initialized from this repository
alone. Import the existing application's complete schema and data into TiDB,
or obtain and apply the missing base schema first.

After the base schema is present, apply only migrations that are not already
reflected in the database, in numeric order. The numbered migration set also
contains demo-data scripts (`005`, `006`, `008`, `010`, and `012`); do not run
those on a production database unless you intentionally want sample records.
For an existing database, do not rerun migrations that have already been
applied.

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
in Command Prompt). To use the app on a phone, connect the phone and computer
to the same Wi-Fi network, then open the **Network** URL printed by Vite (for
example, `http://192.168.1.20:5173`) on the phone. Keep both servers running
and allow Node.js through the computer's firewall on private networks if asked.

## Deploy with TiDB, Render, and Vercel

### 1. Prepare TiDB

Create a TiDB Cloud database and a database user with access to it. Copy the
cluster's public hostname, user, password, and database name. Allow the Render
service to connect to the cluster (for example, configure TiDB's IP access list
as required by your plan). TiDB Cloud connections use TLS; the Render
configuration below enables it on port `4000`.

This project expects its original core schema (including the `staff` table) to
exist before its incremental migrations are applied. The repository does not
include that base schema, so do not point the app at an empty TiDB database or
run all migration files blindly. Import your existing app database's complete
schema and data to TiDB, then apply only the incremental migrations that are
not already reflected there. Review the migration notes above; the seed scripts
insert demo records and should be skipped for production unless wanted. If you
do not have an existing database or its original schema SQL, you will need to
recover/provide that schema before the app can be deployed.

### 2. Deploy the API to Render

Create a Render Blueprint from this repository and use `render.yaml`, or create
a Web Service manually with:

- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/health`

Set these Render environment variables without committing them:

| Variable | Value |
| --- | --- |
| `DB_HOST` | TiDB cluster hostname |
| `DB_PORT` | `4000` |
| `DB_USER` | TiDB database username |
| `DB_PASSWORD` | TiDB database password |
| `DB_NAME` | TiDB database name |
| `DB_SSL` | `true` |
| `ADMIN_EMAIL` | Admin sign-in email |
| `ADMIN_PASSWORD` | Strong, private admin password |
| `AUTH_TOKEN_SECRET` | Long random secret (at least 32 random bytes) |
| `CORS_ORIGINS` | Your Vercel site origin, e.g. `https://your-app.vercel.app` |

Render provides `PORT` automatically. If you also use a Vercel preview domain,
add its exact HTTPS origin to `CORS_ORIGINS`, separated by a comma. Once the
service is live, open `https://<your-render-service>.onrender.com/health` and
confirm it returns `{"status":"ok"}`. Use the service's HTTPS origin as the
frontend API URL.

### 3. Deploy the frontend to Vercel

Import the repository into Vercel and set the project Root Directory to
`frontend`. Use `npm run build` as the build command and `dist` as the output
directory. Add this Vercel environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Render API HTTPS origin, without `/api` (e.g. `https://your-api.onrender.com`) |

Redeploy after setting or changing environment variables. `frontend/vercel.json`
supports client-side route refreshes, and the viewport is configured for phone
screens. Open the Vercel HTTPS URL on your phone; camera access for QR scanning
requires HTTPS, which Vercel provides.

Keep `VITE_API_URL` unset for local development so Vite continues to proxy API
requests to `http://127.0.0.1:5000`.

### Deployment notes

- Never put database credentials or admin secrets in Vercel variables or any
  `VITE_` variable; Vite variables are included in browser code.
- Do not commit `.env` files. If a credential was ever pushed to a remote
  repository, rotate it even after removing the file from the latest version.
- The database must be reachable from Render; a local TiDB/MySQL instance on
  your computer will not work for a hosted backend.
