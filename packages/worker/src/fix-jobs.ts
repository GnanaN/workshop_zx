import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import WebSocket from 'ws';

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { realtime: { transport: WebSocket as any } }
);

async function main() {
  // Fix all stuck competitors
  await supabase.from('competitors').update({ status: 'monitoring' }).eq('status', 'collecting');

  // Get all monitoring competitors
  const { data: comps } = await supabase.from('competitors').select('id,name,domain,user_id,status').order('name');

  console.log('Competitors:');
  for (const c of (comps || [])) {
    console.log(`  ${c.name} (${c.domain}) | ${c.status}`);
  }

  // Create a queued job for Test (httpbin.org)
  const test = comps?.find(c => c.domain === 'httpbin.org');
  if (test) {
    const { error } = await supabase.from('collection_jobs').insert({
      competitor_id: test.id,
      user_id: test.user_id,
      status: 'queued',
    });
    console.log(`\nCreated job for ${test.name}: ${error ? 'FAIL ' + error.message : 'OK'}`);
  }

  process.exit(0);
}

main();
