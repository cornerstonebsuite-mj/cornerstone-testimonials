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
const logoFor = c => { const k = (c || '').toLowerCase(); const hit = LOGOS.find(([w]) => k.includes(w)); return hit ? SITE + hit[1] : ''; };

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
