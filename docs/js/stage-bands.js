/* Decorative stage - interstitial ribbon bands.
   Drop-in replacement for docs/js/stage.js. Gutter props were removed so
   decorations stay in the hero and scroll with it. */
(function startStage(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- shared weave painters (unchanged) ---------------- */
  const RIBBON_PAD = 22;
  const RIBBON_THICK = 156;
  function ribbonWave(t, sag, phase){
    const travel = (t * 1.65 - (phase || 0)) * Math.PI * 2;
    return sag * (Math.sin(travel) * 0.88 + Math.sin(travel * 2 + 0.4) * 0.12);
  }
  function sampleEdge(len, y, sag, vertical, phase, n){
    const pts = [];
    for(let i = 0; i <= n; i++){
      const t = i / n;
      const s = t * len;
      const w = ribbonWave(t, sag, phase);
      pts.push(vertical ? [y + w, s] : [s, y + w]);
    }
    return pts;
  }
  function pathThrough(pts, close){
    if(pts.length < 2) return '';
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for(let i = 0; i < pts.length - 1; i++){
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return close ? d + ' Z' : d;
  }
  function clothBand(len, thick, sag, vertical, phase){
    const y0 = RIBBON_PAD;
    const top = sampleEdge(len, y0, sag, vertical, phase, 28);
    const bot = sampleEdge(len, y0 + thick, sag, vertical, phase, 28);
    return pathThrough(top.concat(bot.slice().reverse()), true);
  }
  function clothEdge(len, y, sag, vertical, phase){
    return pathThrough(sampleEdge(len, y, sag, vertical, phase, 28), false);
  }
  const WEAVES = {
    ilkal: { tone:'tone-ilkal', title:'Ilkal', bit:'Tope Teni pallu · Bagalkot', inset:22, kind:'teni', href:'https://en.wikipedia.org/wiki/Ilkal_sari' },
    mysore: { tone:'tone-mysore', title:'Mysore silk', bit:'Wodeyar zari · Mysuru', inset:16, kind:'zari', href:'https://en.wikipedia.org/wiki/Mysore_silk' },
    kasuti: { tone:'tone-kasuti', title:'Kasuti', bit:'Blackwork · Hubballi-Dharwad', inset:10, kind:'kasuti', href:'https://en.wikipedia.org/wiki/Kasuti' },
    molakalmuru: { tone:'tone-molakalmuru', title:'Molakalmuru', bit:'Silk checks · Chitradurga', inset:12, kind:'check-fine', href:'https://en.wikipedia.org/wiki/Molakalmuru_sari' },
    khana: { tone:'tone-khana', title:'Ilkal khana', bit:'Blouse-piece checks', inset:14, kind:'check-bold', href:'https://en.wikipedia.org/wiki/Ilkal_sari' },
    udupi: { tone:'tone-coastal', title:'Udupi', bit:'Temple cotton · the coast', inset:14, kind:'zari', href:'https://en.wikipedia.org/wiki/Udupi#Culture' },
    kodagu: { tone:'tone-kodagu', title:'Kodagu', bit:'Coorg drape · Western Ghats', inset:12, kind:'check-fine', checkA:'#1A4A32', checkB:'#D6A419', href:'https://en.wikipedia.org/wiki/Kodava_people' }
  };
  const TONES = Object.values(WEAVES).map(w => w.tone).concat([
    'tone-jacaranda','tone-coastal','tone-hampi','tone-blr-silk','tone-kodagu',
    'tone-ilkal-green','tone-narayanpet','tone-crepe','tone-navy-zari','tone-peacock','tone-magenta'
  ]);
  function setWeave(el, weave){
    if(!el) return;
    const spec = WEAVES[weave];
    TONES.forEach(c => el.classList.toggle(c, spec && c === spec.tone));
    el.classList.toggle('weave-ilkal', weave === 'ilkal');
    el.classList.toggle('weave-mysore', weave === 'mysore');
    el.classList.toggle('weave-kasuti', weave === 'kasuti');
    el.classList.toggle('weave-molakalmuru', weave === 'molakalmuru');
    el.classList.toggle('weave-khana', weave === 'khana');
    el.classList.toggle('weave-udupi', weave === 'udupi');
    el.classList.toggle('weave-kodagu', weave === 'kodagu');
  }
  function bowAt(s, sag, len, phase){
    if(!len) return 0;
    return ribbonWave(Math.max(0, Math.min(1, s / len)), sag, phase || 0);
  }
  function ribbonScaffold(uid){
    return `<defs><clipPath id="clip-${uid}"><path class="cloth-clip"/></clipPath><pattern id="pat-${uid}" patternUnits="userSpaceOnUse" width="28" height="28"></pattern></defs><path class="cloth"/><rect class="weave-tile" clip-path="url(#clip-${uid})" fill="url(#pat-${uid})"/><g class="motifs" clip-path="url(#clip-${uid})"></g><path class="kara kara-a"/><path class="zari zari-a"/><path class="zari zari-b"/><path class="kara kara-b"/><g class="bolt"><ellipse class="bolt-body"/><ellipse class="bolt-ring r1"/><ellipse class="bolt-ring r2"/><ellipse class="bolt-ring r3"/><ellipse class="bolt-end"/></g>`;
  }
  function paintRibbon(el, k, vertical, weave, phase, opts){
    if(!el) return;
    opts = opts || {};
    const len = vertical ? (220 + k * 720) : 1240;
    const thick = RIBBON_THICK;
    const sag = 14;
    const y0 = RIBBON_PAD;
    const spec = WEAVES[weave];
    phase = phase || 0;
    const band = clothBand(len, thick, sag, vertical, phase);
    const cloth = el.querySelector('.cloth');
    const clip = el.querySelector('.cloth-clip');
    const karaA = el.querySelector('.kara-a');
    const karaB = el.querySelector('.kara-b');
    const zariA = el.querySelector('.zari-a');
    const zariB = el.querySelector('.zari-b');
    if(cloth) cloth.setAttribute('d', band);
    if(clip) clip.setAttribute('d', band);
    if(karaA) karaA.setAttribute('d', clothEdge(len, y0, sag, vertical, phase));
    if(karaB) karaB.setAttribute('d', clothEdge(len, y0 + thick, sag, vertical, phase));
    const inset = spec ? spec.inset : 14;
    if(zariA) zariA.setAttribute('d', clothEdge(len, y0 + inset, sag * 0.92, vertical, phase));
    if(zariB) zariB.setAttribute('d', clothEdge(len, y0 + thick - inset, sag * 0.92, vertical, phase));
    const tile = el.querySelector('.weave-tile');
    if(tile){
      if(vertical){ tile.setAttribute('x', y0 - 8); tile.setAttribute('y', 0); tile.setAttribute('width', thick + 16); tile.setAttribute('height', len); }
      else { tile.setAttribute('x', 0); tile.setAttribute('y', y0 - 8); tile.setAttribute('width', len); tile.setAttribute('height', thick + 16); }
    }
    const sig = `${weave}|${Math.round(len / 36)}|${vertical ? 'v' : 'h'}`;
    if(el.dataset.weaveSig !== sig){
      el.dataset.weaveSig = sig;
      paintWeave(el, weave, len, thick, y0, sag, vertical, phase, true);
    } else {
      paintWeave(el, weave, len, thick, y0, sag, vertical, phase, false);
    }
    if(opts.skipBolt) return;
    const rect = el.getBoundingClientRect();
    const vbW = vertical ? 200 : 1000;
    const vbH = vertical ? 1000 : 200;
    const sx = (rect.width / vbW) || 1;
    const sy = (rect.height / vbH) || 1;
    const cx = vertical ? y0 + thick / 2 + sag * 0.25 : len;
    const cy = vertical ? len : y0 + thick / 2 + ribbonWave(1, sag, phase) * 0.35;
    const along = vertical
      ? ((thick / 2) * sx) / sy
      : ((thick / 2) * sy) / sx;
    const across = thick / 2 + 4;
    const rx = vertical ? across : along;
    const ry = vertical ? along : across;
    const setE = (sel, rcx, rcy) => {
      const n = el.querySelector(sel);
      if(!n) return;
      n.setAttribute('cx', cx); n.setAttribute('cy', cy);
      n.setAttribute('rx', rcx); n.setAttribute('ry', rcy);
    };
    setE('.bolt-body', rx, ry);
    setE('.bolt-ring.r1', rx * 0.72, ry * 0.72);
    setE('.bolt-ring.r2', rx * 0.48, ry * 0.48);
    setE('.bolt-ring.r3', rx * 0.28, ry * 0.28);
    setE('.bolt-end', rx * 0.12, ry * 0.12);
  }
  function paintWeave(el, weave, len, thick, y0, sag, vertical, phase, rebuildPattern){
    const spec = WEAVES[weave];
    const pat = el.querySelector('pattern');
    const motifs = el.querySelector('.motifs');
    const tile = el.querySelector('.weave-tile');
    if(!spec || !motifs) return;
    if(tile) tile.style.display = (spec.kind === 'check-fine' || spec.kind === 'check-bold') ? '' : 'none';
    if(spec.kind === 'check-fine' || spec.kind === 'check-bold'){
      const cell = spec.kind === 'check-fine' ? 12 : 22;
      const a = spec.checkA || (spec.kind === 'check-fine' ? '#C41E3A' : '#9C2436');
      const b = spec.checkB || (spec.kind === 'check-fine' ? '#1F6B3A' : '#D6A419');
      if(pat && (rebuildPattern || !pat.childElementCount)){
        pat.setAttribute('width', cell * 2);
        pat.setAttribute('height', cell * 2);
        pat.innerHTML = `<rect width="${cell}" height="${cell}" fill="${a}"/><rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="${a}"/><rect x="${cell}" width="${cell}" height="${cell}" fill="${b}"/><rect y="${cell}" width="${cell}" height="${cell}" fill="${b}"/>`;
      }
      if(pat) pat.setAttribute('patternTransform', `translate(${(-(phase || 0) * 22).toFixed(1)} 0)`);
      motifs.innerHTML = '';
      return;
    }
    if(spec.kind === 'teni'){ motifs.innerHTML = ilkalTeni(len, thick, y0, sag, vertical, phase); return; }
    if(spec.kind === 'zari'){ motifs.innerHTML = mysoreZari(len, thick, y0, sag, vertical, phase); return; }
    if(spec.kind === 'kasuti'){ motifs.innerHTML = kasutiStitch(len, thick, y0, sag, vertical, phase); }
  }
  function ilkalTeni(len, thick, y0, sag, vertical, phase){
    const start = len * 0.55;
    const step = 26;
    let html = '';
    const h = thick * 0.4;
    for(let s = 8; s < start; s += 18){
      const bow = bowAt(s, sag, len, phase);
      const hh = thick * 0.16;
      if(vertical){
        html += `<polygon class="teni" points="${y0 + 6 + bow},${s} ${y0 + 6 + hh + bow},${s + 9} ${y0 + 6 + bow},${s + 18}"/>`;
      } else {
        html += `<polygon class="teni" points="${s},${y0 + 6 + bow} ${s + 9},${y0 + 6 + hh + bow} ${s + 18},${y0 + 6 + bow}"/>`;
      }
    }
    for(let s = start; s < len - 10; s += step){
      const bow = bowAt(s + step / 2, sag, len, phase);
      if(vertical){
        const x = y0 + 10 + bow;
        html += `<polygon class="teni" points="${x},${s} ${x + h},${s + step / 2} ${x},${s + step}"/>`;
        html += `<polygon class="teni-gold" points="${y0 + thick - 10 + bow},${s} ${y0 + thick - 10 + bow - h * 0.58},${s + step / 2} ${y0 + thick - 10 + bow},${s + step}"/>`;
      } else {
        const y = y0 + 10 + bow;
        html += `<polygon class="teni" points="${s},${y} ${s + step / 2},${y + h} ${s + step},${y}"/>`;
        html += `<polygon class="teni-gold" points="${s},${y0 + thick - 10 + bow} ${s + step / 2},${y0 + thick - 10 + bow - h * 0.58} ${s + step},${y0 + thick - 10 + bow}"/>`;
      }
    }
    return html;
  }
  function mysoreZari(len, thick, y0, sag, vertical, phase){
    let html = '';
    [0.18, 0.26, 0.74, 0.82].forEach(p => {
      html += `<path class="zari-band" d="${clothEdge(len, y0 + thick * p, sag * 0.9, vertical, phase)}"/>`;
    });
    const gap = 54;
    for(let s = 36; s < len - 30; s += gap){
      const bow = bowAt(s, sag, len, phase);
      const mid = y0 + thick / 2 + bow;
      if(vertical){
        html += `<polygon class="butta" points="${mid},${s - 7} ${mid + 5},${s} ${mid},${s + 7} ${mid - 5},${s}"/>`;
        html += `<polygon class="butta-sm" points="${mid - thick * 0.22},${s + 18} ${mid - thick * 0.22 + 3},${s + 22} ${mid - thick * 0.22},${s + 26} ${mid - thick * 0.22 - 3},${s + 22}"/>`;
      } else {
        html += `<polygon class="butta" points="${s},${mid - 7} ${s + 7},${mid} ${s},${mid + 7} ${s - 7},${mid}"/>`;
        html += `<polygon class="butta-sm" points="${s + 22},${mid - thick * 0.22} ${s + 26},${mid - thick * 0.22 + 3} ${s + 22},${mid - thick * 0.22 + 6} ${s + 18},${mid - thick * 0.22 + 3}"/>`;
      }
    }
    return html;
  }
  function kasutiStitch(len, thick, y0, sag, vertical, phase){
    let html = '';
    const step = 36;
    let n = 0;
    for(let s = 28; s < len - 20; s += step){
      const bow = bowAt(s, sag, len, phase);
      const cols = [0.28, 0.5, 0.72];
      cols.forEach((p, i) => {
        const x = vertical ? y0 + thick * p + bow : s;
        const y = vertical ? s : y0 + thick * p + bow;
        const kind = (n + i) % 3;
        if(kind === 0){
          html += `<path class="kasuti-stitch" d="M${x - 7} ${y} H${x + 7} M${x} ${y - 7} V${y + 7}"/>`;
        } else if(kind === 1){
          html += `<rect class="kasuti-mark" x="${x - 4}" y="${y - 4}" width="8" height="8" transform="rotate(45 ${x} ${y})"/>`;
        } else {
          html += `<path class="kasuti-stitch" d="M${x} ${y - 8} L${x + 3} ${y - 3} L${x + 8} ${y} L${x + 3} ${y + 3} L${x} ${y + 8} L${x - 3} ${y + 3} L${x - 8} ${y} L${x - 3} ${y - 3} Z"/>`;
        }
      });
      n++;
    }
    return html;
  }

  /* expose painters for other modules (unfold demo, future variants) */
  window.SareePaint = { WEAVES, setWeave, paintRibbon, ribbonScaffold, RIBBON_PAD, RIBBON_THICK };

  /* ---------------- part 1: interstitial ribbon bands ---------------- */
  const bandState = [];
  function initStageBands(){
    const bands = document.querySelectorAll('.stage-band');
    bands.forEach((bandEl, i) => {
      if(bandEl.dataset.init) return;
      bandEl.dataset.init = '1';
      const weave = WEAVES[bandEl.dataset.band] ? bandEl.dataset.band
        : ['ilkal','mysore','molakalmuru','kasuti','khana'][i % 5];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'saree-ribbon band-ribbon');
      svg.setAttribute('viewBox', '0 0 1000 200');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = ribbonScaffold(`band${bandState.length}`);
      bandEl.appendChild(svg);
      setWeave(svg, weave);
      const spec = WEAVES[weave];
      const tag = document.createElement('p');
      tag.className = 'stage-say';
      tag.innerHTML = `<b>${spec.title}</b><span>${spec.bit}</span>`;
      bandEl.appendChild(tag);
      const tilt = (bandState.length % 2 ? 2.5 : -3.5);
      svg.style.transform = `rotate(${tilt}deg)`;
      const s = {bandEl, svg, tag, weave, tilt, on:false};
      bandState.push(s);
      requestAnimationFrame(() => { paintRibbon(svg, 1, false, weave); pinSay(s); });
    });
    if(bandState.length && !initStageBands.observing){
      initStageBands.observing = true;
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const s = bandState.find(b => b.bandEl === en.target);
          if(!s) return;
          s.on = en.isIntersecting;
          s.bandEl.classList.toggle('is-on', s.on);
        });
      }, {rootMargin: '60px 0px'});
      bandState.forEach(s => io.observe(s.bandEl));
      addEventListener('resize', () => bandState.forEach(s => { paintRibbon(s.svg, 1, false, s.weave); pinSay(s); }), {passive:true});
      if(!reduce) requestAnimationFrame(swayBands);
    }
  }
  function pinSay(s){
    const bolt = s.svg.querySelector('.bolt-body');
    const bandR = s.bandEl.getBoundingClientRect();
    if(bandR.width < 12) return;
    let x = bandR.width * 0.72, y = 12;
    const ctm = bolt && bolt.getScreenCTM && bolt.getScreenCTM();
    if(ctm){
      const cx = +bolt.getAttribute('cx');
      const cy = +bolt.getAttribute('cy');
      x = ctm.a * cx + ctm.c * cy + ctm.e - bandR.left - 12;
      y = ctm.b * cx + ctm.d * cy + ctm.f - bandR.top - 56;
    }
    x = Math.max(10, Math.min(bandR.width - 186, x));
    y = Math.max(2, Math.min(bandR.height - 62, y));
    s.tag.style.transform = `translate(${x}px, ${y}px) rotate(${(s.tilt * -0.7).toFixed(1)}deg)`;
  }
  function swayBands(now){
    const w = Math.sin(now / 2200);
    bandState.forEach(s => {
      if(!s.on) return;
      s.svg.style.transform = `rotate(${(s.tilt + w * 0.4).toFixed(2)}deg) translateY(${(w * 3).toFixed(1)}px)`;
    });
    requestAnimationFrame(swayBands);
  }
  window.initStageBands = initStageBands;
  if(document.readyState !== 'loading') initStageBands();
  else document.addEventListener('DOMContentLoaded', initStageBands);
})();
