/* Straight interstitial bands (v2): horizontal ribbon, no tilt/rotation,
   unfolds left-to-right when scrolled into view; re-folds when it leaves.
   Requires stage-bands.js loaded first (uses window.SareePaint painters). */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = [];
  let io = null;
  let rippleRaf = 0;
  function init(){
    const SP = window.SareePaint;
    if(!SP) return false;
    document.querySelectorAll('.stage-band-straight').forEach((bandEl, i) => {
      if(bandEl.dataset.init) return;
      bandEl.dataset.init = '1';
      const weave = SP.WEAVES[bandEl.dataset.band] ? bandEl.dataset.band
        : ['ilkal','mysore','kasuti','molakalmuru','udupi','kodagu','khana'][i % 7];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'saree-ribbon band-ribbon');
      svg.setAttribute('viewBox', '0 0 1000 200');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = SP.ribbonScaffold('sband' + state.length);
      bandEl.appendChild(svg);
      SP.setWeave(svg, weave);
      const spec = SP.WEAVES[weave];
      const tag = document.createElement(spec.href ? 'a' : 'p');
      tag.className = 'stage-say';
      tag.innerHTML = `<b>${spec.title}</b><span>${spec.bit}</span>${spec.href ? '<span class="stage-say-ref">About this weave</span>' : ''}`;
      if(spec.href){
        tag.href = spec.href;
        tag.target = '_blank';
        tag.rel = 'noopener noreferrer';
      }
      bandEl.appendChild(tag);
      const s = {bandEl, svg, tag, weave, p:1, raf:0, phase0: i * 0.9};
      state.push(s);
      paint(s, 1, s.phase0, true);
      if(io) io.observe(bandEl);
    });
    if(!io && state.length){
      io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const s = state.find(b => b.bandEl === en.target);
          if(!s) return;
          if(en.isIntersecting){
            s.bandEl.classList.add('is-on');
            if(!reduce) startRipple();
          } else {
            s.bandEl.classList.remove('is-on');
          }
        });
      }, {rootMargin: '-40px 0px', threshold: 0.01});
      state.forEach(s => io.observe(s.bandEl));
      addEventListener('resize', () => state.forEach(s => paint(s, 1, s.phase0, true)), {passive:true});
    }
    return true;
  }
  function paint(s, p, phase, skipBolt){
    s.p = 1;
    window.SareePaint.paintRibbon(s.svg, 1, false, s.weave, phase || 0, {skipBolt: skipBolt !== false});
    pin(s);
  }
  function tickRipple(now){
    rippleRaf = 0;
    let any = false;
    state.forEach(s => {
      if(!s.bandEl.classList.contains('is-on')) return;
      any = true;
      window.SareePaint.paintRibbon(s.svg, 1, false, s.weave, s.phase0 + now / 1800, {skipBolt:true});
    });
    if(any) rippleRaf = requestAnimationFrame(tickRipple);
  }
  function startRipple(){
    if(reduce || rippleRaf) return;
    rippleRaf = requestAnimationFrame(tickRipple);
  }
  function pin(s){
    const r = s.bandEl.getBoundingClientRect();
    if(r.width < 12) return;
    const x = Math.max(12, Math.min(r.width * 0.14, r.width - 196));
    const y = r.height > 140 ? 14 : 6;
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
