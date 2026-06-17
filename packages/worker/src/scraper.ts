import * as cheerio from 'cheerio';

export interface ScrapeResult {
  html: string;
  text: string;
  title: string;
  status: number;
  error?: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const target = url.startsWith('http') ? url : `https://${url}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lensmor-Monitor/1.0 (Competitive Intelligence Bot)' },
    });
    clearTimeout(timer);

    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, noscript, iframe').remove();

    const title = $('title').text().trim();
    const text = $('body').text().replace(/\s{2,}/g, '\n').trim();

    return { html, text: text.slice(0, 50000), title, status: res.status };
  } catch (err: any) {
    clearTimeout(timer);
    return { html: '', text: '', title: '', status: 0, error: err.message };
  }
}
