const bcrypt = require('bcryptjs');
const { initDatabase, dbRun, dbGet } = require('./src/config/database');

async function addUsers() {
  console.log('Adding users...');
  
  await initDatabase();

  // Check if users exist
  const existingUsers = await dbGet('SELECT COUNT(*) as count FROM users');
  console.log('Existing users count:', existingUsers.count);

  if (existingUsers.count > 0) {
    console.log('Users already exist. Skipping...');
    process.exit(0);
  }

  // Insert default users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);

  try {
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', adminPassword, 'admin']);
    console.log('✓ Admin user created');
    
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Manager', managerPassword, 'manager']);
    console.log('✓ Manager user created');
    
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Sales', salesPassword, 'sales']);
    console.log('✓ Sales user created');
    
    console.log('\n✓ All users created successfully!');
  } catch (err) {
    console.error('Error creating users:', err);
  }
  
  process.exit(0);
}

addUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
