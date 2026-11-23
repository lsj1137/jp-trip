// 패스 목록·지도 두 화면이 같이 쓰는 것: 데이터 읽기, 가격 표시, '이득' 창.
import { ask } from './common/ui.js';

export const REGIONS = {
  hokkaido: '홋카이도',
  tohoku: '도호쿠',
  kanto: '간토',
  chubu: '주부',
  kansai: '간사이',
  chugoku: '주고쿠',
  shikoku: '시코쿠',
  kyushu: '규슈',
  okinawa: '오키나와',
};

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const yen = (n) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
// 술 가격·쇼핑 앱과 같은 도메인이라 그 앱들이 저장한 환율을 같이 쓴다
export const rate = () => Number(localStorage.getItem('krwPerJpy')) || 8.6;
export const won = (n) => `${(Math.round((n * rate()) / 1000) * 1000).toLocaleString('ko-KR')}원`;

// 종류별 아이콘 (icons/*.svg)
export const ICON = { 철도: 'rail', '지하철·버스': 'bus', 관광지: 'sight', '철도+관광': 'railsight' };

export async function loadPasses() {
  const data = await (await fetch('data.json')).json();
  const byId = new Map(Object.entries(data.regions).flatMap(([r, list]) => list.map((p) => [p.id, { ...p, region: r }])));
  return { ...data, byId };
}

// 목록 카드에 쓰는 한 줄 가격: 성인 가격만, 많으면 앞의 두 개
export function priceLine(p) {
  const adult = p.prices.filter((x) => !/^(어린이|아동|소인)/.test(x.label));
  const list = (adult.length ? adult : p.prices).slice(0, 2);
  return list.map((x) => `${x.label.replace(/^성인\s*/, '')} ${yen(x.yen)}`).join(' · ') + (adult.length > 2 ? ' …' : '');
}

// '이득' 창: 가격 전체, 이럴 때 이득, 기간, 범위, 사는 곳, 주의, 공식 사이트
export function openDetail(p) {
  const prices = p.prices.map((x) => `<li><span>${esc(x.label)}</span><b>${yen(x.yen)}</b><small>${won(x.yen)}</small></li>`).join('');
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '');
  ask({
    title: p.ko,
    body: `<div class="pd">
      <ul class="pd-prices">${prices}</ul>
      ${p.good ? `<p class="pd-good"><b>이럴 때 이득</b>${esc(p.good)}</p>` : ''}
      <dl>${row('기간', p.valid)}${row('범위', p.covers)}${row('사는 곳', p.buy)}${row('주의', p.notes)}</dl>
      ${p.checked === false ? '<p class="pd-warn">가격·내용을 공식 사이트에서 다시 확인해 주세요.</p>' : ''}
      ${p.url ? `<a class="pd-link" href="${esc(p.url)}" target="_blank" rel="noopener">공식 사이트</a>` : ''}
    </div>`,
    buttons: [{ value: null, label: '닫기', kind: 'primary' }],
  });
}
