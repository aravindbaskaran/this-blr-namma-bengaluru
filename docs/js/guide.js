/* Guide data, rendering, forms */
/* Guide lists live in data/*.json and are fetched on load. */
let CATEGORIES = [];
let DAYTRIP_COLOR = 'var(--leaf-light)';
let LOCATIONS = [];
let KARNATAKA_PLACES = [];
let NOT_THAT = [];
let FESTIVALS = [];
let DISH_TAGS = [];
let DISHES = [];
let PHRASES = [];
let QUIPS = [];
let GALLERY = [];
let RACES = [];

const PICK_MARK = `<svg class="pick-mark" viewBox="0 0 40 26" role="img" aria-label="Personal pick"><title>Personal pick</title><ellipse cx="10.4" cy="7.2" rx="4.4" ry="4"/><ellipse cx="29.6" cy="7.2" rx="4.4" ry="4"/><path d="M6.6 6.2 L2.4 4.6 L7 9.2Z"/><path d="M33.4 6.2 L37.6 4.6 L33 9.2Z"/><path d="M20 10 C13 12 8.2 16.5 7 23 C13.5 20.2 17 22 20 26 C23 22 26.5 20.2 33 23 C31.8 16.5 27 12 20 10Z"/></svg>`;

const DATA_FILES = {
  categories: 'data/categories.json',
  locations: 'data/locations.json',
  karnatakaPlaces: 'data/karnataka-places.json',
  notThat: 'data/not-that.json',
  festivals: 'data/festivals.json',
  dishes: 'data/dishes.json',
  phrases: 'data/phrases.json',
  quips: 'data/did-you-know.json',
  gallery: 'data/gallery.json',
  races: 'data/races.json',
};

async function fetchJson(path){
  const res = await fetch(path, { cache: 'no-cache' });
  if(!res.ok) throw new Error(path + ' ' + res.status);
  return res.json();
}

async function loadGuideData(){
  const [categories, locations, karnatakaPlaces, notThat, festivals, dishes, phrases, quips, gallery, races] = await Promise.all([
    fetchJson(DATA_FILES.categories),
    fetchJson(DATA_FILES.locations),
    fetchJson(DATA_FILES.karnatakaPlaces),
    fetchJson(DATA_FILES.notThat),
    fetchJson(DATA_FILES.festivals),
    fetchJson(DATA_FILES.dishes),
    fetchJson(DATA_FILES.phrases),
    fetchJson(DATA_FILES.quips),
    fetchJson(DATA_FILES.gallery),
    fetchJson(DATA_FILES.races),
  ]);
  CATEGORIES = categories.categories;
  DAYTRIP_COLOR = categories.daytripColor || DAYTRIP_COLOR;
  LOCATIONS = locations;
  KARNATAKA_PLACES = karnatakaPlaces;
  NOT_THAT = notThat;
  FESTIVALS = festivals;
  DISH_TAGS = dishes.tags || [];
  DISHES = dishes.dishes || dishes;
  PHRASES = phrases;
  QUIPS = quips;
  GALLERY = Array.isArray(gallery) ? gallery : (gallery && gallery.photos) || [];
  RACES = (races && races.races) || (Array.isArray(races) ? races : []);
}

function hideLoader(ok){
  const el = document.getElementById('guide-loader');
  document.body.classList.remove('is-loading');
  if(!el) return;
  if(!ok){
    el.classList.add('is-error');
    el.setAttribute('aria-busy', 'false');
    return;
  }
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('aria-busy', 'false');
  document.querySelectorAll('[data-reveal]').forEach((node, i) => {
    window.setTimeout(() => node.classList.add('is-in'), 50 * i);
  });
}

function syncHeaderOffset(){
  const header = document.querySelector('header');
  if(!header) return;
  document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
}

function moveColophonToEnd(){
  const main = document.getElementById('main');
  const colophon = document.getElementById('colophon');
  if(!main || !colophon) return;
  const band = colophon.previousElementSibling;
  if(band && band.classList.contains('stage-band-straight')) main.appendChild(band);
  main.appendChild(colophon);
}

/* ---------------- state ---------------- */
let currentView = 'list';
let activeCategory = 'all';
let activeHistorySubfilter = 'all';
let agenda = [];
let todoDone = {};
let customLocations = [];

const MODE_KEY = 'blr-guide-mode-v2';
const MODES = ['quickstart', 'full'];
let guideMode = 'full';
const QUICKSTART_LOCATION_IDS = new Set([
  'lalbagh', 'cubbon', 'ulsoor-lake',
  'veena-thindi', 'mtr', 'vidyarthi-bhavan', 'gandhi-bazaar',
  'kr-market', 'chickpet', 'commercial-street',
  'blossom-books', 'bookworm', 'koshys-restaurant',
  'pecos', 'toit',
  'tipu-palace', 'vidhana-soudha', 'bull-temple',
  'map-museum', 'someshwara-temple-halasuru', 'rangoli-metro-art-center',
]);

function isQuickstart(){ return guideMode === 'quickstart'; }
function forMode(list){
  if(guideMode === 'full') return list;
  if(list === FESTIVALS || list === NOT_THAT || list === QUIPS) return list;
  if(list === PHRASES) return list.filter(item => item.quickstart === true);
  return list.filter(item => {
    if(customLocations.some(c => c.id === item.id)) return true;
    if(LOCATIONS.includes(item)) return QUICKSTART_LOCATION_IDS.has(item.id);
    return item.quickstart === true || item.tourist === true;
  });
}
function modeLocations(){
  return forMode(allLocations());
}

