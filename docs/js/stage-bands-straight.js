/* Straight interstitial bands (v2): horizontal ribbon, no tilt/rotation,
   unfolds left-to-right when scrolled into view; re-folds when it leaves.
   Requires stage-bands.js loaded first (uses window.SareePaint painters). */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = [];
  let io = null;
  function init(){
    const SP = window.SareePaint;
    if(!SP) return false;
    document.querySelectorAll('.stage-band-straight').forEach((bandEl, i) => {
      if(bandEl.dataset.init) return;
      bandEl.dataset.init = '1';
      const weave = SP.WEAVES[bandEl.dataset.band] ? bandEl.dataset.band
        : ['ilkal','mysore','kasuti','molakalmuru','khana'][i % 5];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'saree-ribbon band-ribbon');
      svg.setAttribute('viewBox', '0 0 1000 200');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = SP.ribbonScaffold('sband' + state.length);
      bandEl.appendChild(svg);
      SP.setWeave(svg, weave);
      const spec = SP.WEAVES[weave];
      const tag = document.createElement('p');
      tag.className = 'stage-say';
      tag.innerHTML = `<b>${spec.title}</b><span>${spec.bit}</span>`;
      bandEl.appendChild(tag);
      const s = {bandEl, svg, tag, weave, p:0, raf:0};
      state.push(s);
      paint(s, reduce ? 1 : 0);
      if(io) io.observe(bandEl);
    });
    if(!io && state.length){
      io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const s = state.find(b => b.bandEl === en.target);
          if(!s) return;
          if(en.isIntersecting){
            s.bandEl.classList.add('is-on');
            if(reduce) paint(s, 1); else unfold(s);
          } else {
            s.bandEl.classList.remove('is-on');
            if(!reduce){
              cancelAnimationFrame(s.raf);
              setTimeout(() => { if(!s.bandEl.classList.contains('is-on')) paint(s, 0); }, 500);
            }
          }
        });
      }, {rootMargin: '-40px 0px', threshold: 0.01});
      state.forEach(s => io.observe(s.bandEl));
      addEventListener('resize', () => state.forEach(s => paint(s, s.p)), {passive:true});
    }
    return true;
  }
  function paint(s, p){
    s.p = p;
    window.SareePaint.paintRibbon(s.svg, p, false, s.weave);
    pin(s);
  }
  function unfold(s){
    cancelAnimationFrame(s.raf);
    const from = s.p;
    if(from >= 1) return;
    const t0 = performance.now();
    const dur = Math.max(200, 1500 * (1 - from));
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      paint(s, from + (1 - from) * e);
      if(t < 1) s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }
  function pin(s){
    const bolt = s.svg.querySelector('.bolt-body');
    const r = s.bandEl.getBoundingClientRect();
    if(r.width < 12) return;
    let x = r.width * 0.72, y = 10;
    const ctm = bolt && bolt.getScreenCTM && bolt.getScreenCTM();
    if(ctm){
      const cx = +bolt.getAttribute('cx');
      const cy = +bolt.getAttribute('cy');
      x = ctm.a * cx + ctm.c * cy + ctm.e - r.left - 168;
      y = ctm.b * cx + ctm.d * cy + ctm.f - r.top - 62;
    }
    x = Math.max(10, Math.min(r.width - 186, x));
    y = Math.max(2, Math.min(r.height - 62, y));
    s.tag.style.transform = `translate(${x}px, ${y}px)`;
  }
  function initSecplx(){
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('[data-secplx]');
    if(!els.length) return;
    const tick = () => {
      els.forEach(el => {
        const host = (el.parentElement || el).getBoundingClientRect();
        const factor = parseFloat(el.dataset.secplx) || 0;
        const off = reduce ? 0 : Math.max(-48, Math.min(48, (host.top - innerHeight * 0.35) * -factor));
        const base = el.dataset.secplxBase || '';
        el.style.transform = base ? `${base} translateY(${off.toFixed(1)}px)` : `translateY(${off.toFixed(1)}px)`;
      });
    };
    addEventListener('scroll', tick, {passive:true});
    addEventListener('resize', tick, {passive:true});
    tick();
  }
  window.initStraightBands = init;
  function boot(){
    init();
    initSecplx();
  }
  if(document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
