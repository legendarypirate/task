const db = require("./app/models");
async function alterTables() {
  try {
    await db.sequelize.query('ALTER TABLE users ALTER COLUMN supervisor_id TYPE integer[] USING CASE WHEN supervisor_id IS NOT NULL THEN ARRAY[supervisor_id] ELSE \'{}\'::integer[] END;');
    console.log("Users table altered");
  } catch(e) { console.log(e.message); }
  
  try {
    await db.sequelize.query('ALTER TABLE tasks ALTER COLUMN supervisor_id TYPE integer[] USING CASE WHEN supervisor_id IS NOT NULL THEN ARRAY[supervisor_id] ELSE \'{}\'::integer[] END;');
    console.log("Tasks table supervisor_id altered");
  } catch(e) { console.log(e.message); }

  try {
    await db.sequelize.query('ALTER TABLE tasks ALTER COLUMN assigned_to TYPE integer[] USING CASE WHEN assigned_to IS NOT NULL THEN ARRAY[assigned_to] ELSE \'{}\'::integer[] END;');
    console.log("Tasks table assigned_to altered");
  } catch(e) { console.log(e.message); }
  
  process.exit(0);
}
alterTables();
