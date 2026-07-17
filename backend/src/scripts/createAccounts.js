/**
 * createAccounts.js
 * Creates 20 pre-built user accounts in Supabase.
 * Run: node backend/src/scripts/createAccounts.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const supabase = require('../db/supabase');

// ── 20 pre-built accounts ─────────────────────────────────────────────────────
// User IDs stored as userId@watsonxnodes.app (matches frontend toEmail() convention)
const ACCOUNTS = [
  { userId: 'user001', name: 'User 001', password: 'Nodes@001' },
  { userId: 'user002', name: 'User 002', password: 'Nodes@002' },
  { userId: 'user003', name: 'User 003', password: 'Nodes@003' },
  { userId: 'user004', name: 'User 004', password: 'Nodes@004' },
  { userId: 'user005', name: 'User 005', password: 'Nodes@005' },
  { userId: 'user006', name: 'User 006', password: 'Nodes@006' },
  { userId: 'user007', name: 'User 007', password: 'Nodes@007' },
  { userId: 'user008', name: 'User 008', password: 'Nodes@008' },
  { userId: 'user009', name: 'User 009', password: 'Nodes@009' },
  { userId: 'user010', name: 'User 010', password: 'Nodes@010' },
  { userId: 'user011', name: 'User 011', password: 'Nodes@011' },
  { userId: 'user012', name: 'User 012', password: 'Nodes@012' },
  { userId: 'user013', name: 'User 013', password: 'Nodes@013' },
  { userId: 'user014', name: 'User 014', password: 'Nodes@014' },
  { userId: 'user015', name: 'User 015', password: 'Nodes@015' },
  { userId: 'user016', name: 'User 016', password: 'Nodes@016' },
  { userId: 'user017', name: 'User 017', password: 'Nodes@017' },
  { userId: 'user018', name: 'User 018', password: 'Nodes@018' },
  { userId: 'user019', name: 'User 019', password: 'Nodes@019' },
  { userId: 'user020', name: 'User 020', password: 'Nodes@020' },
];

async function run() {
  console.log('Creating 20 accounts...\n');
  let created = 0, skipped = 0;

  for (const acc of ACCOUNTS) {
    const email = `${acc.userId}@watsonxnodes.app`;

    // Check if already exists
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();

    if (existing) {
      console.log(`  ⏭️  ${acc.userId} — already exists, skipped`);
      skipped++;
      continue;
    }

    const password_hash = await bcrypt.hash(acc.password, 10);
    const { error } = await supabase
      .from('users')
      .insert({ name: acc.name, email, password_hash });

    if (error) {
      console.error(`  ❌ ${acc.userId} — failed: ${error.message}`);
    } else {
      console.log(`  ✅ ${acc.userId} — created (password: ${acc.password})`);
      created++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
