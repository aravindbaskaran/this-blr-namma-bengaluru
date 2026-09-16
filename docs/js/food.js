/* Food notebook: preview on the guide, full list on food.html */
const FOOD_PREVIEW = 4;
const FOOD_PICK_MARK = `<svg class="pick-mark" viewBox="0 0 40 26" role="img" aria-label="Personal pick"><title>Personal pick</title><ellipse cx="10.4" cy="7.2" rx="4.4" ry="4"/><ellipse cx="29.6" cy="7.2" rx="4.4" ry="4"/><path d="M6.6 6.2 L2.4 4.6 L7 9.2Z"/><path d="M33.4 6.2 L37.6 4.6 L33 9.2Z"/><path d="M20 10 C13 12 8.2 16.5 7 23 C13.5 20.2 17 22 20 26 C23 22 26.5 20.2 33 23 C31.8 16.5 27 12 20 10Z"/></svg>`;

function foodEsc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function foodKnCycle(kn, en, extraClass){
  if(!kn) return '';
  const cls = extraClass ? `kn kn-cycle ${extraClass}` : 'kn kn-cycle';
  if(!en) return `<span class="${cls}">${foodEsc(kn)}</span>`;
  return `<span class="${cls}" tabindex="0"><span class="kn-native">${foodEsc(kn)}</span><span class="kn-en">${foodEsc(en)}</span></span>`;
}

function foodVoiceOk(){
  if(typeof window === 'undefined') return false;
  return 'speechSynthesis' in window || 'AudioContext' in window || 'webkitAudioContext' in window;
}

function foodSpeakBtn(kn){
  if(!kn || !foodVoiceOk()) return '';
  const safe = String(kn).replace(/'/g, "\\'");
  return `<button class="speak-btn speak-btn-sm" onclick="speakText('${safe}')" aria-label="Hear pronunciation">\uD83D\uDD0A</button>`;
}

function foodPhotoFail(img){
  const wrap = img && img.closest('.photo-wait');
  if(wrap) wrap.outerHTML = '<div class="dish-photo dish-photo-empty" aria-hidden="true">No photo yet</div>';
}
window.foodPhotoFail = foodPhotoFail;

function foodPhotoHtml(d){
  if(!d.photo) return '<div class="dish-photo dish-photo-empty" aria-hidden="true">No photo yet</div>';
  const src = foodEsc(d.photo);
  const name = foodEsc(d.name);
  const open = `openLightbox('${src}', '${name}')`;
  return `<div class="photo-wait"><span class="photo-wait-deco" aria-hidden="true"></span><span class="photo-wait-copy kn kn-cycle" tabindex="0"><span class="kn-native">ಸ್ವಲ್ಪ ನಿಲ್ಲಿ</span><span class="kn-en">hold on</span></span><img class="dish-photo" src="${src}" alt="${name}" loading="lazy" tabindex="0" role="button" aria-label="View larger photo of ${name}" onclick="${open}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${open}}" onload="photoWaitReady(this)" onerror="foodPhotoFail(this)"></div>`;
}

/* ctx.place(id) resolves a place to {id, name, inCity}. ctx.linkPlaces sends those
   places back to the guide by URL; the guide itself scrolls to the card instead. */
function foodCardHtml(d, ctx){
  ctx = ctx || {};
  const tagList = ctx.tags || [];
  const tagsHtml = (d.tags || []).map(id => {
    const t = tagList.find(x => x.id === id);
    return t ? `<span class="tag">${foodEsc(t.label)}</span>` : '';
  }).join('');
  const pickMark = d.personalPick ? (window.PICK_MARK || FOOD_PICK_MARK) : '';
  const places = (d.tryIn || []).map(id => (ctx.place ? ctx.place(id) : null)).filter(Boolean);
  const tryLabel = places.length && places.every(p => p.inCity) ? 'Where to try in Bengaluru' : 'Where to try';
  const tryItems = places.map(p => {
    if(!ctx.linkPlaces) return `<button type="button" onclick="focusPlace('${p.id}')">${foodEsc(p.name)}</button>`;
    if(p.inCity) return `<a href="./?place=${encodeURIComponent(p.id)}#explore">${foodEsc(p.name)}</a>`;
    return `<span class="dish-try-static">${foodEsc(p.name)}</span>`;
  }).join('');
  const tryHtml = places.length
    ? `<div class="dish-try"><div class="dish-try-label">${tryLabel}</div><div class="dish-try-list">${tryItems}</div></div>`
    : '';
  return `<div class="dish-card" id="dish-${foodEsc(d.id)}">
      ${foodPhotoHtml(d)}
      <div class="dish-name-row">${pickMark}<div class="dish-name">${foodEsc(d.name)}</div></div>
      <div class="dish-kn-row">${foodKnCycle(d.kn, d.name, 'dish-kn')}<span class="dish-say">${foodEsc(d.say || '')}</span>${foodSpeakBtn(d.kn)}</div>
      <p class="dish-desc">${foodEsc(d.desc || '')}</p>
      ${tryHtml}
      <div class="card-actions" style="margin-top:10px;flex-wrap:wrap">${tagsHtml}</div>
    </div>`;
}

function foodFill(host, items, ctx){
  if(!host) return;
  if(!items.length){
    host.innerHTML = '<p style="color:var(--ink-soft);">No dishes in this tag yet.</p>';
    return;
  }
  host.innerHTML = items.map(d => foodCardHtml(d, ctx)).join('');
  if(typeof armPhotoWaits === 'function') armPhotoWaits(host);
  else {
    host.querySelectorAll('.photo-wait img').forEach(img => {
      if(img.complete && img.naturalWidth && typeof photoWaitReady === 'function') photoWaitReady(img);
    });
  }
}

window.GuideFood = {
  PREVIEW: FOOD_PREVIEW,
  card: foodCardHtml,
  fill: foodFill
};

if(!window.speakText){
  window.speakText = function(text){
    if(!text) return;
    if(window.NammaVoice && window.NammaVoice.speak(text)) return;
    if(!('speechSynthesis' in window)) return;
    try{
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'kn-IN';
      utter.rate = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const knVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('kn'));
      if(knVoice) utter.voice = knVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }catch(e){}
  };
}

