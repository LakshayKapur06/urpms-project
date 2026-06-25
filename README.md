<div align="center">

# Unified Recruitment & Payroll Management System

**A full-stack internal operations platform for managing the complete employee lifecycle — from candidate intake through hiring, onboarding, and payroll.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Database Design](#-database-design)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Project Structure](#-project-structure)

---

## Overview

URPMS is designed as a **database-centric** business application where critical workflow logic is enforced directly at the database level through stored procedures, functions, and triggers. This ensures data integrity and operational consistency regardless of the client consuming the API.

The system tracks candidates through a structured recruitment pipeline (`APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFERED → HIRED`), captures interview evaluations, converts hires into employees, manages payroll generation, and features a robust **Soft-Delete Archive System** to maintain perfect auditability.

---

## ✨ Features

### Recruitment Pipeline & Strict Isolation
- **Strict Candidate Isolation** — The candidate staging area is strictly separated from the application pipeline. Once a candidate enters the pipeline, they are hidden from the general candidate pool.
- **Application Pipeline** — Enforce valid state transitions through a 7-stage hiring workflow.
- **Standardized Job Roles** — Candidates are strictly assigned to 15 standard corporate job roles (e.g. Software Engineer, AI/ML Engineer, Product Manager), enforced by database `ENUM` constraints across the entire lifecycle.
- **Interview Scheduling & Feedback** — Schedule interviews, capture technical/communication scores, and aggregate multi-interviewer feedback safely.
- **Bulk Operations** — Close entire job positions (auto-rejecting applications) or bulk-remove filtered candidate batches instantly.

### The Archive System (Auditability)
- **Soft-Delete Architecture** — Instead of destructive `DELETE` queries, removed candidates and applications are flagged with an `is_archived` state. This removes clutter from main UI views while perfectly preserving historical data, feedback scores, and status transitions for audits.
- **Removed Records Dashboard** — A dedicated UI to view all archived candidates and applications, filterable by their removal stage and job position.
- **Restore / Un-Remove Logic** — Accidental removals can be reversed. Restoring applications wipes out old feedback and securely drops them back to the starting `APPLIED` line, while candidate restorations safely drop candidates back into the general pool.

### Payroll & Finance
- **Payroll Generation** — Generate monthly payroll records using stored procedures.
- **Payment Tracking** — Track and update payment completion status.
- **Compensation Management** — Store base salary and bonus percentage per employee.

### Dashboard & Analytics
- **KPI Cards** — Total applications, hired count, shortlisted count, conversion rate.
- **Pipeline Distribution** — Interactive bar chart showing candidates at each stage.
- **Department Breakdown** — Pie chart visualization of employees by department.

### Platform
- **JWT Authentication** — Secure login with role-based access control.
- **Corporate UI** — Sleek, minimal interface featuring dark mode, glassmorphism, and structured typography.
- **Rate Limiting & Input Validation** — Login endpoints protected against brute force, with comprehensive server-side validation.

---

## 🏗 Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│   React Dashboard   │────▶│   Express REST API   │────▶│     MySQL Database      │
│                     │     │                      │     │                         │
│  • Vite + HMR       │     │  • JWT Auth          │     │  • Stored Procedures    │
│  • TailwindCSS      │     │  • Input Validation  │     │  • Triggers             │
│  • Recharts         │     │  • Soft Deletes      │     │  • Strict ENUM Roles    │
│  • Corporate UI     │     │  • CORS + Security   │     │  • Archive / Audit Logs │
└─────────────────────┘     └──────────────────────┘     └─────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 8 | UI framework and build tooling |
| **Styling** | TailwindCSS 4, Framer Motion | Responsive design and animations |
| **Charts** | Recharts | Dashboard data visualizations |
| **Icons** | Lucide React | Sidebar and UI iconography |
| **Backend** | Node.js, Express 5 | REST API server |
| **Database** | MySQL 8, mysql2 driver | Persistence and business logic |
| **Auth** | JWT (jsonwebtoken), bcryptjs | Authentication and password hashing |
| **Security** | CORS, rate limiting, security headers | API protection |

---

## 🗄 Database Design

The database enforces business rules at the SQL level, not just in application code:

### Tables
| Table | Purpose |
|-------|---------|
| `users` | Admin accounts with hashed passwords |
| `candidate` | Candidate profiles (`is_archived` tracking, strict `job_role` ENUM) |
| `application` | Recruitment pipeline entries (`is_archived`, `archived_stage` tracking) |
| `interview_feedback` | Structured interview evaluation scores |
| `employee` | Hired candidate records with matching `job_role` ENUM |
| `compensation_offer` | Salary and bonus data per employee |
| `payroll_transaction` | Monthly payroll records |
| `payment_record` | Payment status tracking (PENDING/COMPLETED) |
| `status_history` | Audit trail of all status transitions (including Restore flows) |
| `audit_log` | General-purpose audit logging for database triggers |

### Stored Procedures
- **`hire_candidate`** — Atomically creates employee + compensation records and updates application status within a transaction.
- **`generate_payroll`** — Creates payroll and payment records from compensation data.
- **`filter_candidates`** — Server-side filtering by CGPA, experience, and salary (respecting archive flags).

### Triggers
- **`before_insert_feedback`** — Auto-calculates overall score (60% technical + 40% communication).
- **`after_application_status_update`** — Records status transitions in `status_history` and `audit_log`.
- **`validate_feedback_insert`** — Blocks feedback insertion unless application status is `INTERVIEWED`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **MySQL** v8.0 or higher
- **npm** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/LakshayKapur06/urpms-project.git
cd urpms-project
```

### 2. Database Setup

1. Open MySQL and run the full schema file:
   ```bash
   mysql -u root -p < database/SQL\ Code.sql
   ```
   This creates the `urpms` database with all tables, procedures, triggers, functions, and seed data.

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=urpms
JWT_SECRET=your_secure_secret_here
FRONTEND_ORIGIN=http://localhost:5173
```

Start the server:
```bash
npm run dev    # Development (auto-restart with nodemon)
npm start      # Production
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 5. First Login

The first user registered becomes the **ADMIN**. Navigate to the app and register your account — all subsequent registrations require admin authentication.

---

## 📡 API Reference

All endpoints (except auth) require a valid JWT in the `Authorization: Bearer <token>` header.

### Candidates & Archive
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/candidates` | List active candidates (hides pipeline + archived) |
| `DELETE` | `/candidates/bulk` | Soft-remove multiple candidates by filter |
| `GET` | `/archive/candidates` | Fetch all archived candidates |
| `POST` | `/archive/candidates/:id/restore`| Safely restore a candidate |

### Applications & Archive
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applications` | List active applications (hides archived) |
| `POST` | `/applications/close-position`| Auto-reject and soft-delete pipeline positions |
| `GET` | `/archive/applications` | Fetch all archived applications |
| `POST` | `/archive/applications/:id/restore`| Safely restore application, wipe feedback |

*(Standard CRUD routes for Auth, Payroll, and Dashboard metrics remain unchanged).*

---

## 📁 Project Structure

```
urpms-project/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express server entry point
│   │   ├── routes/
│   │   │   ├── archive.routes.js     # Archive / Soft Delete logic
│   │   │   ├── candidate.routes.js   # Isolated Candidate CRUD
│   │   │   └── ...                   # Application, Payroll, Dashboard
│   │   └── ...                       # Middlewares, DB connections
│   ├── update_db_archive.js          # Migration script for v2.0
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Candidates.jsx        # Candidate listing with isolation banner
│   │   │   ├── Removed.jsx           # Dedicated Archive viewing dashboard
│   │   │   └── ...                   # Applications, Dashboard, Payroll
│   │   ├── components/               # Forms, KPI Cards, minimal Sidebar
│   │   └── App.jsx                   # Root router
│   └── package.json
│
└── database/
    └── SQL Code.sql                  # Complete schema (procedures, triggers)
```

---

<div align="center">

*Built for modern HR operations. Database-centric by design. Version 2.0*

</div>
