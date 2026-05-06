# Unified Recruitment & Payroll Management System (URPMS) - Product Requirements Document

## 1. Product Summary
URPMS is a full-stack internal operations platform for managing candidate intake, recruitment pipeline progression, interview evaluation, employee onboarding, payroll generation, and payment tracking.

The system is built as a database-centric business application: the backend uses raw SQL with MySQL, the frontend provides a recruiter-friendly SaaS-style dashboard, and critical workflow logic is enforced through a mix of application-level validation, stored procedures, and database triggers.

This document reflects the current implemented project state in the repository.

## 2. Product Goals
- Centralize recruitment and payroll operations in one system.
- Track candidates from profile creation through hiring.
- Enforce a consistent hiring pipeline with valid state transitions.
- Support interview scheduling and structured interview feedback.
- Convert hired applications into employees using database procedures.
- Generate payroll records and track payment completion.
- Provide operational visibility through dashboard metrics and charts.
- Maintain auditability and DBMS-heavy logic for academic/demo/reporting purposes.

## 3. Primary Users
- Admin
  - Authenticated user with full operational access to candidate, application, hiring, and payroll actions.
- Recruiter / HR operator
  - Conceptual business user represented by the current authenticated dashboard workflow.
  - In the current implementation, most mutating actions are guarded at `ADMIN` level.

## 4. Current Scope

### Included
- JWT-based authentication
- Candidate creation and browsing
- Candidate filtering by numeric criteria
- Moving candidates into the hiring pipeline
- Application pipeline management
- Interview scheduling
- Interview feedback capture
- Hiring through stored procedure
- Employee listing
- Payroll generation through stored procedure
- Payment status updates
- Dashboard analytics
- Dark mode UI

### Not Included
- Multi-tenant support
- Public candidate portal
- Email notifications
- Calendar integration
- File uploads / resume storage
- Advanced role-separated frontend experiences
- Full reporting export workflows

## 5. Technology Stack
- Frontend
  - React
  - Vite
  - TailwindCSS
  - Framer Motion
  - Recharts
- Backend
  - Node.js
  - Express
- Database
  - MySQL
  - Raw SQL via `mysql2`
- Authentication
  - JWT
- Security / Platform
  - CORS
  - Basic security headers
  - Login rate limiting
- Database name
  - `urpms`

## 6. High-Level Architecture
Frontend React dashboard
-> Axios API client with bearer token injection
-> Express REST API
-> MySQL database
-> Stored procedures, functions, and triggers

## 7. Frontend Experience
The frontend is a single authenticated dashboard shell with:
- Sidebar navigation
  - Dashboard
  - Candidates
  - Applications
  - Payroll
- Topbar
  - Page title
  - Dark mode toggle
  - Logout
- Responsive card-based layout
- Dark mode support persisted in `localStorage`

## 8. Core Modules

### 8.1 Authentication
Purpose:
- Secure access to the dashboard and backend APIs.

Current behavior:
- Login via email and password.
- JWT token stored client-side.
- Protected API calls automatically send `Authorization: Bearer <token>`.
- First registered user becomes `ADMIN`.
- After the first user exists, only an authenticated `ADMIN` can register new users.
- Tokens expire after 8 hours.

### 8.2 Candidate Management
Purpose:
- Maintain structured candidate profiles before they enter the pipeline.

Supported candidate data:
- `first_name`
- `last_name`
- `email`
- `phone`
- `college_name`
- `degree`
- `specialization`
- `cgpa`
- `experience_years`
- `skills`

Current UI behavior:
- Add Candidate form
- Candidate list view
- Numeric filters
  - Minimum CGPA
  - Minimum experience
- Per-candidate action to move that candidate into the hiring pipeline

### 8.3 Application / Recruitment Pipeline
Purpose:
- Track each hiring application through the official recruitment workflow.

Application data currently used:
- `candidate_id`
- `job_role`
- `expected_salary`
- `notice_period`
- `application_source`
- `status`
- `interview_date`
- `interviewer_name`

Official pipeline:
- `APPLIED`
- `SHORTLISTED`
- `INTERVIEW_SCHEDULED`
- `INTERVIEWED`
- `OFFERED`
- `HIRED`
- `REJECTED`

