const { initDatabase, dbRun } = require('../config/database');

async function createStaffTables() {
  console.log('Creating staff and attendance tables...');
  
  await initDatabase();

  try {
    // Create staff table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        position TEXT NOT NULL,
        salary REAL NOT NULL,
        joining_date TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Staff table created successfully');
    
    // Create attendance table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT,
        status TEXT DEFAULT 'present',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✓ Attendance table created successfully');
    
    // Create indexes
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status)
    `);
    
    console.log('✓ Index created on staff status column');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)
    `);
    
    console.log('✓ Index created on attendance date column');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id)
    `);
    
    console.log('✓ Index created on attendance staff_id column');
    
    // Create unique constraint on staff_id + date for attendance
    await dbRun(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_staff_date 
      ON attendance(staff_id, date)
    `);
    
    console.log('✓ Unique index created on staff_id + date');
    
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

createStaffTables();
