const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log("Altering interview_feedback table...");
    try {
        await db.query(`ALTER TABLE interview_feedback ADD UNIQUE (application_id, user_id);`);
    } catch(e) { console.log(e.message) }
    
    console.log("Creating trigger...");
    await db.query(`
      DROP TRIGGER IF EXISTS after_feedback_insert;
      CREATE TRIGGER after_feedback_insert
      AFTER INSERT ON interview_feedback
      FOR EACH ROW
      BEGIN
          INSERT INTO audit_log (table_name, action_type, record_id, old_value, new_value)
          VALUES ('interview_feedback', 'INSERT_FEEDBACK', NEW.application_id, NULL, CONCAT('Feedback submitted by user_id: ', NEW.user_id));
      END;
    `);

    console.log("Database updated successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
