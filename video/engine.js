// your nora — движок отрисовки кадров.
// Всё рисуется в SVG 1080×1920. Эпизод задаёт сцены и субтитры, движок рисует кадр для момента t (секунды).

const W = 1080, H = 1920;

// ---------- утилиты ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const easeOut = k => 1 - Math.pow(1 - k, 3);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let r = Math.imul(seed ^ seed >>> 15, 1 | seed);
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
const g = (inner, attrs = '') => `<g ${attrs}>${inner}</g>`;

// ---------- палитра ----------
const C = {
  night1: '#141c38', night2: '#24315c', wall1: '#1b2546', wall2: '#2a3866',
  hair: '#4a2a20', hairDark: '#331b14', hairLight: '#6e4030',
  skin: '#f7dccf', skinShade: '#e8bfae', blush: '#f2a0a8',
  iris1: '#4f6fa0', iris2: '#a9c4e6', pupil: '#1e2843', line: '#2a1a14',
  sweater: '#8fa3c4', collar: '#d6deef',
  lamp: '#ffcf7a', cream: '#f4ecdd', ink: '#2b2a3a',
  blanket: '#1d2a55',
};

// ---------- общие defs ----------
const DEFS = `
<defs>
  <linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.wall1}"/><stop offset="1" stop-color="${C.wall2}"/></linearGradient>
  <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1630"/><stop offset="1" stop-color="#2a3a6c"/></linearGradient>
  <linearGradient id="gHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.hairLight}"/><stop offset=".35" stop-color="${C.hair}"/><stop offset="1" stop-color="${C.hairDark}"/></linearGradient>
  <linearGradient id="gIris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.iris1}"/><stop offset="1" stop-color="${C.iris2}"/></linearGradient>
  <linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe4d8"/><stop offset="1" stop-color="${C.skin}"/></linearGradient>
  <radialGradient id="gLamp"><stop offset="0" stop-color="${C.lamp}" stop-opacity=".55"/><stop offset=".45" stop-color="${C.lamp}" stop-opacity=".18"/><stop offset="1" stop-color="${C.lamp}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gPhoneGlow"><stop offset="0" stop-color="#bcd3ff" stop-opacity=".5"/><stop offset="1" stop-color="#bcd3ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="gVignette" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050a1c" stop-opacity=".6"/></radialGradient>
  <radialGradient id="gEnd" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#2c3d73"/><stop offset="1" stop-color="#10182f"/></radialGradient>
  <linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3c2a"/><stop offset="1" stop-color="#3d281c"/></linearGradient>
  <linearGradient id="gCafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3428"/><stop offset="1" stop-color="#7a5539"/></linearGradient>
  <filter id="fBlur3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="fBlur8" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="fBlur16" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="fShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#08102a" flood-opacity=".45"/></filter>
  <filter id="fText" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#060b1e" flood-opacity=".85"/></filter>
  <filter id="fSepia"><feColorMatrix type="matrix" values=".5 .45 .15 0 .08  .42 .42 .14 0 .07  .32 .33 .12 0 .05  0 0 0 1 0"/></filter>
</defs>`;

// ---------- снег ----------
function snow(t, o = {}) {
  const { n = 70, seed = 7, x0 = 0, y0 = 0, w = W, h = H, r = [2, 5], speed = [40, 90], op = 0.75 } = o;
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const px = R() * w, py = R() * h, rr = lerp(r[0], r[1], R()), sp = lerp(speed[0], speed[1], R()), ph = R() * 6.28;
    const y = (py + t * sp) % h, x = px + Math.sin(t * 0.8 + ph) * 18;
    s += `<circle cx="${(x0 + x).toFixed(1)}" cy="${(y0 + y).toFixed(1)}" r="${rr.toFixed(1)}" fill="#fff" opacity="${(op * (0.5 + 0.5 * R())).toFixed(2)}"/>`;
  }
  return s;
}

