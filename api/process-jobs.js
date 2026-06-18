import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeUrl(url) {
  const target = url.startsWith('http') ? url : `https://${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lensmor-Monitor/1.0' },
    });
    clearTimeout(timer);

    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript, iframe').remove();
    const title = $('title').text().trim();
    const text = $('body').text().replace(/\s{2,}/g, '\n').trim();
    return { html, text: text.slice(0, 50000), title, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { html: '', text: '', title: '', status: 0, error: err.message };
  }
}

function cleanContent(currentText, previousText) {
  const cleaned = currentText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20)
    .join('\n');

  if (!previousText) {
    return { text: cleaned, hasChanged: false, diffLines: [] };
  }

  const prevCleaned = previousText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20)
    .join('\n');

  const prevSet = new Set(prevCleaned.split('\n'));
  const diffLines = cleaned.split('\n').filter((l) => !prevSet.has(l));

  return {
    text: cleaned,
    hasChanged: diffLines.length > 0,
    diffLines: diffLines.slice(0, 100),
  };
}

export default async function handler(req, res) {
  console.log('[Cron] Worker triggered');

  try {
    // Process up to 2 queued jobs per invocation
    const { data: jobs } = await supabase
      .from('collection_jobs')
      .select('id, competitor_id, user_id')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(2);

    if (!jobs || jobs.length === 0) {
      console.log('[Cron] No queued jobs');
      return res.json({ status: 'ok', processed: 0 });
    }

    console.log(`[Cron] Processing ${jobs.length} job(s)`);

    const results = [];
    for (const job of jobs) {
      try {
        await supabase
          .from('collection_jobs')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', job.id);

        const { data: competitor } = await supabase
          .from('competitors')
          .select('*')
          .eq('id', job.competitor_id)
          .single();

        if (!competitor) {
          await supabase
            .from('collection_jobs')
            .update({ status: 'failed', error: 'Competitor not found', completed_at: new Date().toISOString() })
            .eq('id', job.id);
          results.push({ job: job.id.slice(0, 8), status: 'failed', error: 'not found' });
          continue;
        }

        await supabase
          .from('competitors')
          .update({ status: 'collecting' })
          .eq('id', competitor.id);

        const result = await scrapeUrl(competitor.domain);

        if (result.error || result.status === 0) {
          await supabase
            .from('collection_jobs')
            .update({ status: 'failed', error: result.error || 'Request failed', completed_at: new Date().toISOString() })
            .eq('id', job.id);
          await supabase
            .from('competitors')
            .update({ status: 'monitoring' })
            .eq('id', competitor.id);
          results.push({ job: job.id.slice(0, 8), status: 'failed', error: result.error });
          continue;
        }

        // Compare with previous collection
        const { data: prevJob } = await supabase
          .from('collection_jobs')
          .select('result_html')
          .eq('competitor_id', competitor.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const cleaned = cleanContent(result.text, prevJob?.result_html || null);

        await supabase
          .from('competitors')
          .update({
            status: 'monitoring',
            company_info: {
              ...(competitor.company_info || {}),
              title: result.title,
              last_scraped: new Date().toISOString(),
            },
          })
          .eq('id', competitor.id);

        await supabase
          .from('collection_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_html: cleaned.text,
          })
          .eq('id', job.id);

        if (cleaned.hasChanged && cleaned.diffLines.length > 0) {
          const priority = cleaned.diffLines.length > 20 ? 'urgent' : cleaned.diffLines.length > 10 ? 'medium' : 'low';
          const snippet = cleaned.diffLines.slice(0, 5).join('; ');

          const { error: insErr } = await supabase.from('analysis_reports').insert({
            competitor_id: competitor.id,
            user_id: competitor.user_id,
            change_summary: [{ title: `检测到 ${cleaned.diffLines.length} 处变化`, summary: snippet }],
            strategic_intent: '待 AI 分析',
            action_suggestions: [{ action: '人工审核', reason: '等待 AI 分析管道接入', priority: '中' }],
            priority,
            source_url: `https://${competitor.domain}`,
          });

          if (insErr) {
            results.push({ job: job.id.slice(0, 8), status: 'done', report: 'INSERT ERROR: ' + insErr.message });
          } else {
            results.push({ job: job.id.slice(0, 8), status: 'done', priority, changes: cleaned.diffLines.length });
          }
        } else {
          results.push({ job: job.id.slice(0, 8), status: 'done', changes: 0 });
        }
      } catch (err) {
        console.error(`[Cron] Job ${job.id.slice(0, 8)} error:`, err.message);
        await supabase
          .from('collection_jobs')
          .update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() })
          .eq('id', job.id);
        await supabase
          .from('competitors')
          .update({ status: 'monitoring' })
          .eq('id', job.competitor_id);
        results.push({ job: job.id.slice(0, 8), status: 'error', error: err.message });
      }
    }

    // Seed new jobs for monitoring competitors without recent jobs
    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, user_id')
      .eq('status', 'monitoring');

    if (competitors?.length) {
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

    return res.json({ status: 'ok', results, processed: results.length });
  } catch (err) {
    console.error('[Cron] Fatal error:', err.message);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}
