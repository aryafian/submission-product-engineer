# NodeWave Deliverables Management System — Backend API

Operational backbone for deliverables management across cross-functional teams (**Product Management, UI/UX, Frontend, Backend**) with strict multi-tenant **Client Guest** isolation.

## 🛠 Tech Stack

- **Runtime**: Bun 1.4.4
- **Framework**: Hono
- **ORM**: Prisma (PostgreSQL / SQLite dev)
- **Auth**: JWT (`jsonwebtoken`) + `bcryptjs`
- **Validation**: Zod
- **Testing**: `bun:test` automated test suite

---

## 🏛 Architecture & Hard Problems Solved

### 1. RBAC + ABAC (Role & Attribute Based Access Control)
- **Product Manager (PM)**:
  - Full read/write access to projects and tasks.
  - Can define inter-task dependencies and toggle `clientVisible`.
  - **Restriction**: Cannot move task from `IN_PROGRESS` to `DONE`. Only assigned executor can complete it.
- **Internal Team (UI/UX, Frontend, Backend)**:
  - Can only view projects and task details assigned to them (`ProjectMember` check).
  - Can only update status and upload work attachments. Core title/description editing is forbidden at API level.
- **Client Guest**:
  - Absolute data isolation: accesses only projects explicitly assigned.
  - Only sees tasks flagged as `clientVisible`.
  - **API-Level Data Masking**: Assignee names, avatars, department identifiers, and internal comments are omitted from API JSON responses (not just hidden in CSS).

### 2. Dependency-Aware Task Board & Cycle Prevention
- Dependent task automatically transitions to `BLOCKED` if prerequisites are not all `DONE`.
- **API Guard**: Attempts to transition a task to `IN_PROGRESS` or `DONE` while prerequisites are incomplete are rejected with `403 Forbidden`.
- **Circular Dependency Detection**: DFS cycle detection rejects cyclic dependencies before persistence with `400 Bad Request`.
- **Re-evaluation Engine**: When a prerequisite task is reopened or deleted, all dependent tasks are automatically re-evaluated and blocked/unblocked in transactional batches with audit logging.

### 3. Concurrency Control (Optimistic Locking)
- Every task maintains an integer `version` field.
- Every `PUT` / `PATCH` requires `{ version }`.
- If incoming version != DB version, throws `409 Conflict` to prevent silent overwrites.

### 4. Immutable Audit Trail & Soft Deletes
- **Soft Deletes**: Entities implement `deletedAt`. All operational queries filter `deletedAt: null`.
- **Append-Only Audit Log**: Every field change (`title`, `description`, `status`, `priority`, `assigneeId`, `department`, `clientVisible`) creates an immutable row in `TaskAuditLog` within the same database transaction.
- Audit table has no `updatedAt` or delete operations in application code.

### 5. Daily Standup Auto-Summary (Bonus)
- Endpoint `GET /api/projects/:projectId/standup` analyzes yesterday's audit logs and groups activity by department:
  - "What was completed yesterday"
  - "What is blocked today"

---

## 🔑 Seed Accounts & Credentials

All seeded accounts use password: `password123`

| Role | Email | Department | Access Scope |
|---|---|---|---|
| **Product Manager (PM)** | `pm@nodewave.com` | None | All projects & tasks |
| **UI/UX Designer** | `uiux@nodewave.com` | UI_UX | Project Alpha |
| **Frontend Engineer** | `frontend@nodewave.com` | FRONTEND | Project Alpha |
| **Backend Engineer** | `backend@nodewave.com` | BACKEND | Project Alpha & Beta |
| **Client Guest 1** | `client1@nodewave.com` | None | Project Alpha (Masked) |
| **Client Guest 2** | `client2@nodewave.com` | None | Project Beta (Masked) |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Setup database & run migrations
bunx prisma generate
bunx prisma db push

# 3. Seed test data
bun run prisma/seed.ts

# 4. Run automated test suite
bun test tests/assessment.test.ts

# 5. Start development server
bun run src/index.ts
```
Server starts on `http://localhost:3001`.
