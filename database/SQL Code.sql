-- =========================================
-- URPMS DATABASE
-- Unified Recruitment & Payroll Management System
-- =========================================

DROP DATABASE IF EXISTS urpms;
CREATE DATABASE urpms;

USE urpms;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'RECRUITER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CANDIDATES
-- =========================================

CREATE TABLE candidate (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),

    college_name VARCHAR(255),
    degree VARCHAR(100),
    specialization VARCHAR(100),

    cgpa DECIMAL(3,2),

    experience_years INT DEFAULT 0,

    skills TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- APPLICATIONS
-- =========================================

CREATE TABLE application (
    application_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT NOT NULL,

    job_role VARCHAR(100) NOT NULL,

    expected_salary DECIMAL(10,2),

    notice_period INT,

    application_source VARCHAR(100),

    status VARCHAR(50) DEFAULT 'APPLIED',

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id)
    REFERENCES candidate(candidate_id)
);

-- =========================================
-- STATUS HISTORY
-- =========================================

CREATE TABLE status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,

    application_id INT,

    old_status VARCHAR(50),
    new_status VARCHAR(50),

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id)
    REFERENCES application(application_id)
);

-- =========================================
-- EMPLOYEES
-- =========================================

CREATE TABLE employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT UNIQUE,

    department VARCHAR(100),

    joining_date DATE,

    FOREIGN KEY (candidate_id)
    REFERENCES candidate(candidate_id)
);

-- =========================================
-- COMPENSATION
-- =========================================

CREATE TABLE compensation_offer (
    compensation_id INT AUTO_INCREMENT PRIMARY KEY,

    employee_id INT,

    base_salary DECIMAL(12,2),

    bonus_percentage DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
    REFERENCES employee(employee_id)
);

-- =========================================
-- PAYROLL
-- =========================================

CREATE TABLE payroll_transaction (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,

    employee_id INT,

    payroll_month INT,
    payroll_year INT,

    gross_salary DECIMAL(12,2),

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
    REFERENCES employee(employee_id)
);

-- =========================================
-- PAYMENT RECORD
-- =========================================

CREATE TABLE payment_record (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,

    payroll_id INT,

    payment_status VARCHAR(50) DEFAULT 'PENDING',

    payment_date TIMESTAMP NULL,

    FOREIGN KEY (payroll_id)
    REFERENCES payroll_transaction(payroll_id)
);

-- =========================================
-- INTERVIEW FEEDBACK
-- =========================================

CREATE TABLE interview_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,

    application_id INT,

    technical_score INT,
    communication_score INT,

    overall_score INT,

    remarks TEXT,

    FOREIGN KEY (application_id)
    REFERENCES application(application_id)
);

-- =========================================
-- AUDIT LOG
-- =========================================

CREATE TABLE audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,

    table_name VARCHAR(100),
    action_type VARCHAR(50),

    record_id INT,

    old_value TEXT,
    new_value TEXT,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- FUNCTION
-- =========================================

DELIMITER $$