Allowed transitions:
- `APPLIED -> SHORTLISTED`
- `APPLIED -> REJECTED`
- `SHORTLISTED -> INTERVIEW_SCHEDULED`
- `SHORTLISTED -> REJECTED`
- `INTERVIEW_SCHEDULED -> INTERVIEWED`
- `INTERVIEW_SCHEDULED -> REJECTED`
- `INTERVIEWED -> OFFERED`
- `INTERVIEWED -> REJECTED`
- `OFFERED -> HIRED`
- `OFFERED -> REJECTED`

Current application UI behavior:
- Application cards show:
  - application number
  - candidate name
  - email
  - job role
  - source
  - stage
  - expected salary
  - notice period
  - CGPA
  - experience
  - specialization
  - interview date
  - interviewer
  - latest interview scores
  - latest remarks
- Stage-specific actions:
  - `APPLIED`: Shortlist, Reject
  - `SHORTLISTED`: Schedule Interview, Reject
  - `INTERVIEW_SCHEDULED`: Mark Interviewed, Reject
  - `INTERVIEWED`: Save Feedback, Offer, Reject
  - `OFFERED`: Hire, Reject
  - `HIRED`: terminal badge/state
  - `REJECTED`: terminal badge/state
- Remove from pipeline action
- On-screen success/error banners

### 8.4 Interview Feedback
Purpose:
- Capture structured recruiter/interviewer evaluation after an interview is completed.

Stored data:
- `technical_score`
- `communication_score`
- `overall_score`
- `remarks`

Business rules:
- Feedback is allowed only when application status is `INTERVIEWED`.
- A database trigger blocks feedback insertion for invalid statuses.
- `overall_score` is computed in the database using the `calculate_score` function and trigger logic.

### 8.5 Hiring and Employee Creation
Purpose:
- Convert an offered application into a hired employee record.

Current behavior:
- Hiring is initiated only from `OFFERED`.
- Backend calls stored procedure:
  - `hire_candidate(application_id, department, base_salary, bonus_percentage)`
- Successful hire updates the application to `HIRED`.
- Employee data becomes visible in the employee listing and available to payroll workflows.

### 8.6 Payroll
Purpose:
- Generate payroll records and track completion status.

Current behavior:
- Payroll can be generated for an employee, month, and year.
- Backend calls stored procedure:
  - `generate_payroll(employee_id, month, year)`
- Payment status can be updated from `PENDING` to `COMPLETED`.

Current UI behavior:
- Employee selector
- Month and year entry
- Generate Payroll action
- Payroll list showing:
  - payroll ID
  - employee ID
  - payroll month/year
  - gross salary
  - payment status
- Mark Completed action for pending payments

### 8.7 Dashboard and Analytics
Purpose:
- Provide quick operational visibility to admins/recruiters.

Current dashboard metrics:
- Total applications
- Hired count
- In-screening KPI slot
  - Note: the current UI label still says "In Screening" even though the official status model no longer uses `SCREENING`
- Conversion rate
- Candidates/applications by stage
- Employees by department

Current visualization:
- KPI cards
- Bar chart for pipeline distribution
- Pie chart for employees by department
- Styled hover tooltips with readable contrast

## 9. Database-Centric Design
URPMS is intentionally DBMS-heavy. The project relies on MySQL not only for persistence but also for business workflow enforcement.

### Database objects currently relevant to the implemented system
- Tables
  - `users`
  - `candidate`
  - `application`
  - `interview_feedback`
  - `employee`
  - `payroll_transaction`
  - `payment_record`
  - `status_history`
- Stored procedures
  - `hire_candidate`
  - `generate_payroll`
  - `filter_candidates`
  - `shortlist_candidates`
- Function
  - `calculate_score`
- Triggers
  - status audit trigger
  - auto interview score trigger
  - feedback validation trigger preventing feedback before `INTERVIEWED`

## 10. Data Model Summary

### Users
- `user_id`
- `email`
- `password_hash`
- `role`

