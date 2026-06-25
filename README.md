<div align="center">

# URPMS — Unified Recruitment & Payroll Management System

**An enterprise-grade, full-stack internal operations platform that manages the complete employee lifecycle — from candidate intake and multi-stage recruitment through structured interviewing, hiring, onboarding, and payroll generation — with a fully auditable soft-delete archive system.**

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL_8-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![JWT](https://img.shields.io/badge/JWT_Auth-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Technical Highlights](#-key-technical-highlights)
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

URPMS is a **database-centric** business application where critical workflow logic — state machine transitions, score calculations, audit logging, and payroll generation — is enforced directly at the database level through **stored procedures, triggers, and functions**. This architectural decision ensures data integrity and operational consistency regardless of which client consumes the API, and demonstrates advanced SQL engineering alongside modern full-stack development.

The system implements a **7-stage recruitment pipeline** with strict state machine transitions (`APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFERED → HIRED / REJECTED`), captures structured multi-interviewer evaluations, converts hires into employees with compensation packages, and manages payroll cycles — all underpinned by a **soft-delete archive system** that maintains a complete audit trail of every action for compliance and accountability.

---

## 🎯 Key Technical Highlights

> These highlights summarize the engineering depth of this project — from database-level business logic to production-grade security hardening.

| Area | What Was Implemented |
|------|---------------------|
| **Database-Level Business Logic** | Stored procedures (`hire_candidate`, `generate_payroll`, `filter_candidates`), triggers for auto-score calculation (weighted 60/40), audit logging on status transitions, and feedback validation — all enforced at the SQL layer, not application code |
| **Finite State Machine** | A strict 7-stage recruitment pipeline with server-validated transitions; invalid state changes (e.g., `APPLIED → HIRED`) are rejected by the API |
| **Soft-Delete Archive System** | Industry-standard `is_archived` flag architecture that preserves all relational data (feedback scores, status history, candidate details) for auditing, while keeping active views clean and clutter-free |
| **Restore with Data Integrity** | "Un-archive" functionality that resets applications to the initial pipeline stage and wipes stale interview feedback, with full status history logging of the restore event |
| **Strict Data Contracts** | 15 standardized job roles enforced via MySQL `ENUM` constraints across `candidate`, `application`, and `employee` tables — ensuring data consistency from candidate registration through hiring |
| **Candidate–Pipeline Isolation** | Candidates in the active application pipeline are automatically hidden from the candidate staging area using optimized `LEFT JOIN` exclusion queries |
| **Role-Based Access Control** | JWT authentication with role-based middleware (`requireRole("ADMIN")`) protecting all mutating operations; first-user bootstrap pattern for initial admin creation |
| **Production Security Hardening** | Rate limiting (IP+email composite key), security headers (HSTS, CSP, X-Frame-Options), parameterized queries (SQL injection prevention), 100KB body size limits, and CORS origin locking |
| **Optimized Query Patterns** | `LEFT JOIN ... IS NULL` instead of correlated `NOT IN` subqueries for pipeline exclusion; `Promise.all` for parallel independent database calls; connection pooling with 10-connection limit |
| **Real-Time Analytics Dashboard** | KPIs (total applications, hired count, conversion rate), interactive pipeline bar charts, and department distribution pie charts — all computed live from the database, excluding archived records |
| **Comprehensive Input Validation** | Server-side validation layer covering email format, string length limits, numeric ranges, CGPA bounds (0–10), score bounds (0–100), and positive integer enforcement on all route parameters |
| **Bulk Operations** | Position-level bulk archiving, filter-based candidate removal, and "Close Position" workflow that auto-archives all non-hired/non-scheduled applications for a given role |

---

## ✨ Features

### Recruitment Pipeline
- **7-Stage State Machine** — Enforce valid transitions through `APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFERED → HIRED / REJECTED` with server-side validation
- **Strict Candidate Isolation** — Candidates currently in the pipeline are automatically hidden from the staging area; a persistent UI banner communicates this to end users
- **15 Standardized Job Roles** — Roles enforced via database `ENUM` constraints (Software Engineer, AI/ML Engineer, Product Manager, Data Scientist, etc.) across the entire lifecycle
- **Interview Scheduling & Feedback** — Schedule interviews with date/time and interviewer assignment; capture technical and communication scores with weighted auto-calculation (60/40)
- **Unique Feedback Constraint** — Each interviewer can submit exactly one feedback per application (enforced via database unique constraint), preventing duplicate evaluations
- **Bulk Operations** — Close entire job positions or bulk-archive filtered candidate/application sets in a single action with confirmation dialogs

### Audit & Compliance (Soft-Delete Archive System)
- **Non-Destructive Removal** — All "remove" operations set `is_archived = TRUE` instead of deleting rows, preserving every piece of data (feedback, scores, status transitions) for audit trails
- **Dedicated Archive Dashboard** — A separate "Removed" page displays all archived candidates and applications with full detail: CGPA, salary, interview scores, feedback remarks, and the exact pipeline stage at which removal occurred
- **Filterable Archive** — Filter archived records by job position and the pipeline stage at which they were removed
- **Restore with Integrity** — Restore archived applications to the `APPLIED` stage (wiping stale feedback for a fresh start) or restore candidates back to the staging pool, with on-screen warnings and status history logging

### Payroll & Finance
- **Payroll Generation** — Generate monthly payroll records via database stored procedure with employee/month/year validation
- **Payment Tracking** — Track and update payment completion status (`PENDING → COMPLETED`)
- **Compensation Management** — Base salary and bonus percentage stored per employee, linked through the hiring workflow

### Dashboard & Analytics
- **KPI Cards** — Total active applications, hired count, shortlisted count, and real-time conversion rate (excluding archived data)
- **Pipeline Distribution** — Interactive bar chart visualizing candidate distribution across all 7 stages
- **Department Breakdown** — Pie chart visualization of employees by department
- **Animated UI** — Framer Motion entrance animations and hover micro-interactions on all dashboard cards

### Platform & Security
- **JWT Authentication** — Secure login with 8-hour token expiry, role-based access control, and first-user admin bootstrap
- **Dark Mode** — Full dark/light theme support persisted in localStorage, with system preference detection
- **Rate Limiting** — Composite IP+email key rate limiter protecting login endpoints (10 attempts per 15 minutes)
- **Production Security Headers** — HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Graceful Shutdown** — SIGTERM/SIGINT handlers that cleanly close the HTTP server and database connection pool

---

## 🏗 Architecture

```
┌───────────────────────────┐     ┌────────────────────────────┐     ┌──────────────────────────────┐
│     React 19 Frontend     │────▶│     Express 5 REST API     │────▶│       MySQL 8 Database       │
│                           │     │                            │     │                              │
│  • Vite 8 + HMR           │     │  • JWT Auth + RBAC         │     │  • Stored Procedures         │
│  • TailwindCSS 4           │     │  • Input Validation Layer  │     │  • Triggers (score calc,     │
│  • Recharts (analytics)   │     │  • Soft-Delete Middleware   │     │    audit log, validation)    │
│  • Framer Motion (anim)   │     │  • Rate Limiting           │     │  • ENUM Job Role Constraints │
│  • Axios + JWT Interceptor│     │  • Security Headers        │     │  • Status History Audit      │
│  • Dark/Light Theme       │     │  • Connection Pooling      │     │  • Unique Feedback Constraint│
└───────────────────────────┘     └────────────────────────────┘     └──────────────────────────────┘
```

### Data Flow: Candidate Lifecycle
```
Candidate Created → [Candidates Page]
       │
       ▼ (Move to Pipeline)
  Application Created → [Applications Page — Pipeline Stages]
       │
       ├── APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFERED → HIRED → [Employee]
       │                                                                                      │
       │                                                                                      ▼
       │                                                                              [Payroll Generation]
       │
       └── (Removed at any stage) → [Archive / Removed Page] → (Restore) → Back to APPLIED
```

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 8 | Component-based UI with hot module replacement |
| **Styling** | TailwindCSS 4 | Utility-first responsive design with dark mode |
| **Animations** | Framer Motion | Entrance animations and micro-interactions |
| **Charts** | Recharts | Interactive bar and pie chart visualizations |
| **Icons** | Lucide React | Consistent iconography system |
| **HTTP Client** | Axios | Request/response interceptors for JWT management |
| **Backend** | Node.js, Express 5 | RESTful API server with async/await |
| **Database** | MySQL 8, mysql2 | Connection pooling, parameterized queries, stored procedures |
| **Authentication** | JWT (jsonwebtoken) | Stateless token-based auth with 8-hour expiry |
| **Password Security** | bcryptjs | 12-round salt hashing |
| **Security** | Custom middleware | Rate limiting, CORS, security headers, input validation |

---

## 🗄 Database Design

The database enforces business rules at the SQL level — not just in application code — ensuring data integrity even if the API is bypassed:

### Core Tables
| Table | Purpose | Key Constraints |
|-------|---------|----------------|
| `users` | Admin accounts | Unique email, bcrypt password hash |
| `candidate` | Candidate profiles | `is_archived` flag, `job_role` ENUM (15 roles), unique email |
| `application` | Pipeline entries | `is_archived` flag, `archived_stage` tracking, foreign key to candidate |
| `interview_feedback` | Evaluation scores | Unique constraint on `(application_id, user_id)` — one feedback per interviewer |
| `employee` | Hired candidate records | `job_role` ENUM, foreign key to candidate |
| `compensation_offer` | Salary and bonus data | Linked to employee |
| `payroll_transaction` | Monthly payroll records | Employee/month/year composite |
| `payment_record` | Payment status tracking | `PENDING` / `COMPLETED` |
| `status_history` | Full audit trail of every status transition | Populated by trigger |
| `audit_log` | General-purpose audit logging | Populated by trigger |

### Stored Procedures
| Procedure | What It Does |
|-----------|-------------|
| `hire_candidate(app_id, dept, salary, bonus)` | Atomically creates employee + compensation records and updates application status within a transaction |
| `generate_payroll(emp_id, month, year)` | Creates payroll and payment records from compensation data with duplicate prevention |
| `filter_candidates(minCGPA, minExp, maxSalary)` | Server-side multi-criteria filtering via prepared statements |

### Triggers
| Trigger | Purpose |
|---------|---------|
| `before_insert_feedback` | Auto-calculates `overall_score` = 60% technical + 40% communication |
| `after_application_status_update` | Records every status transition in `status_history` and `audit_log` |
| `validate_feedback_insert` | Blocks feedback insertion unless application status is `INTERVIEWED` |

### Functions
| Function | Purpose |
|----------|---------|
| `calculate_score(tech, comm)` | Deterministic weighted score calculation |

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

```bash
mysql -u root -p < database/SQL\ Code.sql
```

This creates the `urpms` database with all tables, stored procedures, triggers, functions, and seed data.

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (use `.env.example` as a template):
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

The API runs at `http://localhost:3000`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173`.

### 5. First Login

The first registered user automatically becomes the **ADMIN**. All subsequent registrations require admin authentication.

---

## 📡 API Reference

All endpoints (except auth) require a valid JWT in the `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user (first user auto-becomes ADMIN) | None / Admin |
| `POST` | `/auth/login` | Login and receive JWT token | None |

### Candidates
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/candidates` | List active candidates not in pipeline (`minCgpa`, `maxCgpa`, `minExperience`, `job_role` filters) | User |
| `POST` | `/candidates` | Create a new candidate with job role | User |
| `DELETE` | `/candidates/bulk` | Soft-archive candidates matching filter criteria | Admin |

### Applications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/applications` | List active (non-archived) applications with latest feedback | User |
| `GET` | `/applications/filter` | Multi-criteria filter (CGPA, experience, salary, score) | User |
| `POST` | `/applications` | Create application for a candidate | Admin |
| `PUT` | `/applications/:id/status` | Update status with state machine validation | Admin |
| `PUT` | `/applications/:id/schedule-interview` | Schedule interview with date and interviewer | Admin |
| `PUT` | `/applications/:id/interviewed` | Mark as interviewed | Admin |
| `POST` | `/applications/:id/feedback` | Submit interview feedback (once per user) | Admin |
| `POST` | `/applications/:id/hire` | Hire via stored procedure | Admin |
| `DELETE` | `/applications/:id` | Soft-archive single application | Admin |
| `DELETE` | `/applications/bulk` | Soft-archive by position + stage | Admin |
| `POST` | `/applications/close-position` | Close position (archive all non-hired/scheduled) | Admin |

### Archive (Removed Records)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/archive/candidates` | Fetch all archived candidates with full details | User |
| `GET` | `/archive/applications` | Fetch all archived applications with feedback scores | User |
| `POST` | `/archive/candidates/:id/restore` | Restore candidate to active pool | Admin |
| `POST` | `/archive/applications/:id/restore` | Restore application to APPLIED (wipes old feedback) | Admin |

### Employees & Payroll
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/employees` | List all employees with candidate details | User |
| `POST` | `/payroll/generate` | Generate payroll for employee/month/year | Admin |
| `GET` | `/payroll/payments` | List all payroll records with payment status | User |
| `PUT` | `/payroll/payment/:id` | Update payment status | Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard/metrics` | KPIs, pipeline distribution, department breakdown | User |

---

## 🔐 Security

| Layer | Implementation | Details |
|-------|---------------|---------|
| **Password Hashing** | bcryptjs | 12 salt rounds |
| **JWT Tokens** | jsonwebtoken | 8-hour expiry, mandatory `JWT_SECRET` (server exits if unset) |
| **Role-Based Access** | Custom middleware | `requireRole("ADMIN")` on all mutating endpoints |
| **Rate Limiting** | In-memory counter | 10 login attempts per 15 minutes per IP+email composite key |
| **Security Headers** | Custom middleware | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy |
| **CORS** | express cors | Restricted to configured `FRONTEND_ORIGIN` |
| **Input Validation** | Custom validators | Email format, string length limits, numeric ranges, CGPA bounds (0–10), score bounds (0–100) |
| **SQL Injection Prevention** | Parameterized queries | All database queries use `?` placeholders via mysql2 |
| **Body Size Limit** | Express JSON parser | 100KB maximum request body |
| **Graceful Shutdown** | Signal handlers | SIGTERM/SIGINT cleanly close HTTP server and database pool |

---

## 📁 Project Structure

```
urpms-project/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express server: CORS, routing, error handling, graceful shutdown
│   │   ├── config/
│   │   │   └── db.js                 # MySQL connection pool (10 connections, promise wrapper)
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification, role-based guards, token extraction
│   │   │   └── security.js           # Security headers, configurable rate limiter factory
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # Login, registration, first-user admin bootstrap
│   │   │   ├── candidate.routes.js   # CRUD with pipeline isolation (LEFT JOIN), bulk archive
│   │   │   ├── application.routes.js # 7-stage pipeline, interview scheduling, feedback, hiring
│   │   │   ├── archive.routes.js     # Soft-delete archive retrieval and restore operations
│   │   │   ├── employees.routes.js   # Employee listing with candidate join
│   │   │   ├── payroll.routes.js     # Payroll generation (stored proc) and payment tracking
│   │   │   └── dashboard.routes.js   # Live analytics (excludes archived data)
│   │   └── utils/
│   │       └── validation.js         # Reusable input validators (email, ranges, types)
│   ├── update_db_archive.js          # Migration script: ENUM constraints + archive columns
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js                # Axios client with JWT interceptor + 401 auto-logout
│   │   ├── components/
│   │   │   ├── AddCandidate.jsx      # Candidate creation form with job role ENUM select
│   │   │   ├── KPICard.jsx           # Animated metric card (Framer Motion)
│   │   │   ├── Sidebar.jsx           # Vertical navigation with corporate branding
│   │   │   └── Topbar.jsx            # Header with dark mode toggle + logout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # KPIs, pipeline bar chart, department pie chart
│   │   │   ├── Candidates.jsx        # Isolated staging area with advanced filters + bulk archive
│   │   │   ├── Applications.jsx      # Full pipeline management with inline forms
│   │   │   ├── Payroll.jsx           # Payroll generation and payment tracking
│   │   │   ├── Removed.jsx           # Archive dashboard with restore functionality
│   │   │   └── Login.jsx             # Authentication form
│   │   ├── App.jsx                   # Root component with page routing
│   │   └── index.css                 # Global styles, theme variables, dark mode
│   ├── index.html
│   └── package.json
│
├── database/
│   └── SQL Code.sql                  # Complete schema: tables, procedures, triggers, functions, seed data
│
└── README.md
```

---

<div align="center">

**Built for modern HR operations. Database-centric by design.**

*URPMS demonstrates full-stack engineering across React, Node.js, and MySQL — with production-grade security, database-level business logic, and enterprise audit compliance.*

</div>
