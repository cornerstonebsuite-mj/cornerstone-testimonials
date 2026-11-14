// Fetches Approved testimonials from Zoho CRM and writes docs/testimonials.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const URL_ = process.env.ZOHO_FUNCTION_URL;
if (!URL_) { console.error('Missing ZOHO_FUNCTION_URL secret'); process.exit(1); }

const SITE = 'https://cornerstonebsuite.com';
// Company name keyword -> logo already on the website
const LOGOS = [
  ['jain aircon', '/assets/clients/jain-aircon.webp'],
  ['triple r', '/assets/clients/triple-r-india.webp'],
  ['zenolex', '/assets/clients/zenolex-agritech.webp'],
  ['snr infra', 'data:image/webp;base64,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'],
  ['vyshnavi', '/assets/clients/vyshnavi-analytical.webp'],
  ['yokesh', '/assets/clients/yokesh-enterprises.webp'],
  ['shivani bhavani', '/assets/clients/shivani-bhavani-fasteners.webp'],
  ['swastava', '/assets/clients/swastava-cancer-care.webp'],
  ['balaram', '/assets/clients/the-balaram-automobiles.webp'],
  ['ambica', '/assets/clients/sri-ambica-fittings.webp'],
  ['western refrigeration', '/assets/clients/western-refrigeration-company.webp'],
  ['milvanta', '/assets/clients/milvanta.webp'],
  ['mana oori', '/assets/clients/mana-oori-santha.webp'],
  ['leuchter', '/assets/clients/mana-oori-santha.webp'],
];

const titleCase = s => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const fixName = s => { s = (s || '').replace(/\s+/g, ' ').trim(); if (s === s.toLowerCase() || s === s.toUpperCase()) s = titleCase(s); return s.replace(/\s+\.\s*/g, '. ').replace(/\.\s*$/, '.').trim(); };
const fixCompany = s => { s = (s || '').replace(/\s+/g, ' ').trim(); return s.replace(/\bpvt\b/gi, 'Pvt').replace(/\bltd\b/gi, 'Ltd').replace(/\bprivate limited\b/gi, 'Private Limited'); };
function fixQuote(q) {
  q = (q || '').replace(/\r/g, '').replace(/\n\s*\n+/g, ' ').replace(/\s+/g, ' ').trim();
  q = q.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  if (!q) return '';
  // Sentence-case shouty Title Case quotes ("Good Communication And Improving...")
  const words = q.split(' ');
  const caps = words.filter(w => /^[A-Z][a-z]/.test(w)).length;
  if (words.length > 3 && caps / words.length > 0.7) q = q.toLowerCase();
  q = q.charAt(0).toUpperCase() + q.slice(1);
  if (!/[.!?]$/.test(q)) q += '.';
  return q.replace(/\s+([.,!?])/g, '$1');
}
const rating = r => { const n = parseInt(String(r || '').trim(), 10); return n >= 1 && n <= 5 ? n : 5; };
const logoFor = c => { const k = (c || '').toLowerCase(); const hit = LOGOS.find(([w]) => k.includes(w)); return hit ? (/^(https?:|data:)/.test(hit[1]) ? hit[1] : SITE + hit[1]) : ''; };

const res = await fetch(URL_);
const body = await res.text();
if (!res.ok) { console.error('Zoho returned', res.status, body.slice(0, 300)); process.exit(1); }
let raw;
try {
  const j = JSON.parse(body);
  const out = j?.details?.output ?? j?.output ?? j;
  if (typeof out === 'string') { const s = out.trim(); raw = s === '' ? [] : JSON.parse(s.startsWith('[') ? s : '[' + s + ']'); }
  else raw = Array.isArray(out) ? out : [out];
} catch (e) { console.error('Could not parse Zoho response:', body.slice(0, 300)); process.exit(1); }
if (!Array.isArray(raw)) { console.error('Unexpected response shape'); process.exit(1); }

const items = raw
  .filter(r => String(r.permission || '').startsWith('Yes'))
  .map(r => {
    const anon = /without my name/i.test(r.permission || '');
    const company = fixCompany(r.company);
    return {
      id: String(r.id),
      name: anon ? 'Verified client' : fixName(r.name),
      designation: anon ? '' : (r.designation || '').trim(),
      company: anon ? '' : company,
      logo: anon ? '' : logoFor(company),
      product: (r.product || '').trim(),
      rating: rating(r.rating),
      quote: fixQuote(r.quote),
      created: r.created || ''
    };
  })
  .filter(t => t.quote.length >= 6 && !/^(no|na|n\/a|nil|none)\.?$/i.test(t.quote))
  .sort((a, b) => b.quote.length - a.quote.length);

const month = new Date().toISOString().slice(0, 7); // monthly heartbeat keeps the schedule alive
const next = JSON.stringify({ updated_month: month, count: items.length, testimonials: items }, null, 2) + '\n';
let prev = '';
try { prev = readFileSync('docs/testimonials.json', 'utf8'); } catch {}
if (prev === next) { console.log('No change (' + items.length + ' testimonials)'); process.exit(0); }
mkdirSync('docs', { recursive: true });
writeFileSync('docs/testimonials.json', next);
console.log('Updated: ' + items.length + ' testimonials');
