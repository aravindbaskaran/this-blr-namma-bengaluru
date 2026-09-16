/* Contributor mosaic: preview on the guide, full roll on photos.html */
const GALLERY_PREVIEW = 4;

function galleryEsc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function galleryFileSrc(g){
  if(!g) return '';
  const raw = g.src || g.file;
  if(!raw) return '';
  if(/^https?:/i.test(raw)) return raw;
  return 'gallery/' + String(raw).replace(/^\/?gallery\//, '');
}

function galleryFileCaption(g){
  return (g && (g.caption || g.description || g.alt)) || '';
}

function galleryInBlrBox(lat, lng){
  return lat >= 12.72 && lat <= 13.20 && lng >= 77.35 && lng <= 77.85;
}

function galleryWaitPhoto(src, alt, extraClass, attrs){
  const cls = extraClass || '';
  return `<div class="photo-wait"><span class="photo-wait-deco" aria-hidden="true"></span><span class="photo-wait-copy kn kn-cycle" tabindex="0"><span class="kn-native">ಸ್ವಲ್ಪ ನಿಲ್ಲಿ</span><span class="kn-en">hold on</span></span><img class="${cls}" src="${galleryEsc(src)}" alt="${galleryEsc(alt)}" loading="lazy" ${attrs || ''} onload="photoWaitReady(this)" onerror="photoWaitFail(this, '')"></div>`;
}

function galleryShotHtml(g, mapKind){
  const src = galleryFileSrc(g);
  const cap = galleryFileCaption(g);
  const alt = g.alt || cap || 'Contributor photo';
  const wide = !!g.wide;
  let pin = '';
  const hasPin = typeof g.lat === 'number' && typeof g.lng === 'number' && galleryInBlrBox(g.lat, g.lng);
  if(hasPin){
    if(mapKind === 'home'){
      const href = './?photo=' + encodeURIComponent(g.id || '') + '#explore';
      pin = `<a class="gallery-map" href="${href}">Map</a>`;
    } else {
      pin = `<button type="button" class="gallery-map" onclick="viewGalleryPin(${g.lat},${g.lng},${JSON.stringify(g.id || '')})">Map</button>`;
    }
  }
  const by = g.by ? `<span class="gallery-by">${galleryEsc(g.by)}</span>` : '';
  return `<figure class="gallery-shot${wide ? ' is-wide' : ''}">
      ${galleryWaitPhoto(src, alt, 'gallery-img', `tabindex="0" role="button" aria-label="${galleryEsc(alt)}" onclick="openLightbox('${galleryEsc(src)}', '${galleryEsc(alt)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox('${galleryEsc(src)}', '${galleryEsc(alt)}')}"`)}
      <figcaption>
        <p>${galleryEsc(cap)}</p>
        ${(by || pin) ? `<p class="gallery-shot-meta">${by}${by && pin ? ' ' : ''}${pin}</p>` : ''}
      </figcaption>
    </figure>`;
}

function galleryFillGrid(host, items, mapKind){
  if(!host) return;
  host.innerHTML = items.map(g => galleryShotHtml(g, mapKind)).join('');
  if(typeof armPhotoWaits === 'function') armPhotoWaits(host);
  else {
    host.querySelectorAll('.photo-wait img').forEach(img => {
      if(img.complete && img.naturalWidth && typeof photoWaitReady === 'function') photoWaitReady(img);
    });
  }
}

function galleryUsable(list){
  return (list || []).filter(g => galleryFileSrc(g));
}

window.GuidePhotos = {
  PREVIEW: GALLERY_PREVIEW,
  src: galleryFileSrc,
  caption: galleryFileCaption,
  shotHtml: galleryShotHtml,
  fillGrid: galleryFillGrid,
  usable: galleryUsable
};

if(!window.photoWaitReady){
  window.photoWaitReady = function(img){
    const wrap = img && img.closest('.photo-wait');
    if(wrap) wrap.classList.add('is-ready');
  };
}
if(!window.photoWaitFail){
  window.photoWaitFail = function(img){
    const wrap = img && img.closest('.photo-wait');
    if(wrap) wrap.remove();
  };
}
if(!window.armPhotoWaits){
  window.armPhotoWaits = function(root){
    (root || document).querySelectorAll('.photo-wait img').forEach(img => {
      if(img.complete && img.naturalWidth) photoWaitReady(img);
      else if(img.complete) photoWaitFail(img);
    });
  };
}
if(!window.openLightbox){
  window.openLightbox = function(src, alt){
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if(!box || !img) return;
    img.src = src;
    img.alt = alt || '';
    box.dataset.open = 'true';
  };
}
if(!window.closeLightbox){
  window.closeLightbox = function(){
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if(box) box.dataset.open = 'false';
    if(img){ img.src = ''; img.alt = ''; }
  };
}
if(!window.toggleNav){
  window.toggleNav = function(force){
    const nav = document.getElementById('siteNav');
    const btn = document.getElementById('navToggle');
    if(!nav || !btn) return;
    const open = force == null ? !nav.classList.contains('is-open') : !!force;
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if(!open) closeNavSub();
  };
}
function closeNavSub(){
  const btn = document.getElementById('navSubBtn');
  const list = document.getElementById('navSubList');
  if(list) list.hidden = true;
  if(btn) btn.setAttribute('aria-expanded', 'false');
}
window.closeNavSub = closeNavSub;
window.toggleNavSub = function(e){
  if(e) e.stopPropagation();
  const btn = document.getElementById('navSubBtn');
  const list = document.getElementById('navSubList');
  if(!btn || !list) return;
  const willOpen = list.hidden;
  closeNavSub();
  if(!willOpen) return;
  list.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
};

(async function initPhotosPage(){
  if(document.body.dataset.page !== 'photos') return;
  const host = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');
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
  try {
    const res = await fetch('data/gallery.json', { cache: 'no-cache' });
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const items = galleryUsable(Array.isArray(data) ? data : (data.photos || []));
    if(!items.length){
      if(host) host.innerHTML = '';
      if(empty) empty.hidden = false;
      return;
    }
    if(empty) empty.hidden = true;
    galleryFillGrid(host, items, 'home');
  } catch (err) {
    console.error(err);
    if(empty){
      empty.hidden = false;
      empty.textContent = 'Could not load the photo list. Refresh, or check that data/gallery.json is being served.';
    }
  }
})();
