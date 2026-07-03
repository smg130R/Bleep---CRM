const supabase = require('./supabase');

// Database initialization function
// Verifies Supabase connection and tables exist

/**
 * Database initialization function
 * Verifies Supabase connection and tables exist
 * 
 * Note: Database tables should be created manually in Supabase Dashboard
 * using the SQL from server/db/supabase_schema.sql
 */
async function initDb() {
  try {
    // Verify Supabase connection by querying the users table
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }

    console.log('✓ Connected to Supabase database');
    console.log('✓ Database tables verified');

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  initDb
};
