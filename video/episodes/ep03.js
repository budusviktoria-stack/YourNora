// Эпизод 03 — «Почему она перечитывает сообщения по 10 раз?». Сценарий: scripts/ep03-perechityvaet.md
// Тайминги берутся из episodes/ep03.captions.js (CUES — время опорных слов озвучки).

const c = CUES;
const type3 = (text, t, a, b) => text.slice(0, Math.round(text.length * clamp((t - a) / (b - a))));
const blinkOn = t => Math.floor(t * 2.2) % 2 === 0;
const THANKS = 'спасибо за сегодня, было очень тепло ☺';
const ASK = 'ты в порядке? просто «ок.» звучит немного грустно)';
const REPLY = 'ой, я за рулём у папы был, пишу одним пальцем)) мне тоже было очень тепло';
const T_SENT = c.ask + 2.3;            // она отправила вопрос
const T_REPLY = c.diary - 3.0;         // приходит его ответ (в паузе без голоса)
const T_REACT = c.diary - 1.5;         // её реакция крупным планом
const END_VOICE = VOICE_END + 0.6;

// Записка на «доске детектива».
function note(text, x, y, rot, k, tx, ty) {
  if (k <= 0) return '';
  const a = easeOut(k), w = text.length * 25 + 70;
  return `
    <line x1="${x}" y1="${y}" x2="${lerp(x, tx, a)}" y2="${lerp(y, ty, a)}" stroke="#d9534f" stroke-width="5" opacity=".9"/>
    <g transform="translate(${x} ${y}) rotate(${rot}) scale(${0.6 + 0.4 * a})" opacity="${a}">
      <rect x="${-w / 2}" y="-55" width="${w}" height="110" rx="6" fill="${C.cream}" filter="url(#fShadow)"/>
      <circle cx="0" cy="-55" r="12" fill="#d9534f"/>
      <text x="0" y="18" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="54" fill="${C.ink}">${esc(text)}</text>
    </g>`;
}

function detectiveBoard(t, lt) {
  let grid = '';
  for (let i = 0; i < 20; i++) grid += `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}" stroke="#fff" stroke-opacity=".04" stroke-width="2"/><line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}" stroke="#fff" stroke-opacity=".04" stroke-width="2"/>`;
  const pop = easeOut(seg(lt, 0, 0.5));
  const ring = seg(t, c.dot, c.dot + 0.5);
  const bx = 540, by = 960;
  return `
    <rect width="${W}" height="${H}" fill="#151d3b"/>${grid}
    <circle cx="540" cy="960" r="700" fill="url(#gLamp)" opacity=".35"/>
    ${note('почему точка?', 280, 470, -6, seg(t, c.dot, c.dot + 0.5), bx + 60, by)}
    ${note('раньше был смайлик ☺', 640, 330, 5, seg(t, c.smile, c.smile + 0.5), bx, by - 60)}
    ${note('ответил через 12 минут', 520, 1400, -4, seg(t, c.late, c.late + 0.5), bx - 40, by + 60)}
    ${note('значит, не хотел?', 620, 1600, 4, seg(t, c.want - 0.4, c.want + 0.1), bx + 40, by + 70)}
    <g transform="translate(${bx} ${by}) scale(${0.7 + 0.3 * pop})" opacity="${pop}">
      <rect x="-210" y="-120" width="420" height="240" rx="60" fill="#e8edf7" filter="url(#fShadow)"/>
      <text x="0" y="55" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="150" fill="#1d2540">ок.</text>
      <text x="170" y="100" text-anchor="end" font-family="Nunito" font-size="30" fill="#8a93a8">23:14</text>
    </g>
    ${ring > 0 ? `<ellipse cx="${bx + 112}" cy="${by + 42}" rx="${46 * easeOut(ring)}" ry="${40 * easeOut(ring)}" stroke="#d9534f" stroke-width="7" fill="none"/>` : ''}`;
}

