# MentorAI Frontend

This is the React 19 single-page application for **MentorAI**, an AI-powered student learning and placement platform.

## Setup Instructions

### Prerequisites
- Node.js v20+
- npm v10+

### Step 1: Install Dependencies
Run inside the `frontend/` folder:
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
The server will boot up at `http://localhost:5173`.

### Step 3: Build for Production
```bash
npm run build
```
This runs TypeScript compiling checks (`tsc`) and compiles static optimized bundles to the `dist` folder.

## Folder Structure
- `src/main.tsx`: Mounts the React app inside DOM `root`.
- `src/App.tsx`: Central router layout and TanStack Query configs.
- `src/index.css`: Global styles, scrollbars, and customized utilities.
- `src/components/ui/`: Reusable interface components (Button, Card, PageHeader, LoadingSpinner, EmptyState, Sidebar, Navbar).
- `src/layouts/`: Frame layouts (such as `DashboardLayout.tsx`).
- `src/pages/`: Module page dashboards (Dashboard, Tutor, StudyPlanner, KnowledgeBase, Placement, Progress, Profile, Settings, NotFound).
- `src/hooks/`, `src/services/`, `src/context/`, `src/types/`, `src/utils/`, `src/constants/`: Modular logic controllers and configurations.
