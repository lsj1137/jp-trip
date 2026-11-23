// 지방별 철도·버스·관광 패스 모음. 데이터는 data.json (research/passes-*.json → node research/passes.mjs).
// 처음 여는 지방은 주소 끝(#kanto 등) → 메인에서 고른 여행 지역(jp-region) → 간토 순.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const REGIONS = [
  ['hokkaido', '홋카이도'],
  ['tohoku', '도호쿠'],
  ['kanto', '간토'],
  ['chubu', '주부'],
  ['kansai', '간사이'],
  ['chugoku', '주고쿠'],
  ['shikoku', '시코쿠'],
  ['kyushu', '규슈'],
  ['okinawa', '오키나와'],
  ['nationwide', '전국'],
];
const KEYS = REGIONS.map(([k]) => k);

const state = {
  data: {},
  region: [location.hash.slice(1), localStorage.getItem('jp-region'), 'kanto'].find((k) => KEYS.includes(k)),
  open: null,
  // 술 가격·쇼핑 앱과 같은 도메인이라 그 앱들이 저장한 환율을 같이 쓴다
  rate: Number(localStorage.getItem('krwPerJpy')) || 8.6,
};

const yen = (n) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
const won = (n) => `${(Math.round(n / 1000) * 1000).toLocaleString('ko-KR')}원`;

function renderCats() {
  $('#cats').innerHTML = REGIONS.map(([k, l]) => `<button type="button" data-r="${k}" class="${k === state.region ? 'on' : ''}">${l}</button>`).join('');
  $('#cats .on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function card(p) {
  const open = state.open === p.id;
  // 접혀 있을 땐 성인 가격만, 펼치면 어린이 가격까지
  const shown = open ? p.prices : p.prices.filter((x) => !/^(어린이|아동|소인)/.test(x.label));
  const prices = (shown.length ? shown : p.prices).map((x) => `<li><span>${esc(x.label)}</span><b>${yen(x.yen)}</b><small>${won(x.yen * state.rate)}</small></li>`).join('');
  return `<li class="row${open ? ' open' : ''}" data-id="${esc(p.id)}">
    <div class="head">
      <p class="name"><i class="kind">${esc(p.kind)}</i>${esc(p.ko)}</p>
      <p class="ja" lang="ja">${esc(p.ja)}</p>
      <ul class="prices">${prices}</ul>
    </div>
    ${
      open
        ? `<dl class="more">
      ${p.valid ? `<dt>기간</dt><dd>${esc(p.valid)}</dd>` : ''}
      ${p.covers ? `<dt>범위</dt><dd>${esc(p.covers)}</dd>` : ''}
      ${p.good ? `<dt>이럴 때 이득</dt><dd>${esc(p.good)}</dd>` : ''}
      ${p.buy ? `<dt>사는 곳</dt><dd>${esc(p.buy)}</dd>` : ''}
      ${p.notes ? `<dt>주의</dt><dd>${esc(p.notes)}</dd>` : ''}
    </dl>
    ${p.checked === false ? '<p class="warn">가격·내용을 공식 사이트에서 다시 확인해 주세요.</p>' : ''}
    ${p.url ? `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener">공식 사이트</a>` : ''}`
        : ''
    }
  </li>`;
}

function render() {
  const list = state.data[state.region] ?? [];
  // 간사이는 이미 있는 조이패스 시설 지도로 가는 줄을 맨 위에
  const joy =
    state.region === 'kansai'
      ? `<li class="row link-row"><a href="../kansai/"><b>간사이 조이패스 시설 지도</b><span>조이패스로 쓸 수 있는 시설·혜택을 지도에서 보기</span></a></li>`
      : '';
  $('#list').innerHTML = joy + (list.length ? list.map(card).join('') : `<li class="empty">아직 정리한 패스가 없어요.</li>`);
  $('#count').textContent = `${list.length}개`;
  $('#rate').textContent = `환율 ¥100 = ${(state.rate * 100).toFixed(1)}원`;
}

$('#cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-r]');
  if (!b) return;
  state.region = b.dataset.r;
  state.open = null;
  history.replaceState(null, '', `#${state.region}`);
  renderCats();
  render();
  window.scrollTo({ top: 0 });
});
$('#list').addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  const row = e.target.closest('.row[data-id]');
  if (!row) return;
  state.open = state.open === row.dataset.id ? null : row.dataset.id;
  render();
});

const data = await (await fetch('data.json')).json();
state.data = data.regions;
$('#asof').textContent = `${data.asof} 기준`;
renderCats();
render();

// 환율: 술 가격 앱의 환율 API를 같이 쓴다. 오프라인이면 마지막 값.
fetch('../liquor/api/rate')
  .then((r) => r.json())
  .then((d) => {
    if (!d.live && localStorage.getItem('krwPerJpy')) return;
    state.rate = d.krwPerJpy;
    if (d.live) localStorage.setItem('krwPerJpy', d.krwPerJpy);
    render();
  })
  .catch(() => {});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
