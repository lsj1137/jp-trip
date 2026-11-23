// 패스 하나의 지도 (map.html#패스id): 탈 수 있는 노선은 색 선, 역·공항·관광지는 점.
// 지도 데이터는 data.json 의 map (research/passmap-*.json). 지도 타일은 간사이 조이패스 지도와 같은 구글 지도(한국어).
import { esc, loadPasses, priceLine, openDetail } from './detail.js';

const $ = (s) => document.querySelector(s);
const COLORS = ['#c8432f', '#3d5a80', '#2f8f6e', '#b5536d', '#d08a16', '#6b5ca5'];
const KIND = { 역: '#3d5a80', 공항: '#6b5ca5', 관광: '#c8432f', 항구: '#2f8f6e' };

const data = await loadPasses();
const p = data.byId.get(decodeURIComponent(location.hash.slice(1)));
if (!p) location.replace('./');

// 목록에서 왔으면 뒤로가기, 바로 열었으면 그 지역 목록으로
$('#back').href = `./#${p.region === 'nationwide' ? '' : p.region}`;
$('#back').addEventListener('click', (e) => {
  if (history.length > 1 && document.referrer.includes('/pass/') && !document.referrer.includes('map.html')) {
    e.preventDefault();
    history.back();
  }
});
document.title = `${p.ko} 지도`;
$('#name').textContent = p.ko;
$('#price').textContent = priceLine(p);
$('#gain').addEventListener('click', () => openDetail(p));

const m = p.map;
if (typeof L === 'undefined') {
  $('#offline').hidden = false;
} else if (m) {
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(m.center, m.zoom);
  L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=ko&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: '0123', attribution: '&copy; Google' }).addTo(map);

  const bounds = [];
  m.routes.forEach((r, i) => {
    const color = COLORS[i % COLORS.length];
    // 흰 테두리 + 색 선으로 지도 위에서 잘 보이게
    L.polyline(r.path, { color: '#fffdf8', weight: 8, opacity: 0.9 }).addTo(map);
    L.polyline(r.path, { color, weight: 4.5, opacity: 0.95 }).addTo(map).bindTooltip(esc(r.name), { sticky: true, className: 'spot-tip' });
    bounds.push(...r.path);
  });
  const markers = m.spots.map((s) => {
    const mk = L.circleMarker([s.lat, s.lng], { radius: 7, color: '#fffdf8', weight: 2.5, fillColor: KIND[s.kind] ?? '#3d5a80', fillOpacity: 1 })
      .addTo(map)
      .bindTooltip(esc(s.name), { permanent: m.spots.length <= 10, direction: 'top', offset: [0, -6], className: 'spot-tip' })
      .bindPopup(`<b>${esc(s.name)}</b> <small lang="ja">${esc(s.ja)}</small><br>${esc(s.note)}`);
    bounds.push([s.lat, s.lng]);
    return mk;
  });
  // 노선·장소가 모두 보이게 맞춘다 (위 제목 줄·아래 시트에 가리지 않게 여백)
  if (bounds.length > 1) map.fitBounds(bounds, { paddingTopLeft: [20, 90], paddingBottomRight: [20, 120], maxZoom: 14 });

  $('#legend').innerHTML =
    m.routes.map((r, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(r.name)}</span>`).join('') +
    Object.entries(KIND)
      .filter(([k]) => m.spots.some((s) => s.kind === k))
      .map(([k, c]) => `<span><i style="background:${c};width:10px;height:10px;border-radius:50%"></i>${k}</span>`)
      .join('');
  $('#spots').innerHTML = m.spots
    .map((s, i) => `<li data-i="${i}"><i class="dot" style="background:${KIND[s.kind] ?? '#3d5a80'}"></i><div><b>${esc(s.name)}<small lang="ja">${esc(s.ja)}</small></b><p>${esc(s.note)}</p></div></li>`)
    .join('');
  $('#spots').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const s = m.spots[li.dataset.i];
    map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    markers[li.dataset.i].openPopup();
    $('#sheet').classList.add('min');
  });
} else {
  $('#offline').textContent = '이 패스는 아직 지도를 준비하지 못했어요. 이득 버튼으로 설명을 볼 수 있어요.';
  $('#offline').hidden = false;
}

// 시트: 손잡이로 접고 펴기
$('#grip').addEventListener('click', () => $('#sheet').classList.toggle('min'));

// 같은 페이지에서 주소의 패스만 바뀌면(#다른패스) 새로 그린다
addEventListener('hashchange', () => location.reload());
