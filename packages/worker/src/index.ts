import { supabase } from './supabase';
import { scrapeUrl } from './scraper';
import { cleanContent } from './cleaner';

const POLL_INTERVAL = 15000;
const MAX_JOBS = 3;

async function processJob(job: any) {
  const { id, competitor_id } = job;
  console.log(`[Worker] Processing job ${id.slice(0, 8)}... for competitor ${competitor_id.slice(0, 8)}`);

  try {
  await supabase.from('collection_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id);

  const { data: competitor } = await supabase.from('competitors').select('*').eq('id', competitor_id).single();
  if (!competitor) {
    await supabase.from('collection_jobs').update({ status: 'failed', error: 'Competitor not found', completed_at: new Date().toISOString() }).eq('id', id);
    return;
  }

  await supabase.from('competitors').update({ status: 'collecting' }).eq('id', competitor_id);

  const result = await scrapeUrl(competitor.domain);
  if (result.error || result.status === 0) {
    await supabase.from('collection_jobs').update({ status: 'failed', error: result.error || 'Request failed', completed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('competitors').update({ status: 'monitoring' }).eq('id', competitor_id);
    console.log(`[FAIL] ${competitor.name} (${competitor.domain}): ${result.error}`);
    return;
  }

  // Compare with previous collection
  const { data: prevJob } = await supabase
    .from('collection_jobs')
    .select('result_html')
    .eq('competitor_id', competitor_id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevText = prevJob?.result_html || null;
  const cleaned = cleanContent(result.text, prevText);

  await supabase.from('competitors').update({
    status: 'monitoring',
    company_info: { ...(competitor.company_info || {}), title: result.title, last_scraped: new Date().toISOString() },
  }).eq('id', competitor_id);

  await supabase.from('collection_jobs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    result_html: cleaned.text,
  }).eq('id', id);

  if (cleaned.hasChanged && cleaned.diffLines.length > 0) {
    const priority = cleaned.diffLines.length > 20 ? 'high' : cleaned.diffLines.length > 10 ? 'medium' : 'low';
    const snippet = cleaned.diffLines.slice(0, 5).join('; ');

    await supabase.from('analysis_reports').insert({
      competitor_id,
      user_id: competitor.user_id,
      change_summary: [{ title: `检测到 ${cleaned.diffLines.length} 处变化`, summary: snippet }],
      strategic_intent: '待 AI 分析',
      action_suggestions: [{ action: '人工审核', reason: '等待 AI 分析管道接入', priority: '中' }],
      priority,
      source_url: `https://${competitor.domain}`,
    });

    console.log(`[CHANGE] ${competitor.name}: ${cleaned.diffLines.length} new lines`);
  } else {
    console.log(`[OK] ${competitor.name}: no significant changes`);
  }

  const links = competitor.related_links || [];
  for (const link of links.slice(0, 3)) {
    await scrapeUrl(link);
  }
  } catch (err: any) {
    console.error(`[ERROR] Job ${id.slice(0, 8)} failed:`, err.message);
    await supabase.from('collection_jobs').update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('competitors').update({ status: 'monitoring' }).eq('id', competitor_id);
  }
}

async function run() {
  console.log('[Worker] Lensmor Monitor collector started');

  while (true) {
    const { data: jobs } = await supabase
      .from('collection_jobs')
      .select('id, competitor_id, created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(MAX_JOBS);

    if (jobs && jobs.length > 0) {
      console.log(`[Worker] Processing ${jobs.length} job(s)`);
      for (const job of jobs) {
        await processJob(job);
      }
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

// Seed initial jobs for monitoring competitors without recent jobs
async function seedJobs() {
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, user_id')
    .eq('status', 'monitoring');

  if (!competitors?.length) return;

  for (const comp of competitors) {
    const { data: recent } = await supabase
      .from('collection_jobs')
      .select('id')
      .eq('competitor_id', comp.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recent) {
      await supabase.from('collection_jobs').insert({
        competitor_id: comp.id,
        user_id: comp.user_id,
        status: 'queued',
      });
    }
  }
}

seedJobs().then(() => run()).catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