### Candidate
- `candidate_id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `college_name`
- `degree`
- `specialization`
- `cgpa`
- `experience_years`
- `skills`
- `created_at`

### Application
- `application_id`
- `candidate_id`
- `job_role`
- `expected_salary`
- `notice_period`
- `application_source`
- `status`
- `applied_at`
- `interview_date`
- `interviewer_name`

### Interview Feedback
- `feedback_id`
- `application_id`
- `technical_score`
- `communication_score`
- `overall_score`
- `remarks`

### Employee
- `employee_id`
- `candidate_id`
- `department`
- `joining_date`

### Payroll Transaction
- `payroll_id`
- `employee_id`
- `payroll_month`
- `payroll_year`
- `gross_salary`

### Payment Record
- `payroll_id`
- `payment_status`

## 11. Functional Requirements

### Authentication Requirements
- System must support admin registration and login.
- System must hash passwords before storage.
- System must issue expiring JWTs.
- System must protect backend business routes with JWT authentication.

### Candidate Requirements
- Admin must be able to create candidate profiles.
- System must validate email format and numeric fields.
- System must support filtering candidates by CGPA and experience.
- Admin must be able to move a specific candidate into the application pipeline.

### Application Requirements
- Admin must be able to create applications for candidates.
- System must display enriched application details by joining candidate and feedback data.
- System must enforce valid status transitions.
- System must allow deleting an application from the pipeline.
- System must support filtering applications using:
  - minimum CGPA
  - minimum experience
  - maximum salary
  - minimum interview score

### Interview Requirements
- Admin must be able to schedule an interview for shortlisted candidates.
- Admin must be able to mark a scheduled application as interviewed.
- System must only allow feedback insertion once status is `INTERVIEWED`.
- System must surface DB trigger errors clearly in API responses.

### Hiring Requirements
- System must only allow hiring from `OFFERED`.
- System must hire through stored procedure, not direct ad hoc SQL.
- Successful hire must reflect in application status and employee availability.

### Payroll Requirements
- Admin must be able to generate payroll for an employee/month/year combination.
- System must use the stored procedure for payroll generation.
- Admin must be able to mark payment records as completed.

### Dashboard Requirements
- System must provide stage distribution data.
- System must provide conversion rate data.
- System must provide employees-by-department data.

## 12. API Surface

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Candidates
- `POST /candidates`
- `GET /candidates`

### Applications
- `GET /applications`
- `GET /applications/filter`
- `POST /applications`
- `PUT /applications/:id/status`
- `PUT /applications/:id/schedule-interview`
- `PUT /applications/:id/interviewed`
- `POST /applications/:id/feedback`
- `POST /applications/:id/hire`
- `DELETE /applications/:id`

### Employees
- `GET /employees`

### Payroll
- `POST /payroll/generate`
- `GET /payroll/payments`
- `PUT /payroll/payment/:payroll_id`

### Dashboard
- `GET /dashboard/metrics`

## 13. Security and Validation
- JWT-protected routes
- Bearer token injection from frontend Axios client
- Login rate limiting
- Basic security headers
- CORS restricted by configured frontend origin
- Input validation for:
  - email
  - required strings
  - positive integers
  - non-negative numeric values
  - CGPA range
  - interview score range

## 14. UX Requirements
- Maintain dark mode and light mode support
- Keep a modern SaaS-style card dashboard
- Use inline banners instead of browser alerts for operational feedback
- Support loading states for async data screens
- Support empty states for filters and list pages
- Keep workflow actions visible and context-specific

## 15. Non-Functional Requirements
- Preserve existing folder structure and modular backend routing
- Avoid ORM usage; all data access must remain raw SQL
- Keep SQL parameterized
- Preserve compatibility with MySQL stored procedures and triggers
- Keep frontend component-based
- Ensure basic responsiveness across desktop and laptop layouts

## 16. Known Current Gaps
- The dashboard KPI label "In Screening" is outdated relative to the official status model and should be renamed in a future polish pass.
- The frontend is currently single-role in experience even though the database supports role-based users.
- Payroll UI is operational but intentionally simple and does not yet show a richer breakdown of salary components.
- The system is designed for internal/admin use and not for public self-service traffic.

## 17. Suggested Evaluation Angles for Claude
If this PRD is given to Claude for project analysis/reporting, the most useful review areas are:
- product completeness vs current implemented scope
- database-centric architecture quality
- hiring workflow correctness
- API design consistency
- security posture for an internal admin tool
- frontend UX quality for recruiter operations
- maintainability and future extensibility
- gaps between current implementation and production-grade enterprise expectations

## 18. Future Enhancement Opportunities
- Role-specific dashboards for recruiter, HR, finance, and auditor personas
- Better hiring offer configuration UI instead of fixed frontend defaults
- Interview panel management and scheduling integrations
- Rich payroll breakdown and downloadable payslips
- Search, pagination, and sorting for large candidate/application sets
- Notification workflows
- Exportable reports
- Resume uploads and parsing
- Test suite expansion and CI automation
