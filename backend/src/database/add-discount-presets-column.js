const { initDatabase, dbRun } = require('../config/database');

async function addDiscountPresetsColumn() {
  console.log('Adding discount_presets column to settings table...');
  
  await initDatabase();
  
  try {
    await dbRun("ALTER TABLE settings ADD COLUMN discount_presets TEXT");
    console.log('✓ Column added successfully');
    
    await dbRun("UPDATE settings SET discount_presets = ? WHERE id = 1", [JSON.stringify([5, 10, 15, 20])]);
    console.log('✓ Default discount presets set');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ Column already exists');
    } else {
      throw error;
    }
  }
  
  console.log('✓ Migration complete!');
  process.exit(0);
}

addDiscountPresetsColumn().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
