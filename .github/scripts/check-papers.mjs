// Checks every past paper link on papers.html still opens a PDF on Physics & Maths Tutor.
import { readFileSync } from 'node:fs';
const html = readFileSync('papers.html', 'utf8');
const start = html.indexOf("const PMT=");
const end = html.indexOf('};', html.indexOf('const COURSES=')) + 2;
if (start < 0 || end < 2) throw new Error('Could not find the papers data in papers.html');
const COURSES = new Function(html.slice(start, end) + '\nreturn COURSES;')();
const urls = [];
for (const [k, c] of Object.entries(COURSES))
  for (const s of c.series)
    for (const [p] of c.papers)
      for (const [t] of [['QP'], ...c.extra(p), ['MS']])
        urls.push([`${c.tab} · ${s} · ${p} · ${t}`, encodeURI(c.url(s, p, t))]);
const bad = [];
const check = async ([label, url]) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { Range: 'bytes=0-0', 'User-Agent': 'Mozilla/5.0 (link check for mathsclinic.co.uk)' } });
      const type = r.headers.get('content-type') || '';
      if ((r.ok || r.status === 206) && type.includes('pdf')) return;
      if (attempt === 2) bad.push(`${label}: HTTP ${r.status} ${type}`);
    } catch (e) { if (attempt === 2) bad.push(`${label}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 2000));
  }
};
for (let i = 0; i < urls.length; i += 10) await Promise.all(urls.slice(i, i + 10).map(check));
console.log(`Checked ${urls.length} links, ${bad.length} broken.`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