function wallClock(cx, cy, r, minutes) {
  const mAng = minutes * 6, hAng = 330 + minutes * 0.5;
  return `
    <circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="#3d4d80"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#eef1f8"/>
    ${[...Array(12).keys()].map(i => { const a = i * Math.PI / 6; return `<line x1="${cx + Math.sin(a) * r * 0.82}" y1="${cy - Math.cos(a) * r * 0.82}" x2="${cx + Math.sin(a) * r * 0.92}" y2="${cy - Math.cos(a) * r * 0.92}" stroke="#4a5b90" stroke-width="6"/>`; }).join('')}
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(hAng * Math.PI / 180) * r * 0.5}" y2="${cy - Math.cos(hAng * Math.PI / 180) * r * 0.5}" stroke="#1d2540" stroke-width="12" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(mAng * Math.PI / 180) * r * 0.78}" y2="${cy - Math.cos(mAng * Math.PI / 180) * r * 0.78}" stroke="#d9534f" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="10" fill="#1d2540"/>`;
}

function blanket() {
  return `<path d="M-40 1380 Q200 1300 420 1360 Q700 1290 1120 1370 L1120 1920 L-40 1920 Z" fill="${C.blanket}"/>
    <path d="M-40 1380 Q200 1300 420 1360 Q700 1290 1120 1370" stroke="#2d3c70" stroke-width="16" fill="none"/>`;
}

function lyingScarf(x, y) {
  return `<path d="M${x} ${y} q120 -40 240 10 q60 30 20 70 q-140 -30 -260 0 Z" fill="#3d4a6b"/>
    <path d="M${x + 250} ${y + 60} l50 90 l40 -20 l-45 -85 Z" fill="#3d4a6b"/>`;
}

function flashback(t, lt) {
  const floats = [['ок.', 220, 520, c.guess], ['ну.', 860, 640, c.guess + 0.3], ['понятно.', 250, 1240, c.guess + 0.6], ['ладно.', 840, 1180, c.guess + 0.9]];
  let fl = '';
  for (const [w, x, y, s] of floats) fl += `<text x="${x}" y="${y - (t - s) * 20}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="64" fill="#5b4a3a" opacity="${0.75 * easeOut(seg(t, s, s + 0.5))}">${esc(w)}</text>`;
  return `
    <g filter="url(#fSepia)">
      <rect width="${W}" height="${H}" fill="#cbbba3"/>
      <rect x="100" y="200" width="160" height="1100" rx="80" fill="#b5a58c" filter="url(#fBlur8)"/>
      <rect x="820" y="200" width="160" height="1100" rx="80" fill="#b5a58c" filter="url(#fBlur8)"/>
      <path d="M${760} 1920 C760 1100 820 700 880 520 C900 420 1010 400 1040 520 C1100 760 1120 1200 1120 1920 Z" fill="#3b3128" opacity=".55" filter="url(#fBlur16)"/>
      ${nora({ x: 500, y: 980, s: 0.85, expr: 'sad', ly: 8, blink: blinkAt(t, [c.past + 2.2]) })}
      <rect x="0" y="1380" width="${W}" height="540" fill="#a89478"/>
      <rect x="300" y="1340" width="180" height="70" rx="8" fill="#efe6d6"/>
      <ellipse cx="660" cy="1385" rx="110" ry="22" fill="#efe6d6"/>
    </g>
    <text x="540" y="380" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="96" fill="#3b2f25" opacity="${0.85 * easeOut(seg(lt, 0.4, 1.0))}">ладно.</text>
    ${fl}
    <rect width="${W}" height="${H}" fill="#000" opacity=".12"/>`;
}