function allLocations(){ return LOCATIONS.concat(customLocations); }
function locById(id){
  return allLocations().find(l => l.id === id) || KARNATAKA_PLACES.find(l => l.id === id);
}
function dishesAt(placeId){
  return forMode(DISHES).filter(d => (d.tryIn || []).includes(placeId));
}
function gallerySrc(g){
  if(!g) return '';
  const raw = g.src || g.file;
  if(!raw) return '';
  if(/^https?:/i.test(raw)) return raw;
  return 'gallery/' + String(raw).replace(/^\/?gallery\//, '');
}
function galleryCaption(g){
  return (g && (g.caption || g.description || g.alt)) || '';
}
function inBlrBox(lat, lng){
  return lat >= 12.72 && lat <= 13.20 && lng >= 77.35 && lng <= 77.85;
}
const VERIFIED_PLACE_PHOTO_IDS = new Set([
  'lalbagh', 'cubbon', 'chowdiah', 'sankey-tank', 'map-museum', 'veena-thindi',
  'mtr', 'vidhana-soudha', 'tipu-palace', 'freedom-park', 'ngma',
  'visvesvaraya-museum', 'rangoli-metro-art-center', 'someshwara-temple-halasuru',
  'panchalinga-nageshwara-temple', 'blossom-books', 'gavi-gangadhareshwara-temple',
  'pecos', 'ulsoor-lake', 'nandi-tirtha-kalyani', 'agara-lake', 'puttenahalli-lake',
  'bull-temple', 'gandhi-bazaar', 'kr-market', 'kote-venkataramana-temple',
  'chitrakala-parishath', 'banashankari-devi-temple', 'st-marks-cathedral',
  'st-marys-basilica', 'st-patricks-church', 'st-francis-xavier-cathedral',
  'holy-trinity-church', 'st-johns-church', 'toit', 'jumma-masjid',
  'commercial-street', 'chickpet', 'lakeview-milk-bar', 'malleswaram-market',
  'ubcity', 'koshys-restaurant', 'iskcon', 'palace', 'rangashankara',
  'dodda-ganapathi', 'vidyarthi-bhavan', 'turahalli-forest', 'brigade-mg',
  'doresanipalya-forest', 'desi', 'varnam',
]);
function locationPhotos(l){
  if(LOCATIONS.some(item => item.id === l.id)){
    return l.photos && VERIFIED_PLACE_PHOTO_IDS.has(l.id) ? l.photos : [];
  }
  if(l.photos && l.photos.length) return l.photos;
  const d = dishesAt(l.id).find(x => x.photo);
  return d && d.photo ? [d.photo] : [];
}
function catMeta(id){
  if(id === 'daytrip') return { id:'daytrip', label:'Day trip', color:DAYTRIP_COLOR };
  if(id === 'picks') return { id:'picks', label:'Personal picks', color:'var(--maroon)' };
  return CATEGORIES.find(c=>c.id===id) || CATEGORIES[0];
}
const CATEGORY_MAP = {
  food: 'eat',
  craft: 'streets',
  nature: 'green',
  culture: 'history',
  night: 'evenings',
};
const ADDA_IDS = new Set([
  'dyu-art-cafe', 'atta-galatta', 'blossom-books', 'bookworm',
  'araku-coffee', 'third-wave', 'koshys-restaurant',
]);
const HISTORY_SUBFILTERS = [
  { id:'all', label:'All history, art & worship' },
  { id:'museums-arts', label:'Museums & arts' },
  { id:'civic-history', label:'Civic & historic' },
  { id:'worship', label:'Places of worship' },
];
const HISTORY_MUSEUM_ART_IDS = new Set([
  'indian-music-experience', 'chowdiah', 'map-museum', 'ngma',
  'visvesvaraya-museum', 'hmt-heritage-centre', 'rangoli-metro-art-center',
  'chitrakala-parishath', 'rangashankara',
]);
const HISTORY_WORSHIP_IDS = new Set([
  'someshwara-temple-halasuru', 'panchalinga-nageshwara-temple',
  'gavi-gangadhareshwara-temple', 'nandi-tirtha-kalyani', 'bull-temple',
  'kote-venkataramana-temple', 'banashankari-devi-temple',
  'st-marks-cathedral', 'st-marys-basilica', 'st-patricks-church',
  'st-francis-xavier-cathedral', 'holy-trinity-church', 'st-johns-church',
  'jumma-masjid', 'iskcon', 'dodda-ganapathi',
]);
function categoryIdOf(location){
  if(ADDA_IDS.has(location.id)) return 'addas';
  return CATEGORY_MAP[location.category] || location.category;
}
function historySubfilterOf(location){
  if(HISTORY_MUSEUM_ART_IDS.has(location.id)) return 'museums-arts';
  if(HISTORY_WORSHIP_IDS.has(location.id)) return 'worship';
  return 'civic-history';
}
function exploreItems(){
  return modeLocations().filter(l => {
    if(activeCategory === 'all') return true;
    if(activeCategory === 'picks') return !!(l.personalPick || l.approved);
    if(categoryIdOf(l) !== activeCategory) return false;
    return activeCategory !== 'history' || activeHistorySubfilter === 'all' || historySubfilterOf(l) === activeHistorySubfilter;
  });
}

/* ---------------- persistence ---------------- */
function loadState(){
  try{
    const a = localStorage.getItem('blr-agenda-ids');
    if(a) agenda = JSON.parse(a);
  }catch(e){ agenda = []; }
  try{
    const d = localStorage.getItem('blr-todo-done');
    if(d) todoDone = JSON.parse(d) || {};
  }catch(e){ todoDone = {}; }
  try{
    const c = localStorage.getItem('blr-custom-locations');
    if(c) customLocations = JSON.parse(c);
  }catch(e){ customLocations = []; }
}
function saveAgenda(){
  try{ localStorage.setItem('blr-agenda-ids', JSON.stringify(agenda)); }catch(e){}
  try{ localStorage.setItem('blr-todo-done', JSON.stringify(todoDone)); }catch(e){}
}
function saveCustom(){
  try{ localStorage.setItem('blr-custom-locations', JSON.stringify(customLocations)); }catch(e){}
}

function readGuideMode(){
  try{
    const q = new URLSearchParams(location.search).get('mode');
    if(MODES.includes(q)) return q;
  }catch(e){}
  try{
    const s = localStorage.getItem(MODE_KEY);
    if(MODES.includes(s)) return s;
  }catch(e){}
  return 'full';
}
function setGuideMode(mode){
  if(!MODES.includes(mode)) return;
  guideMode = mode;
  applyGuideMode(true);
}
function applyGuideMode(persist){
  document.body.dataset.mode = guideMode;
  document.querySelectorAll('.mode-toggle button').forEach(btn => {
    btn.dataset.active = String(btn.getAttribute('data-mode') === guideMode);
  });
  if(persist){
    try{ localStorage.setItem(MODE_KEY, guideMode); }catch(e){}
    try{
      const url = new URL(location.href);
      if(guideMode === 'full') url.searchParams.delete('mode');
      else url.searchParams.set('mode', guideMode);
      history.replaceState({}, '', url);
    }catch(e){}
  }
  if(isQuickstart() && activeCategory === 'picks') activeCategory = 'all';
  if(LOCATIONS.length){
    renderPills();
    renderList();
    renderDaytrips();
    renderFestivals();
    renderTNT();
    renderQuips();
    renderFoodPreview();
    renderPhrases();
    renderGallery();
    renderRacesPreview();
    renderMap();
  }
}
window.setGuideMode = setGuideMode;

function openInfoDialog(id){
  const dialog = document.getElementById(id);
  if(!dialog) return;
  if(typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeInfoDialog(dialog){
  if(!dialog) return;
  if(typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}
window.openInfoDialog = openInfoDialog;
window.closeInfoDialog = closeInfoDialog;

/* ---------------- render: category pills ---------------- */
function renderPills(){
  const row = document.getElementById('categoryPills');
  const extras = isQuickstart() ? [] : [{id:'picks', label:'Personal picks'}];
  const all = [{id:'all', label:'All'}].concat(extras).concat(CATEGORIES);
  row.innerHTML = all.map(c =>
    `<button class="pill" data-active="${activeCategory===c.id}" onclick="setCategory('${c.id}')">${c.label}</button>`
  ).join('');
  renderHistorySubfilters();
}
function renderHistorySubfilters(){
  const row = document.getElementById('historySubfilters');
  if(!row) return;
  row.hidden = activeCategory !== 'history';
  row.innerHTML = HISTORY_SUBFILTERS.map(item =>
    `<button class="pill" data-active="${activeHistorySubfilter===item.id}" onclick="setHistorySubfilter('${item.id}')">${item.label}</button>`
  ).join('');
}
function setHistorySubfilter(id){
  if(!HISTORY_SUBFILTERS.some(item => item.id === id)) return;
  activeHistorySubfilter = id;
  renderHistorySubfilters();
  renderList();
  renderMap();
}
function setCategory(id){
  activeCategory = id;
  if(id !== 'history') activeHistorySubfilter = 'all';
  renderPills();
  renderList();
  renderMap();
}
window.setHistorySubfilter = setHistorySubfilter;

/* ---------------- render: list view ---------------- */
function buildLocationCard(l){
  const cat = catMeta(categoryIdOf(l));
  const added = agenda.includes(l.id);
  const photos = locationPhotos(l);
  const photosHtml = photos.length
    ? `<div class="camera-roll">${photos.map(src => waitPhoto(src, l.name, '', `tabindex="0" role="button" aria-label="View larger photo of ${esc(l.name)}" onclick="openLightbox('${esc(src)}', '${esc(l.name)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox('${esc(src)}', '${esc(l.name)}')}"`)).join('')}</div>`
    : `<div class="camera-roll-empty"><span>No photo yet. <a href="#add-yours">Write in</a> if you can add one.</span></div>`;
  const pickHtml = (l.personalPick || l.approved) ? PICK_MARK : '';
  const eat = dishesAt(l.id);
  const eatHtml = eat.length
    ? `<div class="try-block eat-here"><div class="try-label">Eat here</div><div class="dish-try-list">${eat.map(d =>
        `<button type="button" onclick="focusDish('${d.id}')">${d.name}</button>`
      ).join('')}</div></div>`
    : '';
  const fieldNotes = l.fieldNotes || {};
  const goFor = fieldNotes.order || fieldNotes.goFor || (l.try && l.try[0]) || '';
  const fieldAnchorItems = [
    ['Timing', fieldNotes.timing],
    ['Go for', goFor],
    ['Day off', fieldNotes.dayOff],
  ].filter(([, value]) => value);
  const fieldNotesHtml = fieldAnchorItems.length
    ? `<dl class="field-anchors" aria-label="Peer field notes">${fieldAnchorItems.map(([label, value]) =>
        `<div><dt>${label}</dt><dd>${value}</dd></div>`
      ).join('')}</dl>`
    : '';
  const skipHtml = skipCrowdHtml(l);
  const pronounceHtml = l.kn ? `<div class="card-pronounce">${knCycle(l.kn, l.name, 'card-kn')}<span class="card-say">${l.say || ''}</span>${speakBtn(l.kn, 'sm')}</div>` : '';
  const onCityMap = LOCATIONS.some(x => x.id === l.id) || customLocations.some(x => x.id === l.id);
  const mapLinkHtml = onCityMap && (typeof l.lat === 'number' && typeof l.lng === 'number')
    ? `<button class="map-link-btn" onclick="viewOnMap('${l.id}')">📍 View on map</button>` : '';
  const webLabel = l.url && /maps\.(app\.)?goo|google\.com\/maps/i.test(l.url) ? 'Google Maps' : 'Website';
  const webHtml = l.url ? `<a class="map-link-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${webLabel}</a>` : '';
  return `<div class="card" id="card-${l.id}" style="--cat-color:${cat.color}">
      ${photosHtml}
      <div class="card-top">
        <div>
          <div class="card-title-row">${pickHtml}<h3>${l.name}</h3></div>
          <div class="area">${l.area}</div>${pronounceHtml}
        </div>
        <span class="tag">${cat.label}</span>
      </div>
      <div class="card-body">
        <p class="blurb">${l.blurb}</p>
        ${l.personalNote ? `<aside class="personal-note"><span class="try-label">Aravind's note</span> ${esc(l.personalNote)}</aside>` : ''}
        ${fieldNotesHtml}
        ${eatHtml}
        ${skipHtml}
      </div>
      <div class="card-actions">
        <button class="add-btn" data-added="${added}" onclick="toggleAgenda('${l.id}')">${added ? 'On your list ✓' : '+ Add to list'}</button>
        ${mapLinkHtml}
        ${webHtml}
      </div>
    </div>`;
}
function skipCrowdHtml(l){
  const s = l.skipCrowd;
  if(!s) return '';
  const instead = s.insteadId ? allLocations().find(x => x.id === s.insteadId) : null;
  const name = instead ? instead.name : '';
  const go = instead ? `<button class="map-link-btn" type="button" onclick="focusPlace('${instead.id}')">Open ${instead.name}</button>` : '';
  return `<details class="skip-details">
    <summary>Skip the crowd</summary>
    <p class="why" style="margin-top:8px;color:var(--ink-soft)">${s.why}</p>
    <div class="skip-instead">
      ${name ? `<div class="place">${name}</div>` : ''}
      <div class="why">${s.insteadNote || ''}</div>
      ${go}
    </div>
  </details>`;
}
function focusDish(id){
  location.href = 'food.html#dish-' + encodeURIComponent(id);
}
function focusPlace(id){
  if(typeof setView === 'function') setView('list');
  setCategory('all');
  requestAnimationFrame(() => {
    const el = document.getElementById('card-' + id);
    if(el){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.style.outline = '2px solid var(--leaf)';
      window.setTimeout(() => { el.style.outline = ''; }, 1600);
    } else {
      viewOnMap(id);
    }
  });
}
function renderList(){
  const wrap = document.getElementById('listView');
  const items = exploreItems();
  wrap.innerHTML = items.map(buildLocationCard).join('') || `<p style="color:var(--ink-soft);">No spots in this filter yet.</p>`;
  armPhotoWaits(wrap);
}
function renderDaytrips(){
  const wrap = document.getElementById('daytripGrid');
  if(!wrap) return;
  wrap.innerHTML = forMode(KARNATAKA_PLACES).map(buildLocationCard).join('');
  armPhotoWaits(wrap);
}

/* ---------------- render: map view ---------------- */
/* ---------------- map view (Leaflet + OpenStreetMap, no API key) ---------------- */
let leafletMap = null;
let leafletMarkers = [];
const BLR_CENTER = [12.9716, 77.5946];
function renderMap(){
  if(currentView !== 'map') return;
  if(typeof L === 'undefined'){
    document.getElementById('mapWrap').innerHTML = '<p style="padding:24px;color:var(--ink-soft);font-size:13.5px;">Map couldn\'t load - this needs an internet connection to fetch map tiles from OpenStreetMap. Try the list view instead.</p>';
    return;
  }
  const items = exploreItems().filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');
  if(!leafletMap){
    leafletMap = L.map('mapWrap', {
      scrollWheelZoom: true,
      maxBounds: [[12.72, 77.35], [13.20, 77.85]],
      maxBoundsViscosity: 0.7,
    }).setView(BLR_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(leafletMap);
  }
  leafletMarkers.forEach(m => leafletMap.removeLayer(m));
  leafletMarkers = [];
  const bounds = [];
  const cityBounds = [];
  items.forEach(l=>{
    const cat = catMeta(categoryIdOf(l));
    const icon = L.divIcon({
      className: 'map-pin-wrap',
      html: `<span class="map-pin-icon" style="background:${cat.color}"></span>`,
      iconSize:[18,18], iconAnchor:[9,16], popupAnchor:[0,-12],
    });
    const marker = L.marker([l.lat, l.lng], { icon, title: l.name }).addTo(leafletMap);
    marker.bindPopup(`<div class="map-popup-title">${l.name}</div><div class="map-popup-area">${l.area}</div>${l.blurb}`);
    marker.locId = l.id;
    leafletMarkers.push(marker);
    bounds.push([l.lat, l.lng]);
    const dlat = l.lat - BLR_CENTER[0];
    const dlng = (l.lng - BLR_CENTER[1]) * Math.cos(BLR_CENTER[0] * Math.PI/180);
    if((dlat*dlat + dlng*dlng) < 0.12*0.12) cityBounds.push([l.lat, l.lng]);
  });
  GALLERY.forEach(g => {
    const src = gallerySrc(g);
    const lat = g.lat, lng = g.lng;
    if(!src || typeof lat !== 'number' || typeof lng !== 'number') return;
    if(!inBlrBox(lat, lng)) return;
    const title = galleryCaption(g) || 'Contributor photo';
    const icon = L.divIcon({
      className: 'map-pin-wrap',
      html: `<span class="map-pin-icon" style="background:var(--maroon)"></span>`,
      iconSize:[18,18], iconAnchor:[9,16], popupAnchor:[0,-12],
    });
    const marker = L.marker([lat, lng], { icon, title }).addTo(leafletMap);
    marker.bindPopup(`<div class="map-popup-title">${esc(title)}</div>${g.by ? `<div class="map-popup-area">${esc(g.by)}</div>` : ''}`);
    marker.galleryId = g.id;
    leafletMarkers.push(marker);
    bounds.push([lat, lng]);
    cityBounds.push([lat, lng]);
  });
  const fit = cityBounds.length ? cityBounds : bounds;
  if(fit.length){
    leafletMap.fitBounds(fit, { padding:[36,36], maxZoom:13 });
  } else {
    leafletMap.setView(BLR_CENTER, 12);
  }
  setTimeout(()=>{ if(leafletMap) leafletMap.invalidateSize(); }, 80);
}

/* ---------------- view toggle ---------------- */
function setView(v){
  currentView = v;
  document.getElementById('listView').style.display = v==='list' ? 'flex' : 'none';
  document.getElementById('mapView').style.display = v==='map' ? 'block' : 'none';
  document.querySelectorAll('.view-toggle button').forEach(b=>{
    b.dataset.active = (b.dataset.view === v);
  });
  if(v==='map') renderMap();
}
function viewOnMap(id){
  setView('map');
  document.getElementById('mapWrap').scrollIntoView({behavior:'smooth', block:'center'});
  setTimeout(()=>{
    const marker = leafletMarkers.find(m => m.locId === id);
    if(marker && leafletMap){
      leafletMap.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }, 200);
}

/* ---------------- to-do list ---------------- */
function toggleAgenda(id){
  if(agenda.includes(id)){
    agenda = agenda.filter(x=>x!==id);
    delete todoDone[id];
  } else {
    agenda.push(id);
  }
  saveAgenda();
  renderList();
  renderDaytrips();
  renderAgendaCount();
  renderDrawer();
}
function toggleTodoDone(id){
  todoDone[id] = !todoDone[id];
  saveAgenda();
  renderAgendaCount();
  renderDrawer();
}
function clearDoneTodos(){
  agenda = agenda.filter(id => !todoDone[id]);
  todoDone = {};
  saveAgenda();
  renderList();
  renderDaytrips();
  renderAgendaCount();
  renderDrawer();
}
function todoItems(){
  return agenda.map(id => {
    const l = allLocations().find(x => x.id === id);
    if(!l) return null;
    return { loc: l, done: !!todoDone[id] };
  }).filter(Boolean);
}
function renderAgendaCount(){
  const open = agenda.filter(id => !todoDone[id]).length;
  const el = document.getElementById('agendaCount');
  if(el) el.textContent = String(open);
}
function renderDrawer(){
  const body = document.getElementById('drawerBody');
  if(!body) return;
  if(agenda.length===0){
    body.innerHTML = `<p class="drawer-empty">Nothing on the list yet. Tap "+ Add to list" on any card in Explore or Karnataka.</p>`;
    return;
  }
  body.innerHTML = todoItems().map(({loc:l, done}) => `
    <div class="drawer-item${done ? ' is-done' : ''}">
      <label class="todo-check">
        <input type="checkbox" ${done ? 'checked' : ''} onchange="toggleTodoDone('${l.id}')">
        <span>
          <span class="todo-name">${esc(l.name)}</span>
          <span class="meta">${esc(l.area)}</span>
        </span>
      </label>
      <button type="button" onclick="toggleAgenda('${l.id}')">Remove</button>
    </div>
  `).join('');
}
function openDrawer(){
  toggleNav(false);
  document.getElementById('drawer').dataset.open = 'true';
  document.getElementById('drawerBackdrop').dataset.open = 'true';
  renderDrawer();
}
function closeDrawer(){
  document.getElementById('drawer').dataset.open = 'false';
  document.getElementById('drawerBackdrop').dataset.open = 'false';
}
function openLightbox(src, alt){
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  img.src = src;
  img.alt = alt || '';
  box.dataset.open = 'true';
}
function closeLightbox(){
  const box = document.getElementById('lightbox');
  box.dataset.open = 'false';
  const img = document.getElementById('lightboxImg');
  img.src = '';
  img.alt = '';
}
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    closeLightbox();
    closeDrawer();
  }
});

function todoChecklistText(){
  const items = todoItems();
  return ['Bengaluru to-do', ''].concat(items.map(({loc:l, done}) => `- [${done ? 'x' : ' '}] ${l.name} (${l.area})`)).join('\n');
}
function icsEscape(s){
  return String(s || '').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}
async function copyTodo(){
  const text = todoChecklistText();
  const btn = document.querySelector('.copy-btn');
  try{
    await navigator.clipboard.writeText(text);
    if(btn){
      const original = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(()=>{ btn.textContent = original; }, 1500);
    }
  }catch(e){
    alert(text);
  }
}
function downloadTodoIcs(){
  const items = todoItems();
  if(!items.length) return;
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//namma-blr//guide//EN','CALSCALE:GREGORIAN'];
  items.forEach(({loc:l, done}) => {
    lines.push(
      'BEGIN:VTODO',
      'UID:blr-' + l.id + '@namma-bengaluru',
      'DTSTAMP:' + stamp,
      'SUMMARY:' + icsEscape(l.name + ' (' + l.area + ')'),
      l.blurb ? 'DESCRIPTION:' + icsEscape(l.blurb) : '',
      'STATUS:' + (done ? 'COMPLETED' : 'NEEDS-ACTION'),
      'END:VTODO'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.filter(Boolean).join('\r\n')], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bengaluru-todo.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function shareTodo(){
  const text = todoChecklistText();
  if(navigator.share){
    try{
      await navigator.share({ title: 'Bengaluru to-do', text });
      return;
    }catch(e){
      if(e && e.name === 'AbortError') return;
    }
  }
  copyTodo();
}

async function copyAgenda(){ return copyTodo(); }

/* ---------------- this, not that ---------------- */
function renderTNT(){
  const wrap = document.getElementById('tntList');
  wrap.innerHTML = forMode(NOT_THAT).map(row => `
    <article class="tnt-card">
      <p class="often"><span class="tnt-kicker">Assumption</span>${row.often}</p>
      <p class="also"><span class="tnt-kicker">Reality</span>${row.also}</p>
    </article>
  `).join('');
}

/* ---------------- festivals ---------------- */
function renderFestivals(){
  const wrap = document.getElementById('festivalGrid');
  wrap.innerHTML = forMode(FESTIVALS).map(f => `
    <div class="festival-card" style="--fest-color:${f.color}">
      <div class="festival-top">
        <h3>${f.name}</h3>
        <span class="festival-when">${f.when}</span>
      </div>
      <div class="festival-where">${f.where} · ${knCycle(f.kn, f.name)}</div>
      <p>${f.blurb}</p>
      ${f.url ? `<p class="festival-credit"><a href="${f.url}" target="_blank" rel="noopener">Programme</a>${f.also ? ` · <a href="${f.also.url}" target="_blank" rel="noopener">${f.also.label}</a>` : ''}</p>` : ''}
    </div>
  `).join('');
}

/* ---------------- did you know ---------------- */
function renderQuips(){
  const wrap = document.getElementById('quipGrid');
  if(!wrap) return;
  wrap.innerHTML = forMode(QUIPS).map(q => `
    <article class="quip-card${q.featured ? ' featured' : ''}">
      <div>
        <div class="quip-kicker">Did you know</div>
        <h3>${q.q}</h3>
        ${q.kn ? knCycle(q.kn, q.knEn || q.q, 'quip-kn') : ''}
      </div>
      <p>${q.a}</p>
    </article>
  `).join('');
}

/* ---------------- dishes: preview, full notebook lives on food.html ---------------- */
function renderFoodPreview(){
  const sec = document.getElementById('foodPreview');
  const host = document.getElementById('dishPreviewGrid');
  const more = document.getElementById('dishMore');
  if(!sec || !host) return;
  const items = forMode(DISHES).filter(d => d && d.name);
  if(!items.length){
    sec.hidden = true;
    if(more) more.hidden = true;
    return;
  }
  sec.hidden = false;
  const limit = (window.GuideFood && GuideFood.PREVIEW) || 4;
  const preview = items.filter(d => d.personalPick).concat(items.filter(d => !d.personalPick)).slice(0, limit);
  const locIds = new Set(allLocations().map(l => l.id));
  const ctx = {
    tags: DISH_TAGS,
    place(id){
      const p = locById(id);
      return p ? { id: p.id, name: p.name, inCity: locIds.has(p.id) } : null;
    }
  };
  if(window.GuideFood && GuideFood.fill){
    GuideFood.fill(host, preview, ctx);
  } else {
    host.innerHTML = preview.map(d => `<div class="dish-card" id="dish-${d.id}"><div class="dish-name-row"><div class="dish-name">${esc(d.name)}</div></div><p class="dish-desc">${esc(d.desc || '')}</p></div>`).join('');
  }
  if(more){
    more.hidden = false;
    const a = more.querySelector('a');
    if(a) a.textContent = DISHES.length > limit ? `See all ${DISHES.length} dishes` : 'See the whole food notebook';
  }
}

/* ---------------- learn kannada ---------------- */
function renderPhrases(){
  const wrap = document.getElementById('phraseGrid');
  const GROUP_ORDER = ['Greetings & courtesy', 'Getting to know someone', 'Everyday essentials', 'Food & warmth', 'Ordering food & coffee', 'Respect & address'];
  const cardHtml = (p) => {
    const variantHtml = p.variant && !isQuickstart() ? `<div class="p-variant"><span class="p-variant-label">${p.variant.region}</span><span class="p-variant-line">"${p.variant.kn}" - ${p.variant.translit}${p.variant.say ? ` (say: ${p.variant.say})` : ''} ${speakBtn(p.variant.kn, 'sm')}</span></div>` : '';
    const examplesHtml = p.examples ? `<div class="p-examples">${p.examples.map(ex => `
        <div class="p-example"><span class="p-ex-kn">${ex.kn}</span><span class="p-ex-translit">${ex.translit}</span> - ${ex.meaning} ${speakBtn(ex.kn, 'sm')}</div>
      `).join('')}</div>` : '';
    const sayHtml = p.say ? `<div class="p-say">say: ${p.say}</div>` : '';
    return `<div class="phrase-card">
      <div class="p-kn-row">${knCycle(p.kn, p.meaning, 'p-kn')}${speakBtn(p.kn)}</div>
      <div class="p-translit">${p.translit}</div>
      ${sayHtml}
      <div class="p-meaning">${p.meaning}</div>
      <div class="p-tip">${p.tip}</div>
      ${examplesHtml}
      ${variantHtml}
    </div>`;
  };
  wrap.innerHTML = GROUP_ORDER.map(group => {
    const items = forMode(PHRASES).filter(p => p.group === group);
    if(!items.length) return '';
    return `<div class="phrase-group">
      <h3 class="phrase-group-title">${group}</h3>
      <div class="rail-clip"><div class="phrase-group-grid">${items.map(cardHtml).join('')}</div></div>
    </div>`;
  }).join('');
}
const SPEECH_OK = (typeof window !== 'undefined' && 'speechSynthesis' in window);
/* Either voice needs one of these; kannada-voice.js only needs Web Audio. */
const VOICE_OK = SPEECH_OK || (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window));
function speakText(text){
  if(!text) return;
  /* A pre-rendered Kannada clip takes it when there is one (see kannada-voice.js). */
  if(window.NammaVoice && window.NammaVoice.speak(text)) return;
  speakWithBrowserVoice(text);
}
/* Whatever Kannada voice the device happens to ship with - usually none. */
function speakWithBrowserVoice(text){
  if(!SPEECH_OK || !text) return;
  try{
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'kn-IN';
    utter.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const knVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('kn'));
    if(knVoice) utter.voice = knVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }catch(e){ /* speech not available - silently ignore */ }
}
function speakBtn(text, size){
  if(!VOICE_OK || !text) return '';
  const safe = text.replace(/'/g, "\\'");
  const cls = size==='sm' ? 'speak-btn speak-btn-sm' : 'speak-btn';
  return `<button class="${cls}" onclick="speakText('${safe}')" aria-label="Hear pronunciation">\uD83D\uDD0A</button>`;
}
function speakPhrase(i){ speakText(PHRASES[i].kn); }

/* ---------------- history: growing map ---------------- */
function setEra(i){
  document.querySelectorAll('.timeline-item').forEach(el=>{
    const on = parseInt(el.dataset.era, 10) === i;
    el.classList.toggle('active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ---------------- write-in tabs ---------------- */
function setWriteIn(which){
  const spot = which === 'spot';
  const tabSpot = document.getElementById('tab-spot');
  const tabAsk = document.getElementById('tab-ask');
  const panelSpot = document.getElementById('panel-spot');
  const panelAsk = document.getElementById('panel-ask');
  if(!tabSpot || !tabAsk) return;
  tabSpot.setAttribute('aria-selected', spot ? 'true' : 'false');
  tabAsk.setAttribute('aria-selected', spot ? 'false' : 'true');
  if(panelSpot) panelSpot.hidden = !spot;
  if(panelAsk) panelAsk.hidden = spot;
}

function setBeyondTab(which){
  document.querySelectorAll('[data-beyond-tab]').forEach(btn => {
    btn.setAttribute('aria-selected', String(btn.dataset.beyondTab === which));
  });
  document.querySelectorAll('[data-beyond-panel]').forEach(panel => {
    panel.hidden = panel.dataset.beyondPanel !== which;
  });
}
window.setBeyondTab = setBeyondTab;

const GUIDE_REPO = 'https://github.com/aravindbaskaran/this-blr-namma-bengaluru';
const PEOPLE_NOTES = {
  aravindbaskaran: { name: 'Aravind Baskaran', role: 'Started the guide' },
  'vinaykarthikbaluguri-svg': { name: 'Vinay Karthik Baluguri', role: 'Kannada audio', blurb: 'Recorded and wired the spoken Kannada on this page.' },
  karthik4222: { name: 'Vinay Karthik Baluguri', role: 'Kannada audio', sameAs: 'vinaykarthikbaluguri-svg' },
  'deepikarajan-swym': { name: 'Deepika Varadarajan', role: 'Places, day trips, and fact-check', blurb: "I've called Bengaluru home for eight years now. Most weekends find me at a local darshini for breakfast, working through a dosa and filter coffee. I'm particularly drawn to the city's colonial-era layer: the cantonment bungalows, churches, and civic buildings that were here long before the tech parks. Bengaluru has a way of making room for everyone who comes here with its warmth and working on this guide has been a good excuse to reminisce about a city I've come to call home." },
  hassanrelated: { name: 'Hassan', role: 'Layout and saree bands', blurb: 'Page layout and the saree bands that sit between sections.' },
  'namita-raddi': { name: 'Namita Raddi', role: 'Spots, food, habbas, and craft', blurb: 'Places to eat, places to go, the habbas that mark the year, and craft rooms: Desi, Varnam, and Channapatna.' },
  sakshigupta1996: { name: 'Sakshi Gupta', role: 'Location photo cards', blurb: 'Turned the 60px thumbnail under Try into a full-bleed photo band on each spot card. When a Commons file fails, the band collapses instead of leaving a hole.' }
};

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function knCycle(kn, en, extraClass){
  if(!kn) return '';
  const native = esc(kn);
  const cls = extraClass ? `kn kn-cycle ${extraClass}` : 'kn kn-cycle';
  if(!en) return `<span class="${cls}">${native}</span>`;
  return `<span class="${cls}" tabindex="0"><span class="kn-native">${native}</span><span class="kn-en">${esc(en)}</span></span>`;
}

function photoWaitReady(img){
  const wrap = img && img.closest('.photo-wait');
  if(wrap) wrap.classList.add('is-ready');
}
function photoWaitFail(img, kind){
  const wrap = img && img.closest('.photo-wait');
  if(!wrap) return;
  if(kind === 'dish'){
    wrap.outerHTML = '<div class="dish-photo dish-photo-empty" aria-hidden="true">No photo yet</div>';
  } else {
    wrap.remove();
  }
}
function waitPhoto(src, alt, extraClass, attrs, kind){
  const cls = extraClass || '';
  const failKind = kind === 'dish' ? 'dish' : '';
  return `<div class="photo-wait"><span class="photo-wait-deco" aria-hidden="true"></span><span class="photo-wait-copy kn kn-cycle" tabindex="0"><span class="kn-native">ಸ್ವಲ್ಪ ನಿಲ್ಲಿ</span><span class="kn-en">hold on</span></span><img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" ${attrs || ''} onload="photoWaitReady(this)" onerror="photoWaitFail(this, '${failKind}')"></div>`;
}
function armPhotoWaits(root){
  (root || document).querySelectorAll('.photo-wait img').forEach(img => {
    if(img.complete && img.naturalWidth) photoWaitReady(img);
    else if(img.complete) photoWaitFail(img, img.classList.contains('dish-photo') ? 'dish' : '');
  });
}
function toggleModeTip(e){
  e.stopPropagation();
  const tip = document.getElementById('modeTip');
  const btn = e.currentTarget;
  if(!tip || !btn) return;
  const willOpen = tip.hidden;
  closeModeTip();
  if(!willOpen) return;
  tip.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 24);
  let left = r.right - width;
  if(left < 12) left = 12;
  if(left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  let top = r.bottom + 8;
  if(top + 180 > window.innerHeight) top = Math.max(12, r.top - 188);
  tip.style.top = top + 'px';
  tip.style.left = left + 'px';
}
function closeModeTip(){
  const tip = document.getElementById('modeTip');
  if(tip) tip.hidden = true;
  document.querySelectorAll('.mode-tip-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
function commonsFilePage(src){
  if(!src) return null;
  try{
    const u = new URL(src, (typeof location !== 'undefined' && location.origin) || 'https://example.invalid');
    if(!/(^|\.)wikimedia\.org$/i.test(u.hostname)) return null;
    const path = decodeURIComponent(u.pathname);
    if(path.includes('Special:FilePath/')){
      const file = decodeURIComponent(path.split('Special:FilePath/')[1]).replace(/ /g, '_');
      return 'https://commons.wikimedia.org/wiki/File:' + file;
    }
    if(path.includes('/wiki/File:')){
      return 'https://commons.wikimedia.org/wiki/File:' + path.split('/wiki/File:')[1].replace(/ /g, '_');
    }
    const m = path.match(/\/([^/]+\.(?:jpe?g|png|gif|webp))$/i);
    if(m){
      return 'https://commons.wikimedia.org/wiki/File:' + m[1].replace(/ /g, '_');
    }
  }catch(err){ /* skip */ }
  return null;
}
function viewGalleryPin(lat, lng, id){
  if(typeof lat !== 'number' || typeof lng !== 'number' || !inBlrBox(lat, lng)) return;
  setView('map');
  document.getElementById('mapWrap').scrollIntoView({behavior:'smooth', block:'center'});
  setTimeout(()=>{
    let marker = leafletMarkers.find(m => m.galleryId === id);
    if(!marker && leafletMap){
      marker = leafletMarkers.find(m => {
        const p = m.getLatLng && m.getLatLng();
        return p && Math.abs(p.lat - lat) < 1e-5 && Math.abs(p.lng - lng) < 1e-5;
      });
    }
    if(marker && leafletMap){
      leafletMap.setView(marker.getLatLng(), 15);
      marker.openPopup();
    } else if(leafletMap){
      leafletMap.setView([lat, lng], 15);
    }
  }, 200);
}

function renderGallery(){
  const sec = document.getElementById('contribGallery');
  const host = document.getElementById('galleryGrid');
  const more = document.getElementById('galleryMore');
  if(!sec || !host) return;
  const items = GALLERY.filter(g => gallerySrc(g));
  if(!items.length){
    sec.hidden = true;
    if(more) more.hidden = true;
    return;
  }
  sec.hidden = false;
  const limit = (window.GuidePhotos && GuidePhotos.PREVIEW) || 4;
  const preview = items.slice(0, limit);
  if(window.GuidePhotos && GuidePhotos.fillGrid){
    GuidePhotos.fillGrid(host, preview, 'pin');
  } else {
    host.innerHTML = preview.map(g => {
      const src = gallerySrc(g);
      const cap = galleryCaption(g);
      const alt = g.alt || cap || 'Contributor photo';
      const wide = !!g.wide;
      let pin = '';
      if(typeof g.lat === 'number' && typeof g.lng === 'number' && inBlrBox(g.lat, g.lng)){
        pin = `<button type="button" class="gallery-map" onclick="viewGalleryPin(${g.lat},${g.lng},${JSON.stringify(g.id || '')})">Map</button>`;
      }
      const by = g.by ? `<span class="gallery-by">${esc(g.by)}</span>` : '';
      return `<figure class="gallery-shot${wide ? ' is-wide' : ''}">
      ${waitPhoto(src, alt, 'gallery-img', `tabindex="0" role="button" aria-label="${esc(alt)}" onclick="openLightbox('${esc(src)}', '${esc(alt)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox('${esc(src)}', '${esc(alt)}')}"`)}
      <figcaption>
        <p>${esc(cap)}</p>
        ${(by || pin) ? `<p class="gallery-shot-meta">${by}${by && pin ? ' ' : ''}${pin}</p>` : ''}
      </figcaption>
    </figure>`;
    }).join('');
    armPhotoWaits(host);
  }
  if(more){
    more.hidden = false;
    const a = more.querySelector('a');
    if(a) a.textContent = items.length > limit ? `See all ${items.length} photos` : 'See all photos';
  }
}

function renderRacesPreview(){
  const sec = document.getElementById('racesPreview');
  const host = document.getElementById('racePreviewGrid');
  const more = document.getElementById('raceMore');
  if(!sec || !host) return;
  const items = RACES.filter(r => r && r.name);
  if(!items.length){
    sec.hidden = true;
    if(more) more.hidden = true;
    return;
  }
  sec.hidden = false;
  const preview = items.filter(r => r.preview).concat(items.filter(r => !r.preview)).slice(0, 4);
  if(window.GuideRaces && GuideRaces.fill){
    GuideRaces.fill(host, preview);
  } else {
    host.innerHTML = preview.map(r => `<article class="race-card"><h3>${esc(r.name)}</h3><p class="race-blurb">${esc(r.blurb || '')}</p></article>`).join('');
  }
  if(more){
    more.hidden = false;
    const a = more.querySelector('a');
    if(a) a.textContent = items.length > 4 ? `See all ${items.length} runs` : 'See all runs';
  }
}

/* food.html links back to a place by id; open the full notebook if it is not in Quickstart */
function focusPlaceFromQuery(){
  const id = new URLSearchParams(location.search).get('place');
  if(!id) return;
  if(!allLocations().some(l => l.id === id)) return;
  if(!modeLocations().some(l => l.id === id)) setGuideMode('full');
  focusPlace(id);
}

function openPhotoFromQuery(){
  const id = new URLSearchParams(location.search).get('photo');
  if(!id) return;
  const g = GALLERY.find(x => x.id === id);
  if(!g || typeof g.lat !== 'number' || typeof g.lng !== 'number') return;
  viewGalleryPin(g.lat, g.lng, g.id);
}

function renderPhotoCredits(){
  const host = document.getElementById('photoCreditList');
  if(!host) return;
  const rows = [];
  const seen = new Set();
  const add = (label, src) => {
    const page = commonsFilePage(src);
    if(!page || seen.has(page)) return;
    seen.add(page);
    const file = page.split('/wiki/File:')[1] || src;
    rows.push({ label, page, file: file.replace(/_/g, ' ') });
  };
  LOCATIONS.concat(KARNATAKA_PLACES).forEach(l => {
    (l.photos || []).forEach(src => add(l.name, src));
  });
  DISHES.forEach(d => { if(d.photo) add(d.name, d.photo); });
  GALLERY.forEach(g => {
    const src = gallerySrc(g);
    if(!src) return;
    const label = galleryCaption(g) || g.by || g.id || 'Contributor photo';
    const page = commonsFilePage(src);
    if(page){
      add(label, src);
      return;
    }
    if(seen.has(src)) return;
    seen.add(src);
    const who = g.by ? ` (${g.by})` : '';
    rows.push({ label: label + who, page: src, file: g.file || src, local: true });
  });
  rows.sort((a, b) => a.label.localeCompare(b.label));
  host.innerHTML = rows.map(r =>
    r.local
      ? `<li>${esc(r.label)} <span class="credit-file">${esc(r.file)}</span></li>`
      : `<li><a href="${esc(r.page)}" target="_blank" rel="noopener">${esc(r.label)}</a> <span class="credit-file">${esc(r.file)}</span></li>`
  ).join('');
}

function toggleNav(force){
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('navToggle');
  if(!nav || !btn) return;
  const open = force == null ? !nav.classList.contains('is-open') : !!force;
  nav.classList.toggle('is-open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(!open) closeNavSub();
}
function closeNavSub(){
  const btn = document.getElementById('navSubBtn');
  const list = document.getElementById('navSubList');
  if(list) list.hidden = true;
  if(btn) btn.setAttribute('aria-expanded', 'false');
}
function toggleNavSub(e){
  if(e) e.stopPropagation();
  const btn = document.getElementById('navSubBtn');
  const list = document.getElementById('navSubList');
  if(!btn || !list) return;
  const willOpen = list.hidden;
  closeNavSub();
  if(!willOpen) return;
  list.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}

async function loadPeople(){
  const host = document.getElementById('peopleList');
  const moreHead = document.getElementById('peopleMoreHead');
  if(!host) return;
  const seed = Object.entries(PEOPLE_NOTES)
    .filter(([login, n]) => login !== 'aravindbaskaran' && !n.sameAs)
    .map(([login]) => ({
      login,
      html_url: 'https://github.com/' + login,
      avatar_url: 'https://github.com/' + login + '.png',
      type: 'User'
    }));
  const byLogin = new Map(seed.map(p => [p.login, p]));
  const contribLogins = new Set();
  const remember = (p) => {
    if(!p || !p.login || p.type === 'Bot') return;
    const note = PEOPLE_NOTES[p.login];
    if(note && note.sameAs) return;
    byLogin.set(p.login, Object.assign({}, byLogin.get(p.login) || {}, p));
  };
  try{
    const [contribRes, issueRes] = await Promise.all([
      fetch('https://api.github.com/repos/aravindbaskaran/this-blr-namma-bengaluru/contributors?per_page=100'),
      fetch('https://api.github.com/repos/aravindbaskaran/this-blr-namma-bengaluru/issues?state=all&per_page=100')
    ]);
    const contribs = contribRes.ok ? await contribRes.json() : [];
    const issues = issueRes.ok ? await issueRes.json() : [];
    if(Array.isArray(contribs)){
      contribs.forEach(p => {
        remember(p);
        if(p && p.login) contribLogins.add(p.login);
      });
    }
    if(Array.isArray(issues)) issues.forEach(issue => remember(issue && issue.user));
  }catch(e){ /* keep the seeded list */ }
  const others = [...byLogin.values()].filter(p => p.login !== 'aravindbaskaran');
  if(!others.length){
    host.innerHTML = '';
    if(moreHead) moreHead.hidden = true;
    return;
  }
  if(moreHead) moreHead.hidden = false;
  host.innerHTML = others.map(p => {
    const note = PEOPLE_NOTES[p.login] || {};
    const name = note.name || p.login;
    const role = note.role || (contribLogins.has(p.login) ? 'Pushed to this repo' : 'Opened a Write in issue');
    const url = p.html_url || ('https://github.com/' + p.login);
    const avatar = p.avatar_url || ('https://github.com/' + p.login + '.png');
    return `<details class="person-card">
      <summary>
        <img class="person-avatar" src="${esc(avatar)}" alt="${esc(name)}" width="56" height="56">
        <div>
          <h3>${esc(name)}</h3>
          <p class="person-role">${esc(role)}</p>
        </div>
      </summary>
      <div class="person-more-body">
        ${note.blurb ? `<p>${esc(note.blurb)}</p>` : ''}
        <p><a href="${esc(url)}" target="_blank" rel="noopener">@${esc(p.login)} on GitHub</a></p>
      </div>
    </details>`;
  }).join('');
}
function openGuideIssue(title, body){
  window.open(`${GUIDE_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
}
function renderCategorySelect(){
  const sel = document.getElementById('f-category');
  if(!sel) return;
  sel.innerHTML = CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
}
const addFormEl = document.getElementById('addForm');
if(addFormEl) addFormEl.addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('f-name').value.trim();
  const area = document.getElementById('f-area').value.trim();
  const category = document.getElementById('f-category').value;
  const catLabel = (CATEGORIES.find(c => c.id === category) || {}).label || category;
  const blurb = document.getElementById('f-blurb').value.trim();
  if(!name || !area || !blurb) return;
  const title = `Spot: ${name} (${area})`;
  const body = [`**Name:** ${name}`, `**Area:** ${area}`, `**Kind:** ${catLabel}`, '', blurb].join('\n');
  openGuideIssue(title, body);
  this.reset();
});

const issueFormEl = document.getElementById('issueForm');
if(issueFormEl) issueFormEl.addEventListener('submit', function(e){
  e.preventDefault();
  const title = document.getElementById('i-title').value.trim();
  const body = document.getElementById('i-body').value.trim();
  if(!title || !body) return;
  openGuideIssue(title, body);
  this.reset();
});

/* ---------------- init ---------------- */
(async function init(){
  const started = performance.now();
  moveColophonToEnd();
  syncHeaderOffset();
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(syncHeaderOffset).catch(() => {});
  }
  try {
    await loadGuideData();
    const remain = Math.max(0, 700 - (performance.now() - started));
    if(remain) await new Promise(r => setTimeout(r, remain));
    loadState();
    guideMode = readGuideMode();
    applyGuideMode(true);
    renderPills();
    renderCategorySelect();
    renderList();
    renderDaytrips();
    renderTNT();
    renderFestivals();
    renderQuips();
    renderFoodPreview();
    renderPhrases();
    renderGallery();
    renderRacesPreview();
    renderPhotoCredits();
    renderAgendaCount();
    setEra(6);
    loadPeople();
    hideLoader(true);
    openPhotoFromQuery();
    focusPlaceFromQuery();
    syncHeaderOffset();
    const nav = document.getElementById('siteNav');
    if(nav) nav.addEventListener('click', e => {
      if(e.target.closest('a')){ toggleNav(false); closeNavSub(); }
    });
    addEventListener('keydown', e => {
      if(e.key === 'Escape'){ toggleNav(false); closeNavSub(); closeDrawer(); closeLightbox(); closeModeTip(); }
    });
    addEventListener('click', e => {
      if(!e.target.closest('.mode-tip') && !e.target.closest('.mode-tip-btn')) closeModeTip();
      if(!e.target.closest('.nav-sub')) closeNavSub();
    });
    addEventListener('resize', () => {
      syncHeaderOffset();
      if(innerWidth > 720) toggleNav(false);
    }, {passive:true});
  } catch (err) {
    console.error(err);
    hideLoader(false);
  }
})();
