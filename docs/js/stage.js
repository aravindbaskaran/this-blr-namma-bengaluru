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
    el.innerHTML = `<path class="cloth"/><path class="kara kara-a"/><path class="zari zari-a"/><path class="zari zari-b"/><path class="kara kara-b"/><g class="pleats"></g><g class="bolt"><ellipse class="bolt-body"/><ellipse class="bolt-ring r1"/><ellipse class="bolt-ring r2"/><ellipse class="bolt-ring r3"/><ellipse class="bolt-end"/></g>`;
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
  function paintRibbon(el, k, vertical){
    if(!el) return;
    const len = 220 + k * 720;
    const thick = RIBBON_THICK;
    const sag = 4 + (1 - k) * 6;
    const y0 = RIBBON_PAD;
    const cloth = el.querySelector('.cloth');
    const karaA = el.querySelector('.kara-a');
    const karaB = el.querySelector('.kara-b');
    const zariA = el.querySelector('.zari-a');
    const zariB = el.querySelector('.zari-b');
    if(cloth) cloth.setAttribute('d', clothBand(len, thick, sag, vertical));
    if(karaA) karaA.setAttribute('d', clothEdge(len, y0, sag, vertical));
    if(karaB) karaB.setAttribute('d', clothEdge(len, y0 + thick, sag, vertical));
    if(zariA) zariA.setAttribute('d', clothEdge(len, y0 + 14, sag * 0.92, vertical));
    if(zariB) zariB.setAttribute('d', clothEdge(len, y0 + thick - 14, sag * 0.92, vertical));
    const pleats = el.querySelector('.pleats');
    if(pleats){
      let d = '';
      for(let s = 40; s < len - 28; s += 28){
        const t = s / len;
        const bow = sag * Math.sin(Math.PI * t);
        if(vertical) d += `M ${y0 + 18 + bow} ${s} L ${y0 + thick - 18 + bow} ${s} `;
        else d += `M ${s} ${y0 + 18 + bow} L ${s} ${y0 + thick - 18 + bow} `;
      }
      pleats.innerHTML = d ? `<path class="pleat" d="${d.trim()}"/>` : '';
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
  const TONES = [
    'tone-ilkal','tone-mysore','tone-kasuti','tone-jacaranda','tone-coastal','tone-hampi',
    'tone-blr-silk','tone-molakalmuru','tone-kodagu','tone-khana','tone-ilkal-green',
    'tone-narayanpet','tone-crepe','tone-navy-zari','tone-peacock','tone-magenta'
  ];
  const setTone = (el, tone) => {
    if(!el) return;
    TONES.forEach(c => el.classList.toggle(c, c === tone));
  };
  const pickTone = (t, phase) => TONES[Math.floor((t * TONES.length * 1.15 + phase) % TONES.length)];
  const kWin = (t, a, b, fade = 0.06) => {
    if(t < a || t > b) return 0;
    if(a > 0 && t < a + fade) return (t - a) / fade;
    if(t > b - fade) return (b - t) / fade;
    return 1;
  };
  const actors = [
    {id:'sareeA', a:0, b:0.46, idle:4, pose(t,k,w){
      setTone(node.sareeA, pickTone(t, 0));
      paintRibbon(node.sareeA, k, false);
      return `rotate(${-3 + w * 0.15}deg) translate(${(t - 0.2) * 36}px, ${w * 2}px)`;
    }},
    {id:'sareeB', a:0.1, b:0.62, idle:-3, pose(t,k,w){
      setTone(node.sareeB, pickTone(t, 5));
      paintRibbon(node.sareeB, k, false);
      return `rotate(${2.5 + w * 0.12}deg) translate(${(0.4 - t) * 28}px, ${w}px)`;
    }},
    {id:'sareeC', a:0.22, b:0.7, idle:2, pose(t,k,w){
      setTone(node.sareeC, pickTone(t, 9));
      paintRibbon(node.sareeC, k, true);
      return `translate(${w}px, 0)`;
    }},
    {id:'sareeD', a:0.16, b:0.68, idle:3, pose(t,k,w){
      setTone(node.sareeD, pickTone(t, 3));
      paintRibbon(node.sareeD, k, false);
      return `rotate(${-1.5}deg) translate(${(t - 0.4) * -24}px, ${w * 1.5}px)`;
    }},
    {id:'sareeE', a:0.48, b:1, idle:2, pose(t,k,w){
      setTone(node.sareeE, pickTone(t, 12));
      paintRibbon(node.sareeE, k, true);
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
    });
    return;
  }
  addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(() => frame(performance.now())); } }, {passive:true});
  addEventListener('resize', () => frame(performance.now()), {passive:true});
  requestAnimationFrame(frame);
})();
