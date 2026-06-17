// 一次性脚本：为用户创建缺失的 profiles 记录
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

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: WebSocket as any } }
  );

  const accessToken = process.env.USER_ACCESS_TOKEN || '';
  const refreshToken = process.env.USER_REFRESH_TOKEN || '';

  const { error: sessionErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionErr) { console.error('Session error:', sessionErr.message); process.exit(1); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { console.log('No user'); process.exit(1); }

  console.log('Current user:', user.email, user.id);

  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existing) { console.log('Profile already exists, no fix needed'); process.exit(0); }

  const { error } = await supabase.from('profiles').insert({ id: user.id, email: user.email });
  if (error) {
    console.error('Failed:', error.message);
    console.log('Run this in Supabase SQL Editor:');
    console.log(`INSERT INTO public.profiles (id, email) VALUES ('${user.id}', '${user.email}');`);
  } else {
    console.log('Profile created successfully!');
  }
  process.exit(0);
}

main();