// ---------- город за окном ----------
function city(x, y, w, h, seed = 3) {
  const R = rng(seed); let s = '', cx = x;
  while (cx < x + w) {
    const bw = lerp(50, 110, R()), bh = lerp(h * 0.25, h * 0.6, R());
    s += `<rect x="${cx}" y="${y + h - bh}" width="${bw}" height="${bh}" fill="#18224a"/>`;
    for (let wy = y + h - bh + 16; wy < y + h - 10; wy += 26)
      for (let wx = cx + 10; wx < cx + bw - 12; wx += 22)
        if (R() < 0.22) s += `<rect x="${wx}" y="${wy}" width="8" height="10" fill="#ffd77e" opacity="${(0.55 + R() * 0.45).toFixed(2)}"/>`;
    cx += bw + 4;
  }
  return s;
}

// ---------- окно ----------
function windowPane(t, x, y, w, h, o = {}) {
  const id = 'clipWin' + Math.round(x) + Math.round(y);
  return `
  <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
  <rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" rx="6" fill="#3d4d80"/>
  <g clip-path="url(#${id})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gNight)"/>
    <circle cx="${x + w * 0.72}" cy="${y + h * 0.17}" r="${w * 0.055}" fill="#f2f0e6"/>
    <circle cx="${x + w * 0.72}" cy="${y + h * 0.17}" r="${w * 0.12}" fill="#f2f0e6" opacity=".12"/>
    ${city(x, y + h * 0.45, w, h * 0.55, o.seed || 3)}
    ${snow(t, { n: 40, seed: 11, x0: x, y0: y, w, h, r: [2, 4.5], speed: [30, 70] })}
  </g>
  <rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="#3d4d80"/>
  <rect x="${x}" y="${y + h * 0.42}" width="${w}" height="14" fill="#3d4d80"/>
  <rect x="${x - 34}" y="${y + h + 14}" width="${w + 68}" height="22" rx="4" fill="#4a5b90"/>`;
}

// ---------- комната Норы ----------
function room(t, o = {}) {
  const blur = o.blur ? `filter="url(#fBlur${o.blur})"` : '';
  const lampOn = o.lamp !== false;
  return g(`
    <rect width="${W}" height="${H}" fill="url(#gWall)"/>
    <rect x="440" y="0" width="90" height="1150" fill="#2d3c6d" opacity=".9"/>
    ${windowPane(t, 560, 170, 440, 760)}
    <g transform="rotate(-6 150 260)"><rect x="70" y="180" width="150" height="170" fill="#c9d4e8"/><rect x="82" y="192" width="126" height="118" fill="#8fa6c9"/></g>
    <g transform="rotate(5 300 250)"><rect x="235" y="170" width="140" height="160" fill="#e3d6c2"/><rect x="246" y="181" width="118" height="108" fill="#b5a28a"/></g>
    <g transform="rotate(-3 170 470)"><rect x="100" y="390" width="140" height="160" fill="#d7e1d4"/><rect x="111" y="401" width="118" height="108" fill="#9fb59c"/></g>
    <rect x="135" y="174" width="34" height="12" fill="#e7a3a8" opacity=".85" transform="rotate(-6 150 180)"/>
    <rect x="285" y="164" width="34" height="12" fill="#f0e1a8" opacity=".85"/>
    ${lampOn ? `<circle cx="250" cy="980" r="420" fill="url(#gLamp)"/>` : ''}
    <path d="M190 900 L310 900 L285 820 L215 820 Z" fill="${lampOn ? '#f3dcae' : '#8d8a9a'}"/>
    <rect x="243" y="900" width="14" height="110" fill="#c9b48e"/>
    <rect x="0" y="1010" width="${W}" height="30" fill="#2e3a66"/>
    <rect x="0" y="1040" width="${W}" height="${H - 1040}" fill="#202c58"/>
    <path d="M0 1500 Q540 1430 1080 1500 L1080 1920 L0 1920 Z" fill="${C.blanket}"/>
  `, blur);
}

// ---------- улица ----------
function street(t, o = {}) {
  const blur = o.blur ? `filter="url(#fBlur${o.blur})"` : '';
  let lamps = '';
  for (const lx of [150, 930]) lamps += `
    <circle cx="${lx}" cy="560" r="300" fill="url(#gLamp)"/>
    <rect x="${lx - 7}" y="560" width="14" height="900" fill="#141b35"/>
    <path d="M${lx - 34} 560 L${lx + 34} 560 L${lx + 20} 520 L${lx - 20} 520 Z" fill="#141b35"/>
    <ellipse cx="${lx}" cy="566" rx="26" ry="9" fill="#ffe2a0"/>`;
  return g(`
    <rect width="${W}" height="${H}" fill="url(#gNight)"/>
    <circle cx="820" cy="260" r="46" fill="#f2f0e6"/><circle cx="820" cy="260" r="110" fill="#f2f0e6" opacity=".1"/>
    ${city(-20, 520, 1120, 800, 21)}
    ${lamps}
    <path d="M0 1380 Q540 1330 1080 1380 L1080 1920 L0 1920 Z" fill="#c9d6ee"/>
    <path d="M0 1450 Q540 1410 1080 1450 L1080 1920 L0 1920 Z" fill="#e4ecf8"/>
  `, blur);
}

