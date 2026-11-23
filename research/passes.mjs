// research/passes-*.json 의 패스 조사 결과를 pass/data.json 으로 합친다.
// 사용: node research/passes.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = new URL('./', import.meta.url);
const ORDER = ['hokkaido', 'tohoku', 'kanto', 'chubu', 'kansai', 'chugoku', 'shikoku', 'kyushu', 'okinawa', 'nationwide'];
const FIELDS = ['id', 'ko', 'ja', 'en', 'kind', 'prices', 'valid', 'covers', 'good', 'buy', 'notes', 'url', 'checked'];

const regions = Object.fromEntries(ORDER.map((k) => [k, []]));
const problems = [];
for (const f of readdirSync(dir).filter((f) => /^passes-.*\.json$/.test(f))) {
  const r = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  for (const [region, list] of Object.entries(r)) {
    if (!regions[region]) {
      problems.push(`${f}: 알 수 없는 지방 ${region}`);
      continue;
    }
    for (const p of list) {
      if (!p.id || !p.ko || !Array.isArray(p.prices) || !p.prices.length || p.prices.some((x) => !(x.yen > 0) || !x.label)) {
        problems.push(`${f} ${region}: 빠진 항목 ${p.id ?? p.ko}`);
        continue;
      }
      if (regions[region].some((x) => x.id === p.id)) continue;
      regions[region].push(Object.fromEntries(FIELDS.filter((k) => p[k] !== undefined).map((k) => [k, p[k]])));
    }
  }
}
const asof = new Date().toISOString().slice(0, 7).replace('-', '.');
writeFileSync(new URL('../pass/data.json', import.meta.url), JSON.stringify({ asof, regions }, null, 1) + '\n');
console.log(ORDER.map((k) => `${k} ${regions[k].length}`).join(' · '));
if (problems.length) console.warn('확인 필요:\n' + problems.join('\n'));