CREATE FUNCTION calculate_score(
    tech INT,
    comm INT
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN (tech * 0.6 + comm * 0.4);
END $$

DELIMITER ;

-- =========================================
-- TRIGGER: AUTO SCORE
-- =========================================

DELIMITER $$

CREATE TRIGGER before_insert_feedback
BEFORE INSERT ON interview_feedback
FOR EACH ROW
BEGIN
    SET NEW.overall_score =
        calculate_score(
            NEW.technical_score,
            NEW.communication_score
        );
END $$

DELIMITER ;

-- =========================================
-- TRIGGER: STATUS AUDIT
-- =========================================

DELIMITER $$

CREATE TRIGGER after_application_status_update
AFTER UPDATE ON application
FOR EACH ROW
BEGIN

    IF OLD.status <> NEW.status THEN

        INSERT INTO status_history(
            application_id,
            old_status,
            new_status
        )
        VALUES(
            NEW.application_id,
            OLD.status,
            NEW.status
        );

        INSERT INTO audit_log(
            table_name,
            action_type,
            record_id,
            old_value,
            new_value
        )
        VALUES(
            'application',
            'UPDATE_STATUS',
            NEW.application_id,
            OLD.status,
            NEW.status
        );

    END IF;

END $$

DELIMITER ;

-- =========================================
-- STORED PROCEDURE: HIRE CANDIDATE
-- =========================================

DELIMITER $$

CREATE PROCEDURE hire_candidate(
    IN p_application_id INT,
    IN p_department VARCHAR(100),
    IN p_base_salary DECIMAL(12,2),
    IN p_bonus_percentage DECIMAL(5,2)
)
BEGIN

    DECLARE v_candidate_id INT;
    DECLARE v_employee_id INT;

    START TRANSACTION;

    SELECT candidate_id
    INTO v_candidate_id
    FROM application
    WHERE application_id = p_application_id;

    INSERT INTO employee(
        candidate_id,
        department,
        joining_date
    )
    VALUES(
        v_candidate_id,
        p_department,
        CURDATE()
    );

    SET v_employee_id = LAST_INSERT_ID();

    INSERT INTO compensation_offer(
        employee_id,
        base_salary,
        bonus_percentage
    )
    VALUES(
        v_employee_id,
        p_base_salary,
        p_bonus_percentage
    );

    UPDATE application
    SET status = 'HIRED'
    WHERE application_id = p_application_id;

    COMMIT;

END $$

DELIMITER ;

-- =========================================
-- STORED PROCEDURE: GENERATE PAYROLL
-- =========================================

DELIMITER $$

CREATE PROCEDURE generate_payroll(
    IN p_employee_id INT,
    IN p_month INT,
    IN p_year INT
)
BEGIN

    DECLARE v_salary DECIMAL(12,2);

    SELECT base_salary
    INTO v_salary
    FROM compensation_offer
    WHERE employee_id = p_employee_id;

    INSERT INTO payroll_transaction(
        employee_id,
        payroll_month,
        payroll_year,
        gross_salary
    )
    VALUES(
        p_employee_id,
        p_month,
        p_year,
        v_salary
    );

    INSERT INTO payment_record(
        payroll_id,
        payment_status
    )
    VALUES(
        LAST_INSERT_ID(),
        'PENDING'
    );

END $$

DELIMITER ;

-- =========================================
-- STORED PROCEDURE: FILTER CANDIDATES
-- =========================================

DELIMITER $$

CREATE PROCEDURE filter_candidates(
    IN p_min_cgpa DECIMAL(3,2),
    IN p_min_exp INT,
    IN p_max_salary DECIMAL(10,2)
)
BEGIN

    SELECT
        c.*,
        a.*
    FROM candidate c
    JOIN application a
        ON c.candidate_id = a.candidate_id
    WHERE c.cgpa >= p_min_cgpa
    AND c.experience_years >= p_min_exp
    AND a.expected_salary <= p_max_salary;

END $$

DELIMITER ;

-- =========================================
-- CURSOR PROCEDURE
-- =========================================

DELIMITER $$

CREATE PROCEDURE shortlist_candidates()
BEGIN

    DECLARE done INT DEFAULT 0;
    DECLARE v_candidate_id INT;

    DECLARE cur CURSOR FOR
        SELECT candidate_id
        FROM candidate
        WHERE cgpa >= 8;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET done = 1;

    OPEN cur;

    read_loop: LOOP

        FETCH cur INTO v_candidate_id;

        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE application
        SET status = 'SHORTLISTED'
        WHERE candidate_id = v_candidate_id;

    END LOOP;

    CLOSE cur;

END $$

DELIMITER ;

INSERT INTO candidate(
first_name,
last_name,
email,
phone,
college_name,
degree,
specialization,
cgpa,
experience_years,
skills
)
VALUES

('Rahul','Sharma','rahul1@test.com','9991110001','Thapar Institute','B.Tech','CSE',8.9,1,'Java,SQL,React'),

('Priya','Mehta','priya@test.com','9991110002','DTU','B.Tech','IT',9.1,0,'Python,ML'),

('Arjun','Kapoor','arjun@test.com','9991110003','NSUT','B.Tech','ECE',7.8,2,'Embedded,C++'),

('Sneha','Verma','sneha@test.com','9991110004','BITS Pilani','B.Tech','CSE',9.4,1,'React,Node'),

('Aman','Gupta','aman@test.com','9991110005','IIIT Delhi','B.Tech','CSAI',8.2,3,'AI,Python'),

('Ritika','Jain','ritika@test.com','9991110006','Thapar Institute','B.E','COE',8.7,0,'Java,Spring'),

('Kunal','Arora','kunal@test.com','9991110007','VIT','B.Tech','IT',7.5,2,'Angular,SQL'),

('Ishita','Bansal','ishita@test.com','9991110008','Manipal','B.Tech','CSE',8.8,1,'React,Firebase'),

('Dev','Malhotra','dev@test.com','9991110009','SRM','B.Tech','CSE',6.9,4,'PHP,Laravel'),

('Ananya','Singh','ananya@test.com','9991110010','PEC','B.Tech','ECE',9.0,1,'Data Science,Python');

INSERT INTO application(
candidate_id,
job_role,
expected_salary,
notice_period,
application_source,
status
)
VALUES

(1,'Software Engineer',800000,30,'LinkedIn','SCREENING'),

(2,'ML Engineer',1200000,0,'Referral','INTERVIEW'),

(3,'Embedded Engineer',700000,60,'Campus','APPLIED'),

(4,'Frontend Developer',900000,30,'LinkedIn','OFFERED'),

(5,'AI Engineer',1500000,90,'Naukri','HIRED'),

(6,'Backend Developer',850000,0,'Referral','SCREENING'),

(7,'Data Analyst',600000,30,'Campus','REJECTED'),

(8,'Frontend Developer',950000,15,'LinkedIn','INTERVIEW'),

(9,'PHP Developer',500000,60,'Naukri','APPLIED'),

(10,'Data Scientist',1400000,30,'Referral','HIRED');

INSERT INTO employee(
candidate_id,
department,
joining_date
)
VALUES

(5,'AI Research','2026-01-15'),
(10,'Data Science','2026-02-01');

INSERT INTO compensation_offer(
employee_id,
base_salary,
bonus_percentage
)
VALUES

(1,1500000,15),
(2,1400000,12);

INSERT INTO payroll_transaction(
employee_id,
payroll_month,
payroll_year,
gross_salary
)
VALUES

(1,4,2026,1500000),
(2,4,2026,1400000);

INSERT INTO payment_record(
payroll_id,
payment_status
)
VALUES

(1,'COMPLETED'),
(2,'PENDING');

INSERT INTO interview_feedback(
application_id,
technical_score,
communication_score,
remarks
)
VALUES

(1,8,7,'Good problem solving'),
(2,9,8,'Strong ML knowledge'),
(4,7,9,'Excellent communication'),
(8,8,8,'Balanced candidate');

CALL shortlist_candidates();

USE urpms;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE interview_feedback;

TRUNCATE TABLE payment_record;

TRUNCATE TABLE payroll_transaction;

TRUNCATE TABLE compensation_offer;

TRUNCATE TABLE employee;

TRUNCATE TABLE status_history;

TRUNCATE TABLE audit_log;

TRUNCATE TABLE application;

TRUNCATE TABLE candidate;

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE application
MODIFY COLUMN status ENUM(
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFERED',
  'HIRED',
  'REJECTED'
)
DEFAULT 'APPLIED';

ALTER TABLE application
ADD COLUMN interview_date DATETIME NULL;

ALTER TABLE application
ADD COLUMN interviewer_name VARCHAR(100) NULL;

DELIMITER $$

CREATE TRIGGER validate_feedback_insert
BEFORE INSERT ON interview_feedback
FOR EACH ROW
BEGIN

    DECLARE v_status VARCHAR(50);

    SELECT status
    INTO v_status
    FROM application
    WHERE application_id = NEW.application_id;

    IF v_status <> 'INTERVIEWED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Feedback allowed only after INTERVIEWED status';
    END IF;

END $$

DELIMITER ;

USE urpms;

-- =========================================
-- CANDIDATES
-- =========================================

INSERT INTO candidate (
first_name,last_name,email,phone,
college_name,degree,specialization,
cgpa,experience_years,skills
)
VALUES

('Rahul','Sharma','rahul@test.com','9991110001','Thapar Institute','B.Tech','CSE',8.9,1,'Java,SQL,React'),

('Priya','Mehta','priya@test.com','9991110002','DTU','B.Tech','IT',9.1,0,'Python,ML'),

('Arjun','Kapoor','arjun@test.com','9991110003','NSUT','B.Tech','ECE',7.8,2,'Embedded,C++'),

('Sneha','Verma','sneha@test.com','9991110004','BITS Pilani','B.Tech','CSE',9.4,1,'React,Node'),

('Aman','Gupta','aman@test.com','9991110005','IIIT Delhi','B.Tech','CSAI',8.2,3,'AI,Python'),

('Ritika','Jain','ritika@test.com','9991110006','Thapar Institute','B.E','COE',8.7,0,'Java,Spring'),

('Kunal','Arora','kunal@test.com','9991110007','VIT','B.Tech','IT',7.5,2,'Angular,SQL'),

('Ishita','Bansal','ishita@test.com','9991110008','Manipal','B.Tech','CSE',8.8,1,'React,Firebase'),

('Dev','Malhotra','dev@test.com','9991110009','SRM','B.Tech','CSE',6.9,4,'PHP,Laravel'),

('Ananya','Singh','ananya@test.com','9991110010','PEC','B.Tech','ECE',9.0,1,'Data Science,Python'),

('Rohit','Sood','rohit@test.com','9991110011','LPU','B.Tech','CSE',7.1,1,'JavaScript,Node'),

('Nikita','Khanna','nikita@test.com','9991110012','Chitkara','B.Tech','IT',8.4,2,'SQL,PowerBI'),

('Yash','Batra','yash@test.com','9991110013','PEC','B.Tech','Mechanical',7.9,0,'AutoCAD,C++'),

('Simran','Kaur','simran@test.com','9991110014','GNDU','BCA','CS',8.5,1,'React,Express'),

('Harsh','Agarwal','harsh@test.com','9991110015','DTU','B.Tech','SE',9.2,2,'Java,Spring'),

('Mehak','Chopra','mehak@test.com','9991110016','VIT','B.Tech','AI',8.9,1,'TensorFlow,Python'),

('Varun','Nanda','varun@test.com','9991110017','NSUT','B.Tech','IT',7.6,3,'Angular,Java'),

('Tanya','Sethi','tanya@test.com','9991110018','BITS Pilani','B.Tech','CSE',9.5,0,'DSA,C++'),

('Kabir','Bedi','kabir@test.com','9991110019','IIIT Hyderabad','B.Tech','CSE',9.3,2,'Backend,Node'),

('Pooja','Malik','pooja@test.com','9991110020','SRM','B.Tech','ECE',8.0,1,'Embedded,IoT'),

('Aditya','Rana','aditya@test.com','9991110021','PEC','B.Tech','CSE',7.4,2,'React,SQL'),

('Neha','Bajaj','neha@test.com','9991110022','Thapar Institute','B.Tech','COE',8.6,1,'ML,Python'),

('Sarthak','Goyal','sarthak@test.com','9991110023','LPU','B.Tech','IT',7.2,0,'JavaScript'),

('Jiya','Arora','jiya@test.com','9991110024','Manipal','B.Tech','AI',9.0,1,'AI,Deep Learning'),

('Manav','Khurana','manav@test.com','9991110025','VIT','B.Tech','CSE',8.1,2,'MERN Stack');

-- =========================================
-- APPLICATIONS
-- =========================================

INSERT INTO application (
candidate_id,
job_role,
expected_salary,
notice_period,
application_source,
status
)
VALUES

(1,'Software Engineer',800000,30,'LinkedIn','SHORTLISTED'),

(2,'ML Engineer',1200000,0,'Referral','INTERVIEWED'),

(3,'Embedded Engineer',700000,60,'Campus','APPLIED'),

(4,'Frontend Developer',900000,30,'LinkedIn','OFFERED'),

(5,'AI Engineer',1500000,90,'Naukri','HIRED'),

(6,'Backend Developer',850000,0,'Referral','SHORTLISTED'),

(7,'Data Analyst',600000,30,'Campus','REJECTED'),

(8,'Frontend Developer',950000,15,'LinkedIn','INTERVIEW_SCHEDULED'),

(9,'PHP Developer',500000,60,'Naukri','APPLIED'),

(10,'Data Scientist',1400000,30,'Referral','HIRED'),

(11,'Software Engineer',750000,30,'LinkedIn','SHORTLISTED'),

(12,'BI Analyst',650000,0,'Referral','SHORTLISTED'),

(13,'Mechanical Analyst',550000,45,'Campus','REJECTED'),

(14,'Full Stack Developer',950000,30,'LinkedIn','INTERVIEWED'),

(15,'Backend Engineer',1300000,60,'Referral','OFFERED'),

(16,'AI Engineer',1450000,30,'Naukri','HIRED'),

(17,'Software Engineer',850000,90,'Campus','SHORTLISTED'),

(18,'SDE Intern',400000,0,'LinkedIn','SHORTLISTED'),

(19,'Platform Engineer',1600000,60,'Referral','HIRED'),

(20,'IoT Engineer',700000,30,'Campus','INTERVIEW_SCHEDULED'),

(21,'Frontend Developer',850000,30,'LinkedIn','APPLIED'),

(22,'ML Engineer',1250000,0,'Referral','INTERVIEWED'),

(23,'Junior Developer',450000,0,'Campus','REJECTED'),

(24,'AI Researcher',1700000,30,'Naukri','OFFERED'),

(25,'MERN Developer',950000,60,'LinkedIn','SHORTLISTED');

-- =========================================
-- EMPLOYEES
-- =========================================

INSERT INTO employee (
candidate_id,
department,
joining_date
)
VALUES

(5,'AI Research','2026-01-15'),

(12,'Data Science','2026-02-01'),

(16,'AI Engineering','2026-03-10'),

(19,'Platform Engineering','2026-03-22');

-- =========================================
-- COMPENSATION
-- =========================================

INSERT INTO compensation_offer (
employee_id,
base_salary,
bonus_percentage
)
VALUES

(1,1500000,15),

(2,1400000,12),

(3,1450000,10),

(4,1600000,18);

-- =========================================
-- PAYROLL
-- =========================================

INSERT INTO payroll_transaction (
employee_id,
payroll_month,
payroll_year,
gross_salary
)
VALUES

(1,4,2026,1500000),

(2,4,2026,1400000),

(3,4,2026,1450000),

(4,4,2026,1600000);

-- =========================================
-- PAYMENT RECORDS
-- =========================================

INSERT INTO payment_record (
payroll_id,
payment_status
)
VALUES

(1,'COMPLETED'),

(2,'PENDING'),

(3,'COMPLETED'),

(4,'PENDING');

-- =========================================
-- INTERVIEW FEEDBACK
-- IMPORTANT:
-- Feedback ONLY for INTERVIEWED applications
-- =========================================

INSERT INTO interview_feedback (
application_id,
technical_score,
communication_score,
remarks
)
VALUES

(13,9,8,'Strong ML concepts'),

(25,8,9,'Excellent communication'),

(33,9,9,'Very strong AI fundamentals');