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

The system tracks candidates through a structured recruitment pipeline (`APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFERED → HIRED`), captures interview evaluations, converts hires into employees, and manages payroll generation and payment tracking — all through a modern, responsive dashboard.

---

## ✨ Features

### Recruitment Pipeline
- **Candidate Management** — Create, browse, and filter candidates by CGPA & experience
- **Application Pipeline** — Enforce valid state transitions through a 7-stage hiring workflow
- **Interview Scheduling** — Schedule interviews with date/time and interviewer assignment
- **Structured Feedback** — Capture technical, communication, and overall scores with remarks
- **Automated Hiring** — Convert offered candidates into employees via database stored procedure

### Payroll & Finance
- **Payroll Generation** — Generate monthly payroll records using stored procedures
- **Payment Tracking** — Track and update payment completion status
- **Compensation Management** — Store base salary and bonus percentage per employee

### Dashboard & Analytics
- **KPI Cards** — Total applications, hired count, shortlisted count, conversion rate
- **Pipeline Distribution** — Interactive bar chart showing candidates at each stage
- **Department Breakdown** — Pie chart visualization of employees by department
- **Real-time Metrics** — All dashboard data is computed live from the database

### Platform
- **JWT Authentication** — Secure login with role-based access control
- **Dark Mode** — Full dark/light theme support persisted in localStorage
- **Rate Limiting** — Login endpoint protected against brute force attacks
- **Input Validation** — Comprehensive server-side validation on all endpoints
- **Connection Pooling** — MySQL connection pool for reliable, high-performance queries

---

## 🏗 Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│   React Dashboard   │────▶│   Express REST API   │────▶│     MySQL Database      │
│                     │     │                      │     │                         │
│  • Vite + HMR       │     │  • JWT Auth          │     │  • Stored Procedures    │
│  • TailwindCSS      │     │  • Input Validation  │     │  • Triggers             │
│  • Recharts         │     │  • Rate Limiting     │     │  • Functions            │
│  • Framer Motion    │     │  • CORS + Security   │     │  • Audit Logging        │
│  • Axios + Tokens   │     │  • Connection Pool   │     │  • Status History       │
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
| `candidate` | Candidate profiles with academic and professional data |
| `application` | Recruitment pipeline entries with status tracking |
| `interview_feedback` | Structured interview evaluation scores |
| `employee` | Hired candidate records with department assignment |
| `compensation_offer` | Salary and bonus data per employee |
| `payroll_transaction` | Monthly payroll records |
| `payment_record` | Payment status tracking (PENDING/COMPLETED) |
| `status_history` | Audit trail of all status transitions |
| `audit_log` | General-purpose audit logging |

### Stored Procedures
- **`hire_candidate`** — Atomically creates employee + compensation records and updates application status within a transaction
- **`generate_payroll`** — Creates payroll and payment records from compensation data
- **`filter_candidates`** — Server-side filtering by CGPA, experience, and salary
- **`shortlist_candidates`** — Cursor-based batch shortlisting of high-CGPA candidates

### Triggers
- **`before_insert_feedback`** — Auto-calculates overall score (60% technical + 40% communication)
- **`after_application_status_update`** — Records status transitions in `status_history` and `audit_log`
- **`validate_feedback_insert`** — Blocks feedback insertion unless application status is `INTERVIEWED`

### Functions
- **`calculate_score(tech, comm)`** — Weighted score calculation (deterministic)

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

The API will be available at `http://localhost:3000`.

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

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user (first user auto-becomes ADMIN) |
| `POST` | `/auth/login` | Login and receive JWT token |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/candidates` | List all candidates (supports `minCgpa`, `minExperience` filters) |
| `POST` | `/candidates` | Create a new candidate profile |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applications` | List all applications with feedback (supports `minScore` filter) |
| `GET` | `/applications/filter` | Filter by CGPA, experience, salary, and score |
| `POST` | `/applications` | Create a new application for a candidate |
| `PUT` | `/applications/:id/status` | Update application status (with transition validation) |
| `PUT` | `/applications/:id/schedule-interview` | Schedule an interview |
| `PUT` | `/applications/:id/interviewed` | Mark application as interviewed |
| `POST` | `/applications/:id/feedback` | Submit interview feedback scores |
| `POST` | `/applications/:id/hire` | Hire candidate (calls stored procedure) |
| `DELETE` | `/applications/:id` | Remove application from pipeline |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/employees` | List all employees with candidate details |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payroll/generate` | Generate payroll for an employee/month/year |
| `GET` | `/payroll/payments` | List all payroll records with payment status |
| `PUT` | `/payroll/payment/:id` | Update payment status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/metrics` | Get all dashboard KPIs, pipeline data, and department data |

---

## 🔐 Security

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcryptjs with 12 salt rounds |
| **JWT Tokens** | 8-hour expiry, mandatory `JWT_SECRET` (no fallback) |
| **Role-Based Access** | Admin-only mutations, authentication on all data routes |
| **Rate Limiting** | 10 login attempts per 15 minutes per IP+email |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy |
| **CORS** | Restricted to configured frontend origin |
| **Input Validation** | Email format, string length limits, numeric ranges, CGPA bounds, score bounds |
| **SQL Injection** | All queries use parameterized statements |
| **Body Size Limit** | Express JSON body limited to 100KB |
| **Graceful Shutdown** | SIGTERM/SIGINT handlers cleanly close HTTP server and database pool |

---

## 📁 Project Structure

```
urpms-project/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express server entry point
│   │   ├── config/
│   │   │   └── db.js                 # MySQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication & role guards
│   │   │   └── security.js           # Security headers & rate limiter
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # Login & registration
│   │   │   ├── candidate.routes.js   # Candidate CRUD
│   │   │   ├── application.routes.js # Pipeline management
│   │   │   ├── employees.routes.js   # Employee listing
│   │   │   ├── payroll.routes.js     # Payroll generation & payments
│   │   │   └── dashboard.routes.js   # Analytics metrics
│   │   └── utils/
│   │       └── validation.js         # Input validation helpers
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js                # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── AddCandidate.jsx      # Candidate creation form
│   │   │   ├── KPICard.jsx           # Animated metric card
│   │   │   ├── Sidebar.jsx           # Navigation with active state
│   │   │   └── Topbar.jsx            # Header with dark mode toggle
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # KPIs, charts, and analytics
│   │   │   ├── Candidates.jsx        # Candidate list and pipeline entry
│   │   │   ├── Applications.jsx      # Full pipeline management UI
│   │   │   ├── Payroll.jsx           # Payroll generation and tracking
│   │   │   └── Login.jsx             # Authentication form
│   │   ├── App.jsx                   # Root component with routing
│   │   └── index.css                 # Global styles and theme
│   ├── index.html
│   └── package.json
│
├── database/
│   └── SQL Code.sql                  # Complete schema, procedures, triggers & seed data
│
└── README.md
```

---

<div align="center">

*Built for modern HR operations. Database-centric by design.*

</div>
