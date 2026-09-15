/* Race list: preview on the guide, full list on marathons.html */
const RACE_KIND_LABEL = {
  '10k': '10K',
  half: 'Half',
  full: 'Full',
  ultra: 'Ultra'
};

function raceEsc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function raceKindsOf(r){
  return Array.isArray(r && r.kinds) ? r.kinds : [];
}

function raceMatches(r, filter){
  if(!filter || filter === 'all') return true;
  if(filter === 'trail' || filter === 'road') return r.terrain === filter;
  if(filter === 'bengaluru') return r.where === 'bengaluru';
  if(filter === 'outside') return r.where === 'outside';
  return raceKindsOf(r).includes(filter);
}

function raceCardHtml(r){
  const kinds = raceKindsOf(r)
    .map(k => `<span class="race-kind">${raceEsc(RACE_KIND_LABEL[k] || k)}</span>`)
    .join('');
  const where = [r.area, r.when].filter(Boolean).join(' · ');
  const link = r.url
    ? `<p class="race-link"><a href="${raceEsc(r.url)}" target="_blank" rel="noopener">Race site</a></p>`
    : '';
  const dist = r.distances ? `<p class="race-dist">${raceEsc(r.distances)}</p>` : '';
  return `<article class="race-card">
    <p class="race-kinds">${kinds}${r.terrain === 'trail' ? '<span class="race-kind is-trail">Trail</span>' : ''}</p>
    <h3>${raceEsc(r.name)}</h3>
    ${where ? `<p class="race-where">${raceEsc(where)}</p>` : ''}
    ${dist}
    <p class="race-blurb">${raceEsc(r.blurb || '')}</p>
    ${link}
  </article>`;
}

function raceFill(host, items){
  if(!host) return;
  if(!items.length){
    host.innerHTML = '<p class="race-empty">No races in this filter.</p>';
    return;
  }
  host.innerHTML = items.map(raceCardHtml).join('');
}

window.GuideRaces = {
  kinds: RACE_KIND_LABEL,
  matches: raceMatches,
  card: raceCardHtml,
  fill: raceFill
};

(async function initRacesPage(){
  if(document.body.dataset.page !== 'races') return;
  const host = document.getElementById('raceGrid');
  const pills = document.getElementById('racePills');
  const empty = document.getElementById('raceEmpty');
  const nav = document.getElementById('siteNav');
  if(nav) nav.addEventListener('click', e => { if(e.target.closest('a')) toggleNav(false); });
  addEventListener('keydown', e => {
    if(e.key === 'Escape'){ toggleNav(false); if(typeof closeNavSub === 'function') closeNavSub(); }
  });
  addEventListener('click', e => {
    if(!e.target.closest('.nav-sub') && typeof closeNavSub === 'function') closeNavSub();
  });
  addEventListener('resize', () => {
    if(innerWidth > 720) toggleNav(false);
  }, {passive:true});
  let races = [];
  let filter = 'all';
  function paint(){
    const items = races.filter(r => raceMatches(r, filter));
    raceFill(host, items);
    if(pills){
      pills.querySelectorAll('[data-filter]').forEach(btn => {
        btn.dataset.active = btn.dataset.filter === filter ? 'true' : 'false';
      });
    }
  }
  try {
    const res = await fetch('data/races.json');
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    races = data.races || [];
    const intro = document.getElementById('raceIntro');
    if(intro && data.intro) intro.textContent = data.intro;
    if(empty) empty.hidden = !!races.length;
    if(pills){
      pills.addEventListener('click', e => {
        const btn = e.target.closest('[data-filter]');
        if(!btn) return;
        filter = btn.dataset.filter;
        paint();
      });
    }
    paint();
  } catch (err) {
    console.error(err);
    if(empty){
      empty.hidden = false;
      empty.textContent = 'Could not load the race list. Refresh, or check that data/races.json is being served.';
    }
  }
})();
