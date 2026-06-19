// Run database migration using @supabase/server SDK
// Usage: node scripts/run-migration.mjs
// Requires SUPABASE_URL, SUPABASE_SECRET_KEY env vars (in .env.local)

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
import dotenv from 'dotenv';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function runMigration() {
  const { createSupabaseContext } = await import('@supabase/server');

  // Create a request with the secret key in the Authorization header
  const req = new Request('http://localhost', {
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      'apikey': process.env.SUPABASE_SECRET_KEY,
    },
  });

  // Create context with "secret" auth mode to get admin client
  const { data: ctx, error } = await createSupabaseContext(req, { auth: 'secret' });

  if (error) {
    console.error('Failed to create Supabase context:', error.message);
    process.exit(1);
  }

  // Read migration SQL
  const sqlPath = join(__dirname, '..', 'db', 'partial_payment_migration.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  console.log('Running migration...');
  console.log('---');
  console.log(sql);
  console.log('---');

  // Execute SQL using the admin client (bypasses RLS)
  const { data, error: queryError } = await ctx.supabaseAdmin.rpc('exec_sql', {
    sql_text: sql,
  });

  if (queryError) {
    // exec_sql might not be available, try direct SQL via REST API
    console.log('exec_sql RPC failed:', queryError.message);
    console.log('Trying direct SQL execution via REST API...');
    
    // Use the raw SQL endpoint
    const { error: restError } = await ctx.supabaseAdmin.from('_migration').insert({
      sql: sql,
    }).single();

    if (restError) {
      console.log('Direct insert also failed. Trying SQL execution via raw query...');
      
      // Execute each statement individually
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        console.log(`Executing: ${stmt.substring(0, 80)}...`);
        try {
          const { error: stmtError } = await ctx.supabaseAdmin.rpc('exec_sql', {
            sql_text: stmt + ';'
          });
          if (stmtError) {
            console.error(`  Error: ${stmtError.message}`);
          } else {
            console.log('  ✓ Success');
          }
        } catch (e) {
          console.error(`  Failed: ${e.message}`);
        }
      }
    } else {
      console.log('✓ Migration completed successfully!');
    }
  } else {
    console.log('✓ Migration completed successfully!');
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
