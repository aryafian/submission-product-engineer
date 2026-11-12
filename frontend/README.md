# NodeWave Deliverables Management System — Frontend

Modern Next.js 16 (App Router) client application for high-value deliverables management.

## 🛠 Tech Stack

- **Framework**: Next.js 16.4.6 (App Router, Turbopack)
- **UI**: React 19 + TypeScript (strict mode)
- **Styling**: Tailwind CSS + NodeWave brand identity
- **Data Fetching**: TanStack Query v5 + Axios
- **State Management**: Zustand v5
- **Icons**: Lucide React

---

## 🎨 NodeWave Brand Palette

- **Primary**: `#1E3A5F` (Deep Navy Blue)
- **Secondary**: `#4A90D9` (Ocean Blue)
- **Accent**: `#00D4AA` (Teal Accent)
- **Background**: `#F8FAFC`
- **Surface**: `#FFFFFF`
- **Text**: `#1A1A2E`
- **Muted**: `#64748B`

---

## ✨ Features

1. **Role-Based Workspaces & One-Click Login**:
   - Quick login buttons on `/login` for all 6 test personas.
2. **Dependency-Aware Kanban Board**:
   - 4 Columns: `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`.
   - Cards display lock indicators and prerequisite lists.
   - Status transition buttons are locked/disabled if prerequisites are incomplete.
   - PM restriction: "Mark as Done" action is strictly disabled for PM; only assigned executor can complete deliverables.
3. **Optimistic Locking Conflict Resolution (409)**:
   - On concurrent collision, a conflict dialog prompts the user with the server error message and a single-click refresh button.
4. **Client Guest View**:
   - Isolated view displaying project milestone progress percentage, progress bar, and deliverables flagged as client-visible.
   - Internal names, comments, and departments are completely omitted.
5. **Daily Standup Auto-Summary Modal**:
   - Real-time synthesis of departmental progress: "What was completed yesterday" and "What is blocked today".

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Build for production (TypeScript strict validation)
npm run build

# 3. Start development server
npm run dev
```
Client runs on `http://localhost:3000`.