(async function initFoodPage(){
  if(document.body.dataset.page !== 'food') return;
  const host = document.getElementById('dishGrid');
  const pills = document.getElementById('dishPills');
  const empty = document.getElementById('dishEmpty');
  const nav = document.getElementById('siteNav');
  if(nav) nav.addEventListener('click', e => { if(e.target.closest('a')){ toggleNav(false); closeNavSub(); } });
  addEventListener('keydown', e => {
    if(e.key === 'Escape'){ toggleNav(false); closeNavSub(); closeLightbox(); }
  });
  addEventListener('click', e => {
    if(!e.target.closest('.nav-sub')) closeNavSub();
  });
  addEventListener('resize', () => {
    if(innerWidth > 720) toggleNav(false);
  }, {passive:true});

  let dishes = [];
  let tags = [];
  let cityIds = new Set();
  let placeNames = new Map();
  let filter = 'all';

  const ctx = {
    linkPlaces: true,
    get tags(){ return tags; },
    place(id){
      const name = placeNames.get(id);
      if(!name) return null;
      return { id, name, inCity: cityIds.has(id) };
    }
  };

  function matches(d){
    if(filter === 'all') return true;
    if(filter === 'picks') return !!d.personalPick;
    return (d.tags || []).includes(filter);
  }

  function highlightFromHash(){
    const id = (location.hash || '').replace(/^#/, '');
    if(!id.startsWith('dish-')) return;
    const el = document.getElementById(id);
    if(!el) return;
    el.scrollIntoView({behavior:'smooth', block:'center'});
    el.style.outline = '2px solid var(--leaf)';
    window.setTimeout(() => { el.style.outline = ''; }, 1600);
  }

  function paintPills(){
    if(!pills) return;
    const all = [{id:'all', label:'All'}].concat(tags);
    pills.innerHTML = all.map(t =>
      `<button type="button" class="pill" data-filter="${foodEsc(t.id)}" data-active="${filter === t.id}">${foodEsc(t.label)}</button>`
    ).join('');
  }

  function paint(){
    foodFill(host, dishes.filter(matches), ctx);
    paintPills();
  }

  try {
    const [food, city, karnataka] = await Promise.all([
      fetch('data/dishes.json').then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('data/locations.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('data/karnataka-places.json').then(r => r.ok ? r.json() : []).catch(() => [])
    ]);
    dishes = food.dishes || [];
    tags = food.tags || [];
    (Array.isArray(city) ? city : []).forEach(l => {
      if(!l || !l.id) return;
      cityIds.add(l.id);
      placeNames.set(l.id, l.name);
    });
    (Array.isArray(karnataka) ? karnataka : []).forEach(l => {
      if(!l || !l.id || placeNames.has(l.id)) return;
      placeNames.set(l.id, l.name);
    });
    if(!dishes.length){
      if(empty) empty.hidden = false;
      return;
    }
    if(empty) empty.hidden = true;
    if(pills){
      pills.addEventListener('click', e => {
        const btn = e.target.closest('[data-filter]');
        if(!btn) return;
        filter = btn.dataset.filter;
        paint();
      });
    }
    paint();
    highlightFromHash();
    addEventListener('hashchange', highlightFromHash);
  } catch (err) {
    console.error(err);
    if(empty){
      empty.hidden = false;
      empty.textContent = 'Could not load the dish list. Refresh, or check that data/dishes.json is being served.';
    }
  }
})();