// ---------- кафе ----------
function cafe(t, o = {}) {
  const blur = o.blur ? `filter="url(#fBlur${o.blur})"` : '';
  return g(`
    <rect width="${W}" height="${H}" fill="url(#gCafe)"/>
    <rect x="120" y="150" width="840" height="900" rx="20" fill="#2d2420"/>
    <g>
      <clipPath id="clipCafe"><rect x="150" y="180" width="780" height="840" rx="10"/></clipPath>
      <g clip-path="url(#clipCafe)">
        <rect x="150" y="180" width="780" height="840" fill="url(#gNight)"/>
        ${city(150, 560, 780, 460, 5)}
        ${snow(t, { n: 45, seed: 5, x0: 150, y0: 180, w: 780, h: 840, r: [2, 5] })}
      </g>
    </g>
    <rect x="532" y="180" width="16" height="840" fill="#2d2420"/>
    <circle cx="200" cy="120" r="300" fill="url(#gLamp)"/>
    <circle cx="880" cy="120" r="300" fill="url(#gLamp)"/>
    <path d="M160 110 L240 110 L225 60 L175 60 Z" fill="#f0d39a"/>
    <path d="M840 110 L920 110 L905 60 L855 60 Z" fill="#f0d39a"/>
  `, blur);
}

// ---------- плюшевый зайчик ----------
function bunny(x, y, s = 1) {
  return g(`
    <ellipse cx="-22" cy="-120" rx="16" ry="48" fill="#ecebf2"/><ellipse cx="-22" cy="-118" rx="7" ry="32" fill="#f3c4cc"/>
    <ellipse cx="22" cy="-120" rx="16" ry="48" fill="#ecebf2"/><ellipse cx="22" cy="-118" rx="7" ry="32" fill="#f3c4cc"/>
    <ellipse cx="0" cy="20" rx="62" ry="58" fill="#e3e2ea"/>
    <circle cx="0" cy="-48" r="50" fill="#ecebf2"/>
    <circle cx="-17" cy="-52" r="5" fill="#3a3346"/><circle cx="17" cy="-52" r="5" fill="#3a3346"/>
    <ellipse cx="0" cy="-38" rx="5" ry="3.5" fill="#d99aa6"/>
    <ellipse cx="-30" cy="-36" rx="10" ry="6" fill="#f3c4cc" opacity=".7"/><ellipse cx="30" cy="-36" rx="10" ry="6" fill="#f3c4cc" opacity=".7"/>
  `, `transform="translate(${x} ${y}) scale(${s})"`);
}

