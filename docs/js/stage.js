/* Decorative scroll stage */
/* ---------------- scroll stage ---------------- */
(function startStage(){
  const stage = document.getElementById('pageStage');
  if(!stage) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const node = {};
  stage.querySelectorAll('[data-cast]').forEach(el => { node[el.dataset.cast] = el; });
  const ribbonIds = ['sareeA','sareeB','sareeC','sareeD','sareeE'];
  ribbonIds.forEach(id => {
    const el = node[id];
    if(!el) return;
    el.innerHTML = `<defs><clipPath id="clip-${id}"><path class="cloth-clip"/></clipPath><pattern id="pat-${id}" patternUnits="userSpaceOnUse" width="28" height="28"></pattern></defs><path class="cloth"/><rect class="weave-tile" clip-path="url(#clip-${id})" fill="url(#pat-${id})"/><g class="motifs" clip-path="url(#clip-${id})"></g><path class="kara kara-a"/><path class="zari zari-a"/><path class="zari zari-b"/><path class="kara kara-b"/><g class="bolt"><ellipse class="bolt-body"/><ellipse class="bolt-ring r1"/><ellipse class="bolt-ring r2"/><ellipse class="bolt-ring r3"/><ellipse class="bolt-end"/></g>`;
  });
  const RIBBON_PAD = 22;
  const RIBBON_THICK = 156;
  function clothBand(len, thick, sag, vertical){
    const y0 = RIBBON_PAD;
    const y1 = y0 + thick;
    if(vertical){
      return `M ${y0} 0 C ${y0+sag} ${len*0.35}, ${y0+sag} ${len*0.65}, ${y0} ${len} L ${y1} ${len} C ${y1+sag} ${len*0.65}, ${y1+sag} ${len*0.35}, ${y1} 0 Z`;
    }
    return `M 0 ${y0} C ${len*0.35} ${y0+sag}, ${len*0.65} ${y0+sag}, ${len} ${y0} L ${len} ${y1} C ${len*0.65} ${y1+sag}, ${len*0.35} ${y1+sag}, 0 ${y1} Z`;
  }
  function clothEdge(len, y, sag, vertical){
    if(vertical) return `M ${y} 0 C ${y+sag} ${len*0.35}, ${y+sag} ${len*0.65}, ${y} ${len}`;
    return `M 0 ${y} C ${len*0.35} ${y+sag}, ${len*0.65} ${y+sag}, ${len} ${y}`;
  }
  function paintRibbon(el, k, vertical, weave){
    if(!el) return;
    const len = 220 + k * 720;
    const thick = RIBBON_THICK;
    const sag = 4 + (1 - k) * 6;
    const y0 = RIBBON_PAD;
    const spec = WEAVES[weave];
    const band = clothBand(len, thick, sag, vertical);
    const cloth = el.querySelector('.cloth');
    const clip = el.querySelector('.cloth-clip');
    const karaA = el.querySelector('.kara-a');
    const karaB = el.querySelector('.kara-b');
    const zariA = el.querySelector('.zari-a');
    const zariB = el.querySelector('.zari-b');
    if(cloth) cloth.setAttribute('d', band);
    if(clip) clip.setAttribute('d', band);
    if(karaA) karaA.setAttribute('d', clothEdge(len, y0, sag, vertical));
    if(karaB) karaB.setAttribute('d', clothEdge(len, y0 + thick, sag, vertical));
    const inset = spec ? spec.inset : 14;
    if(zariA) zariA.setAttribute('d', clothEdge(len, y0 + inset, sag * 0.92, vertical));
    if(zariB) zariB.setAttribute('d', clothEdge(len, y0 + thick - inset, sag * 0.92, vertical));
    const tile = el.querySelector('.weave-tile');
    if(tile){
      if(vertical){ tile.setAttribute('x', y0 - 8); tile.setAttribute('y', 0); tile.setAttribute('width', thick + 16); tile.setAttribute('height', len); }
      else { tile.setAttribute('x', 0); tile.setAttribute('y', y0 - 8); tile.setAttribute('width', len); tile.setAttribute('height', thick + 16); }
    }
    const sig = `${weave}|${Math.round(len / 36)}|${vertical ? 'v' : 'h'}`;
    if(el.dataset.weaveSig !== sig){
      el.dataset.weaveSig = sig;
      paintWeave(el, weave, len, thick, y0, sag, vertical);
    }
    const rect = el.getBoundingClientRect();
    const vbW = vertical ? 200 : 1000;
    const vbH = vertical ? 1000 : 200;
    const sx = (rect.width / vbW) || 1;
    const sy = (rect.height / vbH) || 1;
    const cx = vertical ? y0 + thick / 2 + sag * 0.25 : len;
    const cy = vertical ? len : y0 + thick / 2 + sag * 0.25;
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
  const WEAVES = {
    ilkal: { tone:'tone-ilkal', title:'Ilkal', bit:'Tope Teni pallu · Bagalkot', inset:22, kind:'teni' },
    mysore: { tone:'tone-mysore', title:'Mysore silk', bit:'Wodeyar zari · Mysuru', inset:16, kind:'zari' },
    kasuti: { tone:'tone-kasuti', title:'Kasuti', bit:'Blackwork · Hubballi-Dharwad', inset:10, kind:'kasuti' },
    molakalmuru: { tone:'tone-molakalmuru', title:'Molakalmuru', bit:'Silk checks · Chitradurga', inset:12, kind:'check-fine' },
    khana: { tone:'tone-khana', title:'Ilkal khana', bit:'Blouse-piece checks', inset:14, kind:'check-bold' }
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
  }
  function bowAt(s, sag, len){
    return sag * Math.sin(Math.PI * Math.max(0, Math.min(1, s / len)));
  }
  function paintWeave(el, weave, len, thick, y0, sag, vertical){
    const spec = WEAVES[weave];
    const pat = el.querySelector('pattern');
    const motifs = el.querySelector('.motifs');
    const tile = el.querySelector('.weave-tile');
    if(!spec || !motifs) return;
    if(pat) pat.innerHTML = '';
    if(tile) tile.style.display = (spec.kind === 'check-fine' || spec.kind === 'check-bold') ? '' : 'none';
    if(spec.kind === 'check-fine' || spec.kind === 'check-bold'){
      const cell = spec.kind === 'check-fine' ? 12 : 22;
      const a = spec.kind === 'check-fine' ? '#C41E3A' : '#9C2436';
      const b = spec.kind === 'check-fine' ? '#1F6B3A' : '#D6A419';
      if(pat){
        pat.setAttribute('width', cell * 2);
        pat.setAttribute('height', cell * 2);
        pat.innerHTML = `<rect width="${cell}" height="${cell}" fill="${a}"/><rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="${a}"/><rect x="${cell}" width="${cell}" height="${cell}" fill="${b}"/><rect y="${cell}" width="${cell}" height="${cell}" fill="${b}"/>`;
      }
      motifs.innerHTML = '';
      return;
    }
    if(spec.kind === 'teni'){
      motifs.innerHTML = ilkalTeni(len, thick, y0, sag, vertical);
      return;
    }
    if(spec.kind === 'zari'){
      motifs.innerHTML = mysoreZari(len, thick, y0, sag, vertical);
      return;
    }
    if(spec.kind === 'kasuti'){
      motifs.innerHTML = kasutiStitch(len, thick, y0, sag, vertical);
    }
  }
  function ilkalTeni(len, thick, y0, sag, vertical){
    const start = len * 0.55;
    const step = 26;
    let html = '';
    const h = thick * 0.4;
    for(let s = 8; s < start; s += 18){
      const bow = bowAt(s, sag, len);
      const hh = thick * 0.16;
      if(vertical){
        html += `<polygon class="teni" points="${y0 + 6 + bow},${s} ${y0 + 6 + hh + bow},${s + 9} ${y0 + 6 + bow},${s + 18}"/>`;
      } else {
        html += `<polygon class="teni" points="${s},${y0 + 6 + bow} ${s + 9},${y0 + 6 + hh + bow} ${s + 18},${y0 + 6 + bow}"/>`;
      }
    }
    for(let s = start; s < len - 10; s += step){
      const bow = bowAt(s + step / 2, sag, len);
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
  function mysoreZari(len, thick, y0, sag, vertical){
    let html = '';
    [0.18, 0.26, 0.74, 0.82].forEach(p => {
      html += `<path class="zari-band" d="${clothEdge(len, y0 + thick * p, sag * 0.9, vertical)}"/>`;
    });
    const gap = 54;
    for(let s = 36; s < len - 30; s += gap){
      const bow = bowAt(s, sag, len);
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
  function kasutiStitch(len, thick, y0, sag, vertical){
    let html = '';
    const step = 36;
    let n = 0;
    for(let s = 28; s < len - 20; s += step){
      const bow = bowAt(s, sag, len);
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
  const kWin = (t, a, b, fade = 0.06) => {
    if(t < a || t > b) return 0;
    if(a > 0 && t < a + fade) return (t - a) / fade;
    if(t > b - fade) return (b - t) / fade;
    return 1;
  };
  const actors = [
    {id:'sareeA', weave:'ilkal', a:0, b:0.46, idle:4, pose(t,k,w){
      setWeave(node.sareeA, 'ilkal');
      paintRibbon(node.sareeA, k, false, 'ilkal');
      return `rotate(${-3 + w * 0.15}deg) translate(${(t - 0.2) * 36}px, ${w * 2}px)`;
    }},
    {id:'sareeB', weave:'mysore', a:0.1, b:0.62, idle:-3, pose(t,k,w){
      setWeave(node.sareeB, 'mysore');
      paintRibbon(node.sareeB, k, false, 'mysore');
      return `rotate(${2.5 + w * 0.12}deg) translate(${(0.4 - t) * 28}px, ${w}px)`;
    }},
    {id:'sareeC', weave:'kasuti', a:0.22, b:0.7, idle:2, pose(t,k,w){
      setWeave(node.sareeC, 'kasuti');
      paintRibbon(node.sareeC, k, true, 'kasuti');
      return `translate(${w}px, 0)`;
    }},
    {id:'sareeD', weave:'molakalmuru', a:0.16, b:0.68, idle:3, pose(t,k,w){
      setWeave(node.sareeD, 'molakalmuru');
      paintRibbon(node.sareeD, k, false, 'molakalmuru');
      return `rotate(${-1.5}deg) translate(${(t - 0.4) * -24}px, ${w * 1.5}px)`;
    }},
    {id:'sareeE', weave:'khana', a:0.48, b:1, idle:2, pose(t,k,w){
      setWeave(node.sareeE, 'khana');
      paintRibbon(node.sareeE, k, true, 'khana');
      return `translate(${w * 0.8}px, 0)`;
    }},
    {id:'malaJasmine', a:0.02, b:0.26, a2:0.78, b2:0.96, idle:6, pose(t,k,w){
      return `translate(${(t - 0.12) * -40}px, ${w * 2}px)`;
    }},
    {id:'malaMarigold', a:0.3, b:0.56, idle:-5, pose(t,k,w){
      return `translate(${(t - 0.42) * 50}px, ${w * 1.5}px)`;
    }},
    {id:'malaMix', a:0.18, b:0.48, a2:0.7, b2:0.92, idle:4, pose(t,k,w){
      return `translate(${w * 1.2}px, ${(t - 0.35) * 40 + w}px)`;
    }},
    {id:'malaDropL', a:0.06, b:0.4, a2:0.62, b2:0.94, idle:5, pose(t,k,w){
      return `translate(${w * 1.4}px, ${(t - 0.2) * 36 + w * 1.2}px)`;
    }},
    {id:'malaDropR', a:0.28, b:0.58, a2:0.74, b2:1, idle:-4, pose(t,k,w){
      return `translate(${-w}px, ${(0.5 - t) * 44 + w}px)`;
    }},
    {id:'veni', a:0.22, b:0.5, idle:3, pose(t,k,w){
      return `rotate(${w * 0.4}deg) translate(${w}px, ${(0.36 - t) * 50}px)`;
    }},
    {id:'petals', a:0.4, b:0.72, idle:10, pose(t,k,w){
      return `translate(${Math.sin(w / 4) * 16}px, ${(t - 0.4) * 80 + w * 3}px)`;
    }},
    {id:'torana', a:0, b:0.22, a2:0.84, b2:1, idle:0, pose(t,k,w){
      return `translate(${w * 1.2}px, ${t * -48 + w * 2}px)`;
    }},
    {id:'jasmine', a:0.04, b:0.32, idle:10, pose(t,k,w){
      return `translate(${8 * Math.sin(w / 6)}px, ${t * 36 + w * 2.5}px)`;
    }},
    {id:'gopura', a:0.12, b:0.42, idle:4, pose(t,k,w){
      return `translate(${(0.27 - t) * 40}px, ${(t - 0.27) * 90 + w}px)`;
    }},
    {id:'nandi', a:0.2, b:0.44, idle:-6, pose(t,k,w){
      return `translate(${(t - 0.32) * 50}px, ${w * 1.5}px)`;
    }},
    {id:'vidhana', a:0.28, b:0.54, idle:3, pose(t,k,w){
      return `translate(${(0.4 - t) * 60}px, ${(t - 0.4) * 70 + w}px)`;
    }},
    {id:'dabaraL', a:0.4, b:0.68, idle:0, pose(t,k,w){
      return `translate(${w * 1.5}px, ${(0.54 - t) * 80}px) scale(${0.92 + k * 0.1})`;
    }},
    {id:'dabaraR', a:0.46, b:0.74, idle:0, pose(t,k,w){
      return `translate(${(t - 0.6) * 40}px, ${w * 2}px) scale(0.88)`;
    }},
    {id:'dosaTava', a:0.32, b:0.7, idle:3, pose(t,k,w){
      return `translate(${w * 2}px, ${(0.5 - t) * 40}px) rotate(${w * 0.4}deg)`;
    }},
    {id:'idliPot', a:0.38, b:0.76, idle:-4, pose(t,k,w){
      return `translate(${(t - 0.55) * 36}px, ${w * 2}px)`;
    }},
    {id:'bananaLeaf', a:0.5, b:0.88, idle:5, pose(t,k,w){
      return `translate(${Math.sin(w / 5) * 12}px, ${(t - 0.7) * 50 + w}px) rotate(${-6 + w}deg)`;
    }},
    {id:'flowers', a:0.52, b:0.78, idle:8, pose(t,k,w){
      return `translate(${Math.sin(w / 5) * 10}px, ${(t - 0.65) * 60 + w}px)`;
    }},
    {id:'mangoA', a:0.04, b:0.98, idle:8, pose(t,k,w,now){
      const n = now / 1000;
      return `translate(${Math.sin(n * 0.7) * 90 + Math.cos(n * 0.31) * 36}px, ${Math.cos(n * 0.55) * 52 + (t - 0.45) * 40}px) rotate(${Math.sin(n * 0.9) * 14}deg)`;
    }},
    {id:'mangoB', a:0.18, b:1, idle:-6, pose(t,k,w,now){
      const n = now / 1000;
      return `translate(${Math.cos(n * 0.48) * 70 + Math.sin(n * 0.22) * 28}px, ${Math.sin(n * 0.62) * 46 + w * 3}px) rotate(${-8 + Math.cos(n * 0.7) * 16}deg)`;
    }},
    {id:'elephant', a:0.58, b:0.94, idle:0, pose(t,k,w){
      const walk = (t - 0.58) / 0.36;
      return `translate(${-walk * 320 + w * 2}px, ${Math.sin(w / 7) * 6}px) scaleX(-1)`;
    }}
  ];
  const say = {};
  const sayTilt = {sareeA:-3, sareeB:4, sareeC:-2, sareeD:2.5, sareeE:-3.5};
  ribbonIds.forEach(id => {
    const p = document.createElement('p');
    p.className = 'stage-say';
    p.style.setProperty('--tilt', `${sayTilt[id] || 0}deg`);
    p.innerHTML = '<b></b><span></span>';
    stage.appendChild(p);
    say[id] = p;
  });
  function pinSareeSay(a, el, k){
    const tag = say[a.id];
    const spec = WEAVES[a.weave];
    if(!tag || !spec) return;
    const r = el.getBoundingClientRect();
    const hidden = k < 0.14 || r.width < 12 || getComputedStyle(el).display === 'none';
    tag.classList.toggle('is-on', !hidden);
    if(hidden) return;
    const title = tag.querySelector('b');
    const bit = tag.querySelector('span');
    if(title.textContent !== spec.title) title.textContent = spec.title;
    if(bit.textContent !== spec.bit) bit.textContent = spec.bit;
    const bolt = el.querySelector('.bolt-body');
    let x = r.left + 28;
    let y = r.top + 8;
    const ctm = bolt && bolt.getScreenCTM && bolt.getScreenCTM();
    if(ctm){
      const cx = +bolt.getAttribute('cx');
      const cy = +bolt.getAttribute('cy');
      x = ctm.a * cx + ctm.c * cy + ctm.e - 12;
      y = ctm.b * cx + ctm.d * cy + ctm.f - 52;
    }
    x = Math.max(10, Math.min(innerWidth - 186, x));
    y = Math.max(78, Math.min(innerHeight - 62, y));
    tag.style.transform = `translate(${x}px, ${y}px) rotate(var(--tilt))`;
  }

  let ticking = false;
  function frame(now){
    ticking = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const t = Math.min(1, Math.max(0, scrollY / max));
    const w = reduce ? 0 : Math.sin(now / 2200);
    actors.forEach(a => {
      const el = node[a.id];
      if(!el) return;
      let k = kWin(t, a.a, a.b);
      if(a.a2 != null) k = Math.max(k, kWin(t, a.a2, a.b2));
      el.classList.toggle('is-on', k > 0.04);
      el.style.setProperty('--on', String((0.4 + 0.4 * k).toFixed(3)));
      if(reduce){
        el.style.transform = '';
        return;
      }
      el.style.transform = a.pose(t, k, w * (a.idle || 1), now);
      if(a.weave) pinSareeSay(a, el, k);
    });
    if(!reduce) requestAnimationFrame(() => { ticking = true; frame(performance.now()); });
  }

  if(reduce){
    actors.forEach(a => {
      const el = node[a.id];
      if(el && (a.id === 'sareeA' || a.id === 'torana')){
        el.classList.add('is-on');
        el.style.setProperty('--on', '0.32');
      }
      if(el && a.weave){
        setWeave(el, a.weave);
        paintRibbon(el, 1, a.id === 'sareeC' || a.id === 'sareeE', a.weave);
        pinSareeSay(a, el, 1);
      }
    });
    return;
  }
  addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(() => frame(performance.now())); } }, {passive:true});
  addEventListener('resize', () => frame(performance.now()), {passive:true});
  requestAnimationFrame(frame);
})();
