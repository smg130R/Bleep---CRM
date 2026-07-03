/**
 * Cleans all seed/test data from both public tables and auth.users.
 * Keeps only the admin user (admin@company.com).
 *
 * Usage: node scripts/clean-db.cjs
 */

const supabase = require('../server/db/supabase');

async function main() {
  console.log('Cleaning all data...\n');

  // 1. Clear data tables (order matters for FK)
  const tables = ['complaints', 'leaves', 'followups', 'calling_sheet', 'kpi_records', 'teams'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', 0);
    if (error) {
      console.error(`  ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`  ✓ Cleared ${table}`);
    }
  }

  // 2. Delete non-admin users from auth.users (this cascades to public.users via FK)
  const { data: nonAdminUsers, error: fetchErr } = await supabase
    .from('users')
    .select('id, email, "authId"')
    .neq('role', 'admin');

  if (fetchErr) {
    console.error('  ⚠️  Error fetching non-admin users:', fetchErr.message);
  } else if (nonAdminUsers) {
    for (const u of nonAdminUsers) {
      if (u.authId) {
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.authId);
        if (delErr) {
          console.error(`  ⚠️  Failed to delete auth user ${u.email}: ${delErr.message}`);
        } else {
          console.log(`  ✓ Deleted ${u.email} (including auth.users entry)`);
        }
      } else {
        // No authId linked — delete from public.users directly
        const { error } = await supabase.from('users').delete().eq('id', u.id);
        if (!error) {
          console.log(`  ✓ Removed orphan user ${u.email} from public.users`);
        }
      }
    }
  }

  // 3. Verify counts
  console.log('');
  for (const table of [...tables, 'users']) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    if (error) {
      console.log(`  ${table}: error counting`);
    } else {
      console.log(`  ${table}: ${count} rows`);
    }
  }

  console.log('\nDone. Only the admin user remains.');
}

main().catch(err => { console.error(err); process.exit(1); });