// ---------- Нора ----------
// Локальные координаты: центр лица (0,0), лицо ≈ 300px в ширину.
function eye(cx, cy, side, o) {
  const { expr, blink, lx = 0, ly = 0 } = o;
  const L = C.line;
  if (expr === 'happy') return `<path d="M${cx - 32} ${cy + 8} Q${cx} ${cy - 26} ${cx + 32} ${cy + 8}" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  if (blink) return `<path d="M${cx - 34} ${cy + 4} Q${cx} ${cy + 16} ${cx + 34} ${cy + 4}" stroke="${L}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M${cx + side * 34} ${cy + 4} l${side * 12} -6" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
  const big = expr === 'surprised' ? 1.08 : 1;
  const rx = 37 * big, ry = 34 * big;
  const ix = cx + lx, iy = cy + 4 + ly;
  const out = side; // наружная сторона
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fbfbff"/>
    <ellipse cx="${ix}" cy="${iy}" rx="${27 * big}" ry="${30 * big}" fill="url(#gIris)"/>
    <ellipse cx="${ix}" cy="${iy + 1}" rx="${12 * big}" ry="${15 * big}" fill="${C.pupil}"/>
    <circle cx="${ix - 10}" cy="${iy - 11}" r="${9 * big}" fill="#fff"/>
    <circle cx="${ix + 10}" cy="${iy + 13}" r="4" fill="#fff" opacity=".9"/>
    <path d="M${cx - out * 40} ${cy - 2} Q${cx - out * 6} ${cy - ry - 16} ${cx + out * 42} ${cy - 10}" stroke="${L}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M${cx + out * 38} ${cy - 12} l${out * 14} -12 M${cx + out * 34} ${cy - 20} l${out * 9} -15" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
    <path d="M${cx - 26} ${cy + ry + 4} Q${cx} ${cy + ry + 10} ${cx + 26} ${cy + ry + 4}" stroke="#c99a8e" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function brows(expr) {
  const L = C.line;
  let l, r;
  if (expr === 'worried' || expr === 'sad') { l = 'M-92 -34 Q-62 -40 -34 -50'; r = 'M92 -34 Q62 -40 34 -50'; }
  else if (expr === 'surprised') { l = 'M-92 -50 Q-62 -64 -34 -56'; r = 'M92 -50 Q62 -64 34 -56'; }
  else { l = 'M-92 -40 Q-62 -50 -34 -44'; r = 'M92 -40 Q62 -50 34 -44'; }
  return `<path d="${l}" stroke="${L}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".75"/><path d="${r}" stroke="${L}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".75"/>`;
}

function mouth(expr) {
  const M = '#b5645a';
  switch (expr) {
    case 'worried': case 'sad': return `<path d="M-15 132 Q0 123 15 132" stroke="${M}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    case 'surprised': return `<ellipse cx="0" cy="128" rx="9" ry="12" fill="#a8524a"/>`;
    case 'smile': return `<path d="M-24 120 Q0 142 24 120" stroke="${M}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    case 'happy': return `<path d="M-28 116 Q0 160 28 116 Z" fill="#b24c48"/><path d="M-16 140 Q0 150 16 140 Q0 132 -16 140 Z" fill="#e58c8c"/>`;
    default: return `<path d="M-14 126 Q0 132 14 126" stroke="${M}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  }
}

function nora(o = {}) {
  const {
    x = 540, y = 800, s = 1, expr = 'neutral', blink = false, lx = 0, ly = 0,
    sweater = C.sweater, scarf = null, scarfUp = 0, phone = false, headphones = false, tilt = 0,
  } = o;
  const happyish = expr === 'smile' || expr === 'happy';
  const scarfY = lerp(255, 128, scarfUp);
  const scarfSvg = scarf ? `
      <path d="M-150 ${scarfY - 40} Q0 ${scarfY + 10} 150 ${scarfY - 40} L165 ${scarfY + 40} Q0 ${scarfY + 95} -165 ${scarfY + 40} Z" fill="${scarf}"/>
      <path d="M-150 ${scarfY - 40} Q0 ${scarfY + 10} 150 ${scarfY - 40}" stroke="#000" stroke-opacity=".12" stroke-width="6" fill="none"/>
      <path d="M40 ${scarfY + 50} L110 ${scarfY + 50} L120 ${scarfY + 330} L50 ${scarfY + 330} Z" fill="${scarf}"/>
      <path d="M50 ${scarfY + 330} l0 22 M68 ${scarfY + 330} l0 22 M86 ${scarfY + 330} l0 22 M104 ${scarfY + 330} l0 22 M120 ${scarfY + 330} l0 22" stroke="${scarf}" stroke-width="7"/>` : '';
  const phoneSvg = phone ? `
      <circle cx="0" cy="380" r="330" fill="url(#gPhoneGlow)"/>
      <rect x="-70" y="430" width="140" height="250" rx="22" fill="#1d2338"/>
      <rect x="-60" y="442" width="120" height="226" rx="16" fill="#b8ceef"/>
      <ellipse cx="-88" cy="640" rx="52" ry="70" fill="${C.skin}"/><ellipse cx="88" cy="640" rx="52" ry="70" fill="${C.skin}"/>
      <ellipse cx="-62" cy="575" rx="20" ry="30" fill="${C.skin}"/><ellipse cx="62" cy="575" rx="20" ry="30" fill="${C.skin}"/>` : '';
  const hp = headphones ? `
      <path d="M-178 -40 C-190 -300 190 -300 178 -40" stroke="#eef1f8" stroke-width="26" fill="none"/>
      <rect x="-205" y="-70" width="56" height="110" rx="24" fill="#eef1f8"/><rect x="149" y="-70" width="56" height="110" rx="24" fill="#eef1f8"/>
      <rect x="-195" y="-55" width="30" height="80" rx="14" fill="#c5cde0"/><rect x="165" y="-55" width="30" height="80" rx="14" fill="#c5cde0"/>` : '';
  return g(`
    <path d="M-200 -40 C-215 -330 215 -330 200 -40 C210 150 235 380 225 560 L-225 560 C-235 380 -210 150 -200 -40 Z" fill="url(#gHair)"/>
    <rect x="-46" y="110" width="92" height="170" fill="${C.skinShade}"/>
    <path d="M-46 150 Q0 200 46 150 L46 110 L-46 110 Z" fill="#dcae9c"/>
    <path d="M-340 1100 C-345 420 -260 280 -100 255 Q0 292 100 255 C260 280 345 420 340 1100 Z" fill="${sweater}"/>
    <path d="M-340 1100 C-345 420 -260 280 -100 255 Q-40 275 -20 285 C-150 330 -230 500 -240 1100 Z" fill="#fff" opacity=".08"/>
    <path d="M-102 254 Q0 300 102 254" stroke="${C.collar}" stroke-width="24" fill="none" stroke-linecap="round"/>
    <path d="M-200 -40 C-222 160 -228 380 -212 640 L-150 610 C-152 420 -148 220 -132 60 Z" fill="${C.hair}"/>
    <path d="M200 -40 C222 160 228 380 212 640 L150 610 C152 420 148 220 132 60 Z" fill="${C.hair}"/>
    ${scarfSvg}
    ${phoneSvg}
    <ellipse cx="-150" cy="35" rx="20" ry="30" fill="${C.skinShade}"/><ellipse cx="150" cy="35" rx="20" ry="30" fill="${C.skinShade}"/>
    <path d="M-152 -80 C-158 50 -110 160 0 196 C110 160 158 50 152 -80 C150 -205 -150 -205 -152 -80 Z" fill="url(#gSkin)"/>
    <ellipse cx="-90" cy="88" rx="34" ry="17" fill="${C.blush}" opacity="${happyish ? 0.7 : 0.45}"/>
    <ellipse cx="90" cy="88" rx="34" ry="17" fill="${C.blush}" opacity="${happyish ? 0.7 : 0.45}"/>
    ${eye(-64, 28, -1, { expr, blink, lx, ly })}
    ${eye(64, 28, 1, { expr, blink, lx, ly })}
    <path d="M-2 78 L4 96 L-4 98" stroke="#d4a493" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${scarf && scarfUp > 0.6 ? '' : mouth(expr)}
    <path d="M-176 -50 C-190 -250 190 -250 176 -50 Q150 -12 118 -48 Q84 -6 46 -46 Q8 -4 -34 -46 Q-74 -6 -112 -48 Q-146 -12 -176 -50 Z" fill="url(#gHair)"/>
    <path d="M-120 -170 Q-40 -205 60 -190" stroke="#8a5340" stroke-width="10" fill="none" stroke-linecap="round" opacity=".5"/>
    ${brows(expr)}
    ${scarf && scarfUp > 0 ? scarfSvg : ''}
    ${hp}
  `, `transform="translate(${x} ${y}) rotate(${tilt}) scale(${s})"`);
}

// Нора со спины (у окна). arm: поднятая рука, касается стекла.
function noraBack(o = {}) {
  const { x = 540, y = 1350, s = 1, sweater = C.sweater, arm = true } = o;
  return g(`
    <path d="M-330 700 C-340 260 -250 140 -110 120 L110 120 C250 140 340 260 330 700 Z" fill="${sweater}"/>
    ${arm ? `<path d="M200 170 C300 120 330 -60 300 -250 L245 -262 C260 -90 240 40 150 120 Z" fill="${sweater}"/>
    <ellipse cx="274" cy="-290" rx="38" ry="52" fill="${C.skin}"/>` : ''}
    <path d="M-170 -150 C-200 -400 200 -400 170 -150 C190 0 205 250 190 520 Q0 560 -190 520 C-205 250 -190 0 -170 -150 Z" fill="url(#gHair)"/>
    <path d="M-90 -300 C-120 -100 -110 200 -95 480 M0 -330 L0 500 M90 -300 C120 -100 110 200 95 480" stroke="${C.hairDark}" stroke-width="5" fill="none" opacity=".35"/>
  `, `transform="translate(${x} ${y}) scale(${s})"`);
}

// Страница дневника на столе: строки пишутся по буквам между t0 и t1.
function diaryPage(t, lt, lines, t0, t1) {
  const full = lines.join('\n');
  const shown = full.slice(0, Math.round(full.length * clamp((t - t0) / (t1 - t0))));
  let out = '', rules = '';
  shown.split('\n').forEach((l, i) => { out += `<text x="330" y="${700 + i * 78}" font-family="Caveat" font-weight="700" font-size="60" fill="${C.ink}">${esc(l)}</text>`; });
  for (let i = 0; i < 11; i++) rules += `<line x1="250" y1="${720 + i * 78}" x2="860" y2="${720 + i * 78}" stroke="#b9c7de" stroke-width="2"/>`;
  return `
    <rect width="${W}" height="${H}" fill="url(#gWood)"/>
    <path d="M0 300 L1080 260 M0 820 L1080 780 M0 1340 L1080 1300" stroke="#2e1e15" stroke-width="4" opacity=".35"/>
    <circle cx="820" cy="300" r="560" fill="url(#gLamp)"/>
    <path d="M880 1500 L1080 1360 L1080 1700 Z" fill="#3d4a6b"/>
    <path d="M900 1530 L1080 1420" stroke="#2c3652" stroke-width="10"/>
    <g transform="rotate(-3 550 960) translate(0 ${(1 - easeOut(seg(lt, 0, 0.6))) * 60})">
      <rect x="215" y="480" width="670" height="980" rx="6" fill="${C.cream}" filter="url(#fShadow)"/>
      ${rules}
      <line x1="290" y1="480" x2="290" y2="1460" stroke="#e7a0a0" stroke-width="3"/>
      <rect x="700" y="455" width="150" height="50" rx="8" fill="#fff" opacity=".75" transform="rotate(8 775 480)"/>
      ${out}
    </g>
    <path d="M640 1610 L960 1470" stroke="#3e5486" stroke-width="16" stroke-linecap="round"/>
    <path d="M640 1610 L668 1598" stroke="#d9c7a0" stroke-width="16" stroke-linecap="round"/>
    ${bunny(170, 1700, 1.25)}`;
}

// Моргание: короткие закрытия глаз в заданные моменты.
const blinkAt = (t, times) => times.some(b => t >= b && t < b + 0.14);

// ---------- переписка ----------
function wrap(text, max) {
  const words = String(text).split(' '); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur || !lines.length) lines.push(cur);
  return lines;
}

function chatCard(o) {
  const { y = 230, name = 'Он', status = 'был(а) недавно', msgs = [], input = null, cursor = false, op = 1, sent = null } = o;
  const x = 110, w = 860; let body = '', cy = y + 120;
  for (const m of msgs) {
    const lines = wrap(m.text, 26), lh = 46, bh = lines.length * lh + 28;
    const bw = Math.min(620, Math.max(...lines.map(l => l.length)) * 19.5 + 48);
    const bx = m.me ? x + w - 30 - bw : x + 30;
    const mo = m.op == null ? 1 : m.op;
    body += `<g opacity="${mo}"><rect x="${bx}" y="${cy}" width="${bw}" height="${bh}" rx="22" fill="${m.me ? '#6f8fc4' : '#e8edf7'}"/>`;
    lines.forEach((l, i) => body += `<text x="${bx + 22}" y="${cy + 46 + i * lh}" font-family="Nunito" font-weight="700" font-size="34" fill="${m.me ? '#fff' : '#1d2540'}">${esc(l)}</text>`);
    if (m.me && m.ticks) body += `<text x="${bx + bw - 8}" y="${cy + bh + 26}" text-anchor="end" font-family="Nunito" font-size="22" fill="#7b86a3">${m.ticks}</text>`;
    body += `</g>`;
    cy += bh + (m.me && m.ticks ? 40 : 18);
  }
  let inputSvg = '';
  if (input !== null) {
    const lines = wrap(input, 32); const ih = Math.max(1, lines.length) * 46 + 32;
    inputSvg = `<rect x="${x + 24}" y="${cy + 6}" width="${w - 48}" height="${ih}" rx="${Math.min(32, ih / 2)}" fill="#fff" stroke="#c9d3e8" stroke-width="2"/>`;
    lines.forEach((l, i) => {
      const last = i === lines.length - 1;
      inputSvg += `<text x="${x + 50}" y="${cy + 54 + i * 46}" font-family="Nunito" font-weight="400" font-size="34" fill="#1d2540">${esc(l)}${last && cursor ? '<tspan fill="#5c78a8">|</tspan>' : ''}</text>`;
    });
    cy += ih + 26;
  }
  const h = cy - y + 10;
  return g(`
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="#f5f7fc" opacity=".94" filter="url(#fShadow)"/>
    <circle cx="${x + 62}" cy="${y + 58}" r="28" fill="#5c78a8"/>
    <circle cx="${x + 62}" cy="${y + 50}" r="10" fill="#c9d6ee"/><path d="M${x + 44} ${y + 74} Q${x + 62} ${y + 58} ${x + 80} ${y + 74}" fill="#c9d6ee"/>
    <text x="${x + 106}" y="${y + 52}" font-family="Nunito" font-weight="800" font-size="36" fill="#1d2540">${esc(name)}</text>
    <text x="${x + 106}" y="${y + 84}" font-family="Nunito" font-size="26" fill="#8a93a8">${esc(status)}</text>
    <line x1="${x + 24}" y1="${y + 104}" x2="${x + w - 24}" y2="${y + 104}" stroke="#dde3ef" stroke-width="2"/>
    ${body}${inputSvg}
  `, `opacity="${op}"`);
}

// Вид «от первого лица»: руки держат телефон, комната размыта.
function phonePOV(t) {
  return `
    ${room(t, { blur: 16 })}
    <rect width="${W}" height="${H}" fill="#0b1230" opacity=".25"/>
    <ellipse cx="540" cy="1880" rx="620" ry="420" fill="#3b4f86"/>
    <rect x="345" y="1020" width="390" height="760" rx="56" fill="#1a2036"/>
    <rect x="363" y="1038" width="354" height="724" rx="42" fill="#b4c9ec"/>
    <circle cx="540" cy="1400" r="420" fill="url(#gPhoneGlow)"/>
    <path d="M180 1920 C170 1700 230 1560 330 1520 C390 1500 420 1560 400 1640 L380 1920 Z" fill="${C.skin}"/>
    <path d="M900 1920 C910 1700 850 1560 750 1520 C690 1500 660 1560 680 1640 L700 1920 Z" fill="${C.skin}"/>
    <ellipse cx="372" cy="1500" rx="36" ry="56" fill="${C.skin}" transform="rotate(-20 372 1500)"/>
    <ellipse cx="708" cy="1500" rx="36" ry="56" fill="${C.skin}" transform="rotate(20 708 1500)"/>
    <path d="M120 1920 C140 1800 200 1760 260 1760 L300 1920 Z" fill="${C.sweater}"/>
    <path d="M960 1920 C940 1800 880 1760 820 1760 L780 1920 Z" fill="${C.sweater}"/>`;
}

// ---------- тексты поверх кадра ----------
function thought(text, x, y, op = 1, size = 60) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="${size}" fill="#fff" opacity="${op}" filter="url(#fText)">${esc(text)}</text>`;
}

function watermark() {
  return `<text x="40" y="70" font-family="Nunito" font-weight="700" font-size="32" fill="#fff" opacity=".85" filter="url(#fText)">❄ your nora</text>`;
}

function endCard(t, lt) {
  const a = easeOut(seg(lt, 0, 0.8));
  return `
    <rect width="${W}" height="${H}" fill="url(#gEnd)"/>
    ${snow(t, { n: 60, seed: 99, r: [1.5, 3.5], op: 0.5 })}
    <g opacity="${a}" transform="translate(0 ${(1 - a) * 30})">
      <text x="540" y="930" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="110" fill="#fff">your nora</text>
      <text x="540" y="1020" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="64" fill="#dfe6f7">her little world</text>
      <text x="540" y="1110" text-anchor="middle" font-family="Nunito" font-weight="400" font-size="30" fill="#aab5d2">подпишись, чтобы узнать, что будет дальше</text>
    </g>`;
}

// ---------- субтитры ----------
// Фразы режутся на куски до ~26 символов; слова подсвечиваются по мере произнесения.
// Вариант с точными таймингами слов из озвучки: { words: [['Он', 0.0], ...], end }.
function chunkWords(words) {
  const chunks = []; let cur = [];
  for (const w of words) {
    const txt = [...cur.map(x => x[0]), w[0]].join(' ');
    const last = cur.length ? cur[cur.length - 1][0] : '';
    if (cur.length && (txt.length > 26 || /[.!?…:]»?$/.test(last) || (/[,—]$/.test(last) && cur.map(x => x[0]).join(' ').length > 12))) { chunks.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

function buildCaptions(list) {
  const out = [];
  for (const c of list) {
    if (c.words) {
      const chunks = chunkWords(c.words);
      chunks.forEach((ch, i) => {
        const start = ch[0][1] - 0.08;
        const end = i < chunks.length - 1 ? chunks[i + 1][0][1] - 0.08 : c.end;
        out.push({ start, end, words: ch.map(([w, t]) => ({ w, t })) });
      });
      continue;
    }
    const words = c.text.split(' ');
    const chunks = []; let cur = [];
    for (const w of words) {
      const len = [...cur, w].join(' ').length;
      if (cur.length && (len > 26 || /[.!?…:]$/.test(cur[cur.length - 1]) || (/[,—]$/.test(cur[cur.length - 1]) && cur.join(' ').length > 12))) { chunks.push(cur); cur = []; }
      cur.push(w);
    }
    if (cur.length) chunks.push(cur);
    const total = chunks.reduce((a, ch) => a + ch.join(' ').length + 6, 0);
    let t0 = c.start;
    for (const ch of chunks) {
      const dur = (c.end - c.start) * (ch.join(' ').length + 6) / total;
      const wl = ch.reduce((a, w) => a + w.length + 1, 0);
      let wt = t0; const words = [];
      for (const w of ch) { const d = dur * 0.85 * (w.length + 1) / wl; words.push({ w, t: wt }); wt += d; }
      out.push({ start: t0, end: t0 + dur, words });
      t0 += dur;
    }
  }
  return out;
}

function captionAt(caps, t) {
  const c = caps.find(c => t >= c.start && t < c.end);
  if (!c) return '';
  let spans = '';
  c.words.forEach((w, i) => {
    const on = t >= w.t;
    spans += `<tspan fill="#fff" fill-opacity="${on ? 1 : 0.42}">${esc(w.w)}${i < c.words.length - 1 ? ' ' : ''}</tspan>`;
  });
  return `<text x="540" y="1555" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="50" filter="url(#fText)">${spans}</text>`;
}

// ---------- сборка кадра ----------
function camera(inner, z = 1, px = 0, py = 0) {
  return `<g transform="translate(${540 + px} ${960 + py}) scale(${z}) translate(-540 -960)">${inner}</g>`;
}

function makeEpisode(ep) {
  const caps = buildCaptions(ep.captions);
  const FADE = 0.35;
  window.EPISODE = { duration: ep.duration, captions: caps, title: ep.title };
  window.render = function (t, opts = {}) {
    const idx = ep.scenes.findIndex(s => t >= s.start && t < s.end);
    const i = idx < 0 ? ep.scenes.length - 1 : idx;
    const sc = ep.scenes[i];
    let frame = '';
    const lt = t - sc.start;
    if (i > 0 && lt < FADE && !sc.cut) {
      const prev = ep.scenes[i - 1];
      frame += prev.draw(t, t - prev.start);
      frame += `<g opacity="${ease(lt / FADE).toFixed(3)}">${sc.draw(t, lt)}</g>`;
    } else frame += sc.draw(t, lt);
    let overlay = `<rect width="${W}" height="${H}" fill="url(#gVignette)"/>`;
    if (!sc.noOverlay) overlay += snow(t, { n: 26, seed: 42, r: [1.5, 3], op: 0.45, speed: [25, 55] }) + watermark();
    if (opts.captions) overlay += captionAt(caps, t);
    document.getElementById('stage').innerHTML = DEFS + frame + overlay;
  };
}
