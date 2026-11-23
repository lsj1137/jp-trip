// 패스 모음: 메인 화면처럼 종이 카드 목록. 카드 하나가 패스 하나.
// 카드를 누르면 그 패스로 탈 수 있는 노선·장소 지도(map.html), 오른쪽 '이득' 버튼은 가격·본전 예시·사는 곳 창.
// 처음 보이는 지방은 주소 끝(#kanto 등) → 메인에서 고른 여행 지역(jp-region) → 간토 순.
import { REGIONS, ICON, esc, loadPasses, priceLine, openDetail } from './detail.js';
import { ask } from './common/ui.js';

const $ = (s) => document.querySelector(s);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-3.9 0-7 3-7 6.9 0 5.1 7 12.1 7 12.1s7-7 7-12.1c0-3.9-3.1-6.9-7-6.9z" fill="#c8432f"/><circle cx="12" cy="9.4" r="2.6" fill="#fffdf8"/></svg>';

const pick = () => [location.hash.slice(1), localStorage.getItem('jp-region'), 'kanto'].find((k) => REGIONS[k]);
let region = pick();
let data;

const card = (p) => `<li><div class="card">
    <a class="main" href="map.html#${esc(p.id)}">
      <img src="icons/${ICON[p.kind] ?? 'rail'}.svg" alt="" />
      <div><strong>${esc(p.ko)}</strong><span>${esc(priceLine(p))}</span></div>
    </a>
    <button type="button" class="gain" data-gain="${esc(p.id)}">이득</button>
  </div></li>`;

// 간사이: 이미 있는 조이패스 시설 지도도 같은 카드로
const JOY = `<li><div class="card">
    <a class="main" href="../kansai/">
      <img src="../kansai/icon.svg" alt="" />
      <div><strong>간사이 조이패스</strong><span>쓸 수 있는 시설·혜택 지도</span></div>
    </a>
  </div></li>`;

function render() {
  $('#title').textContent = `${REGIONS[region]} 패스`;
  document.title = `${REGIONS[region]} 패스 모음`;
  $('#regionBtn').innerHTML = `${PIN}<span>${REGIONS[region]}</span><i class="caret">▾</i>`;
  const list = data.regions[region] ?? [];
  $('#cards').innerHTML = (region === 'kansai' ? JOY : '') + list.map(card).join('');
  const all = data.regions.nationwide ?? [];
  $('#allSec').hidden = !all.length;
  $('#allCards').innerHTML = all.map(card).join('');
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-gain]');
  if (b) openDetail(data.byId.get(b.dataset.gain));
});
$('#regionBtn').addEventListener('click', async () => {
  const r = await ask({
    title: '지역',
    column: true,
    buttons: [...Object.entries(REGIONS).map(([k, l]) => ({ value: k, label: l, kind: k === region ? 'primary' : '' })), { value: null, label: '닫기' }],
  });
  if (!r) return;
  region = r.button;
  history.replaceState(null, '', `#${region}`);
  render();
  window.scrollTo({ top: 0 });
});
addEventListener('hashchange', () => {
  region = pick();
  render();
});

data = await loadPasses();
$('#asof').textContent = `${data.asof} 기준 · 가격은 세금 포함 성인 기준이에요. 사기 전에 공식 사이트에서 한 번 더 확인하세요.`;
render();

// 환율: 술 가격 앱의 환율 API를 같이 쓴다(이득 창의 원화 환산). 오프라인이면 마지막 값.
fetch('../liquor/api/rate')
  .then((r) => r.json())
  .then((d) => d.live && localStorage.setItem('krwPerJpy', d.krwPerJpy))
  .catch(() => {});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
