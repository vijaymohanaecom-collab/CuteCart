const { initDatabase, dbRun, dbGet } = require('../config/database');

async function addDiscountPresetsColumn() {
  console.log('Adding discount_presets column to settings table...');
  
  await initDatabase();

  try {
    // Check if column already exists
    const tableInfo = await new Promise((resolve, reject) => {
      const db = require('../config/database').getDatabase();
      db.all("PRAGMA table_info(settings)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const columnExists = tableInfo.some(col => col.name === 'discount_presets');

    if (columnExists) {
      console.log('✓ Column discount_presets already exists');
    } else {
      // Add the column
      await dbRun('ALTER TABLE settings ADD COLUMN discount_presets TEXT');
      console.log('✓ Column discount_presets added successfully');

      // Set default value for existing row
      await dbRun(
        `UPDATE settings SET discount_presets = ? WHERE id = 1`,
        [JSON.stringify([5, 10, 15, 20])]
      );
      console.log('✓ Default discount presets set: [5, 10, 15, 20]');
    }

    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

addDiscountPresetsColumn();