makeEpisode({
  title: 'ep03 — точка',
  duration: END_VOICE + 3.5,
  scenes: [
    { // 1. «ок.» крупно
      start: 0, end: c.bed,
      draw: (t, lt) => `
        ${phonePOV(t)}
        <rect width="${W}" height="${H}" fill="#0b1230" opacity=".35"/>
        ${camera(chatCard({ y: 520, status: 'был(а) в сети 23:14', msgs: [{ text: THANKS, me: true, ticks: '✓✓' }, { text: 'ок.', op: easeOut(seg(lt, 0.3, 0.6)) }] }), lerp(1.1, 1.2, ease(lt / c.bed)), 0, lerp(0, -40, lt / c.bed))}`,
    },
    { // 2. В кровати с телефоном
      start: c.bed, end: c.board,
      draw: (t, lt) => camera(`
        ${room(t, { blur: 3 })}
        ${nora({ x: 540, y: 860, s: 1.15, expr: 'worried', phone: true, ly: 8, blink: blinkAt(t, [c.bed + 1.6, c.bed + 4.0]) })}
        ${blanket()}
        ${lyingScarf(660, 1690)}
        ${bunny(190, 1560, 1.05)}
      `, lerp(1, 1.05, lt / 5)),
    },
    { // 3. Доска детектива
      start: c.board, end: c.brain,
      draw: (t, lt) => camera(detectiveBoard(t, lt), lerp(1.05, 1.0, ease(seg(lt, 0, 9))), Math.sin(t * 1.3) * 6, 0),
    },
    { // 4. Часы бегут
      start: c.brain, end: c.past,
      draw: (t, lt) => {
        const k = ease(seg(t, c.brain + 0.3, c.past - 0.6));
        const mins = 4 + 40 * k;
        return camera(`
          ${room(t, { blur: 8 })}
          ${nora({ x: 540, y: 960, s: 1.3, expr: 'worried', phone: true, ly: 8, blink: blinkAt(t, [c.brain + 2.4, c.fill + 1.2]) })}
          ${blanket()}
          ${wallClock(540, 330, 140, mins)}
          <text x="540" y="560" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="56" fill="#fff" filter="url(#fText)">23:${String(Math.floor(mins)).padStart(2, '0')}</text>
        `, lerp(1, 1.04, lt / 9));
      },
    },
    { // 5. Флешбэк
      start: c.past, end: c.hyper,
      draw: (t, lt) => camera(flashback(t, lt), lerp(1.04, 1.0, lt / 7)),
    },
    { // 6. Гипербдительность
      start: c.hyper, end: c.window,
      draw: (t, lt) => {
        const dart = Math.floor(lt * 2.5) % 3; // взгляд мечется
        return camera(`
          ${room(t, { blur: 16 })}
          ${nora({ x: 540, y: 960, s: 1.75, expr: 'worried', lx: [-10, 10, 0][dart], ly: [0, 4, -4][dart], blink: blinkAt(t, [c.hyper + 3.1]) })}
          ${bunny(170, 1740, 1.2)}
          ${thought('«я опять всё испортила?»', 540, 330, easeOut(seg(lt, 1.2, 1.8)))}
        `, lerp(1, 1.07, ease(lt / 6)));
      },
    },
    { // 7. Окно, со спины
      start: c.window, end: c.ask,
      draw: (t, lt) => camera(`
        <rect width="${W}" height="${H}" fill="url(#gWall)"/>
        ${windowPane(t, 110, 160, 860, 1180, { seed: 9 })}
        ${noraBack({ x: 520, y: 1480, s: 1.15 })}
      `, lerp(1.0, 1.05, lt / 5)),
    },
    { // 8. Спрашивает
      start: c.ask, end: T_REACT,
      draw: (t, lt) => {
        const msgs = [{ text: THANKS, me: true, ticks: '✓✓' }, { text: 'ок.' }];
        let input = type3(ASK, t, c.ask + 0.2, c.ask + 2.0), status = 'был(а) в сети 23:14';
        if (t >= T_SENT) { input = ''; msgs.push({ text: ASK, me: true, ticks: '✓✓', op: easeOut(seg(t, T_SENT, T_SENT + 0.3)) }); status = 'в сети'; }
        if (t >= T_SENT + 0.6 && t < T_REPLY) status = 'печатает…';
        if (t >= T_REPLY) msgs.push({ text: REPLY, op: easeOut(seg(t, T_REPLY, T_REPLY + 0.3)) });
        return `${phonePOV(t)}${chatCard({ y: 150, status, msgs, input: t >= T_REPLY ? null : input, cursor: blinkOn(t) })}`;
      },
    },
    { // 9. Реакция
      start: T_REACT, end: c.diary,
      draw: (t, lt) => camera(`
        ${room(t, { blur: 8 })}
        ${nora({ x: 540, y: 900, s: 1.5, expr: 'happy', tilt: -4 })}
      `, lerp(1.0, 1.05, lt / 1.5)),
    },
    { // 10. Дневник
      start: c.diary, end: END_VOICE,
      draw: (t, lt) => diaryPage(t, lt, ['Точка — это просто', 'точка.', 'Если страшно —', 'спрашивай. ♡'], c.diary + 0.3, VOICE_END - 0.1),
    },
    { // 11. Заставка
      start: END_VOICE, end: END_VOICE + 3.5, noOverlay: true,
      draw: (t, lt) => endCard(t, lt),
    },
  ],
  captions: CAPTIONS,
});
