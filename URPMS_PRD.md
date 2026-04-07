# Unified Recruitment & Payroll Management System (URPMS) — PRD

## 1. Overview
URPMS is a database-centric system to manage recruitment workflows, employee onboarding, and payroll processing with ACID-compliant transactions and full auditability.

---

## 2. Tech Stack
- Backend: Node.js + Express  
- Database: MySQL  
- Query Method: Raw SQL (mysql2)  
- Core Logic: Stored Procedures  
- Audit: Triggers + Audit Log  
- Version Control: Git  

---

## 3. Architecture
Frontend (React - future)  
→ Backend (Express APIs)  
→ MySQL Database  
→ Stored Procedures + Triggers  

---

## 4. User Roles & Access Control
- Admin: Full access  
- Recruiter: Candidate, Application, Hiring  
- HR Manager: Employee, Payroll  
- Finance Officer: Payroll, Payments  
- Auditor: Read-only  

---

## 5. Core Modules

### 5.1 Recruitment Module
- Candidate Management  
- Job Management  
- Application Tracking  

**Workflow:**  
APPLIED → SCREENING → SHORTLISTED → INTERVIEWED → OFFERED → HIRED  
↘ REJECTED  

---

### 5.2 Employee Module
- Employee creation  
- Department assignment  

---

### 5.3 Payroll Module
- Payroll cycles  
- Salary computation  
- Payment tracking  

---

### 5.4 Audit System
- Trigger-based logging  
- Before/after state storage  

---

## 6. Metrics

### Recruitment
- Candidates per stage  
- Conversion rate  
- Offers vs accepted  
- Candidates by source  

### Employee
- Employees per department  

### Payroll
- Salary distribution by department  

---

## 7. Database Schema (Logical)

### USERS
- user_id (PK)  
- email (UNIQUE)  
- password_hash  
- role  
- is_active  
- created_at  

### CANDIDATE
- candidate_id (PK)  
- first_name  
- last_name  
- email (UNIQUE)  
- phone  
- created_at  
- is_active  

### JOB
- job_id (PK)  
- job_code (UNIQUE)  
- job_title  
- department_id (FK)  
- status  
- created_at  

### APPLICATION
- application_id (PK)  
- candidate_id (FK)  
- job_id (FK)  
- assigned_recruiter_id (FK)  
- source_id (FK)  
- status  
- applied_at  
- last_updated_at  
- UNIQUE(candidate_id, job_id)  

### STATUS_HISTORY
- history_id (PK)  
- application_id (FK)  
- old_status  
- new_status  
- changed_by  
- changed_at  

### EMPLOYEE
- employee_id (PK)  
- application_id (FK UNIQUE)  
- employee_code (UNIQUE)  
- department_id (FK)  
- joining_date  
- status  

### COMPENSATION_OFFER
- offer_id (PK)  
- employee_id (FK UNIQUE)  
- base_salary  
- bonus_percentage  
- effective_from  

### PAYROLL_CYCLE
- cycle_id (PK)  
- month  
- year  
- status  

### PAYROLL_TRANSACTION
- payroll_id (PK)  
- employee_id (FK)  
- cycle_id (FK)  
- gross_salary  
- total_deductions  
- net_salary  
- generated_at  
- UNIQUE(employee_id, cycle_id)  

### SALARY_COMPONENT
- component_id (PK)  
- component_name  
- component_type  

### PAYROLL_COMPONENT_MAPPING
- mapping_id (PK)  
- payroll_id (FK)  
- component_id (FK)  
- amount  

### PAYMENT_RECORD
- payment_id (PK)  
- payroll_id (FK UNIQUE)  
- payment_date  
- payment_mode  
- transaction_reference  
- payment_status  

### AUDIT_LOG
- audit_id (PK)  
- entity_name  
- entity_id  
- action  
- changed_by_user_id  
- changed_at  
- before_data (JSON)  
- after_data (JSON)  

---

## 8. Stored Procedures

### hire_candidate(application_id, user_id)
- Validate status  
- Update application  
- Insert employee  
- Insert compensation  
- Log status history  
- Audit log  

### generate_payroll(employee_id, cycle_id)
- Validate cycle  
- Compute salary  
- Insert payroll  
- Insert components  
- Insert payment  
- Audit log  

---

## 9. Transactions
- BEGIN  
- COMMIT  
- ROLLBACK  

Ensures ACID compliance.

---

## 10. APIs
- POST /candidates  
- GET /candidates  
- POST /applications  
- PUT /applications/:id/status  
- POST /applications/:id/hire  
- GET /employees  
- POST /payroll/generate  
- GET /dashboard/metrics  

---

## 11. Evaluation Focus
- SQL queries  
- Stored procedures  
- Triggers  
- Transactions  
- Normalization  

---

## 12. Future Enhancements
- React dashboard  
- Authentication  
- Analytics  
- AI resume parsing  
