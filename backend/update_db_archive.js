const mysql = require('mysql2/promise');
require('dotenv').config();

const ROLES_ENUM = `ENUM('Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'AI/ML Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'HR Manager', 'Talent Acquisition', 'Sales Executive', 'Marketing Manager', 'Financial Analyst', 'IT Administrator')`;

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log("Migrating existing job roles to standard ENUM...");
    
    // Map existing application roles
    await db.query(`
      UPDATE application SET job_role = 'AI/ML Engineer' WHERE job_role IN ('ML Engineer', 'AI Engineer', 'AI Researcher', 'IoT Engineer', 'Embedded Engineer');
      UPDATE application SET job_role = 'Data Scientist' WHERE job_role IN ('Data Analyst', 'BI Analyst');
      UPDATE application SET job_role = 'Backend Developer' WHERE job_role IN ('PHP Developer', 'Backend Engineer');
      UPDATE application SET job_role = 'Software Engineer' WHERE job_role IN ('SDE Intern', 'Junior Developer', 'Mechanical Analyst');
      UPDATE application SET job_role = 'DevOps Engineer' WHERE job_role IN ('Platform Engineer');
      UPDATE application SET job_role = 'Full Stack Developer' WHERE job_role IN ('MERN Developer');
      
      -- Fallback for any unknown
      UPDATE application SET job_role = 'Software Engineer' WHERE job_role NOT IN ('Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'AI/ML Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'HR Manager', 'Talent Acquisition', 'Sales Executive', 'Marketing Manager', 'Financial Analyst', 'IT Administrator');
    `);

    console.log("Applying Alter Tables...");

    // CANDIDATE
    try { await db.query(`ALTER TABLE candidate ADD COLUMN job_role ${ROLES_ENUM} DEFAULT 'Software Engineer';`); } catch(e) {}
    try { await db.query(`ALTER TABLE candidate ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;`); } catch(e) {}

    // APPLICATION
    try { await db.query(`ALTER TABLE application MODIFY COLUMN job_role ${ROLES_ENUM} NOT NULL;`); } catch(e) { console.error(e) }
    try { await db.query(`ALTER TABLE application ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;`); } catch(e) {}
    try { await db.query(`ALTER TABLE application ADD COLUMN archived_stage VARCHAR(50);`); } catch(e) {}

    // EMPLOYEE
    try { await db.query(`ALTER TABLE employee ADD COLUMN job_role ${ROLES_ENUM} DEFAULT 'Software Engineer';`); } catch(e) {}
    try { await db.query(`UPDATE employee e JOIN application a ON e.candidate_id = a.candidate_id SET e.job_role = a.job_role;`); } catch(e) {}

    console.log("Database Migration Complete!");

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
