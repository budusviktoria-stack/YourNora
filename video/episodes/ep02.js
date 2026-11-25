// Эпизод 02 — «Он позвал гулять — и стало страшно». Сценарий: scripts/ep02-vstrecha.md

const INVITE = 'может, в субботу погуляем? ❄';
const CANCEL = 'слушай, давай, наверное, в другой раз…';
const typed = (text, t, a, b) => text.slice(0, Math.round(text.length * clamp((t - a) / (b - a))));
const cursorOn = t => Math.floor(t * 2.2) % 2 === 0;

// Свитера, которые Нора примеряет: [цвет, начало показа]
const SWEATERS = [['#e79bb0', 3.9], ['#c8a27a', 5.1], ['#f2c14e', 6.2], ['#8a8f99', 7.5], ['#8fa3c4', 8.8]];

function heldSweater(color, x, y, k) {
  return g(`
    <path d="M-170 -150 L-60 -190 Q0 -160 60 -190 L170 -150 L260 60 L180 100 L150 0 L150 330 L-150 330 L-150 0 L-180 100 L-260 60 Z" fill="${color}"/>
    <path d="M-60 -190 Q0 -150 60 -190" stroke="#fff" stroke-opacity=".35" stroke-width="12" fill="none"/>
    <path d="M-150 300 L150 300" stroke="#000" stroke-opacity=".1" stroke-width="14"/>
    <ellipse cx="-150" cy="-40" rx="38" ry="52" fill="${C.skin}"/><ellipse cx="150" cy="-40" rx="38" ry="52" fill="${C.skin}"/>
  `, `transform="translate(${x} ${y}) rotate(${Math.sin(k * 3) * 2})"`);
}

function sweaterPile(n) {
  const cols = ['#e79bb0', '#c8a27a', '#f2c14e', '#8a8f99'];
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 160 + (i % 4) * 230 + (i > 3 ? 90 : 0), y = 1760 - Math.floor(i / 4) * 60;
    s += `<ellipse cx="${x}" cy="${y}" rx="150" ry="62" fill="${cols[i % 4]}" transform="rotate(${(i * 37) % 20 - 10} ${x} ${y})"/>`;
  }
  return s;
}

function mug(x, y, t) {
  let steam = '';
  for (let i = 0; i < 3; i++) {
    const ph = t * 1.6 + i * 2.1, o = 0.35 + 0.25 * Math.sin(ph);
    const sx = x - 40 + i * 40;
    steam += `<path d="M${sx} ${y - 120} q-18 -40 0 -80 q18 -40 0 -80" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity="${o.toFixed(2)}" transform="translate(${Math.sin(ph) * 8} ${-(t * 20 % 30)})"/>`;
  }
  return `
    ${steam}
    <path d="M${x + 95} ${y - 60} q70 0 70 60 q0 60 -70 60" stroke="#f1ebe3" stroke-width="22" fill="none"/>
    <path d="M${x - 105} ${y - 95} L${x + 105} ${y - 95} L${x + 92} ${y + 110} Q${x} ${y + 135} ${x - 92} ${y + 110} Z" fill="#f4efe8"/>
    <ellipse cx="${x}" cy="${y - 95}" rx="105" ry="26" fill="#7a4a32"/>
    <rect x="${x - 60}" y="${y - 118}" width="38" height="32" rx="9" fill="#fff"/>
    <rect x="${x - 10}" y="${y - 124}" width="38" height="32" rx="9" fill="#f9d7e0"/>
    <rect x="${x + 34}" y="${y - 114}" width="34" height="30" rx="9" fill="#fff"/>
    <path d="M${x - 80} ${y + 10} L${x + 80} ${y + 10}" stroke="#d9cdbf" stroke-width="10"/>`;
}

function himSilhouette(x, y) {
  return `
    <path d="M${x - 190} 1920 C${x - 200} ${y + 260} ${x - 140} ${y + 140} ${x} ${y + 120} C${x + 140} ${y + 140} ${x + 200} ${y + 260} ${x + 190} 1920 Z" fill="#161d36"/>
    <ellipse cx="${x}" cy="${y}" rx="105" ry="125" fill="#1d2440"/>
    <path d="M${x - 105} ${y - 10} C${x - 110} ${y - 150} ${x + 110} ${y - 150} ${x + 105} ${y - 10} Q${x} ${y - 60} ${x - 105} ${y - 10} Z" fill="#0f1428"/>`;
}

function diary(t, lt) {
  const lines = ['Он помнит, какое какао', 'я люблю.', 'Может, я — не слишком ♡'];
  const full = lines.join('\n');
  const shown = typed(full, t, 45.0, 49.0);
  let y = 0, out = '';
  shown.split('\n').forEach((l, i) => { out += `<text x="330" y="${700 + i * 78}" font-family="Caveat" font-weight="700" font-size="60" fill="${C.ink}">${esc(l)}</text>`; });
  let rules = '';
  for (let i = 0; i < 11; i++) rules += `<line x1="250" y1="${640 + i * 78 + 80}" x2="860" y2="${640 + i * 78 + 80}" stroke="#b9c7de" stroke-width="2"/>`;
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

// Слова озвучки с временем начала (сек), получены распознаванием файла озвучки.
var CAPTIONS = [
  { end: 3.8, words: [['Он', 0.0], ['позвал', 0.18], ['её', 0.62], ['гулять.', 0.84], ['И', 1.7], ['вместо', 1.84], ['радости —', 2.18], ['паника.', 2.98]] },
  { end: 10.1, words: [['Она', 4.1], ['меняет', 4.34], ['свитер', 4.8], ['пятый', 5.22], ['раз.', 5.58], ['Слишком', 6.28], ['яркий.', 6.62], ['Слишком', 7.6], ['скучный.', 7.94], ['Слишком…', 8.88], ['она.', 9.26]] },
  { end: 16.2, words: [['Она', 10.42], ['уже', 10.72], ['почти', 10.92], ['отменила', 11.26], ['встречу.', 11.78], ['Потому', 12.98], ['что', 13.3], ['если', 13.6], ['не', 13.9], ['прийти —', 14.08], ['нельзя', 14.92], ['разочаровать.', 15.16]] },
  { end: 24.3, words: [['Тревога', 16.74], ['перед', 17.2], ['встречей —', 17.38], ['это', 18.28], ['не', 18.3], ['про', 18.42], ['другого', 18.58], ['человека.', 19.02], ['Это', 20.2], ['попытка', 20.4], ['мозга', 20.9], ['защитить', 21.26], ['нас', 21.72], ['от', 21.9], ['отказа,', 22.12], ['которого', 22.84], ['ещё', 23.22], ['не', 23.5], ['было.', 23.74]] },
  { end: 30.9, words: [['Избегание', 24.64], ['успокаивает', 25.26], ['на', 25.88], ['минуту.', 26.08], ['А', 26.58], ['потом', 27.16], ['ты', 27.46], ['остаёшься', 27.62], ['одна —', 28.2], ['с', 28.9], ['тем', 29.04], ['же', 29.16], ['страхом', 29.32], ['и', 29.84], ['без', 29.98], ['шанса.', 30.16]] },
  { end: 35.4, words: [['В', 31.2], ['субботу', 31.34], ['она', 31.74], ['всё-таки', 31.92], ['пришла.', 32.36], ['В', 33.34], ['том', 33.38], ['самом', 33.52], ['«скучном»', 33.9], ['свитере.', 34.48]] },
  { end: 41.0, words: [['А', 35.68], ['он', 35.8], ['принёс', 35.96], ['ей', 36.36], ['какао', 36.44], ['с', 36.9], ['маршмеллоу.', 36.98], ['Она', 38.02], ['упоминала', 38.2], ['о', 38.8], ['нём', 38.96], ['один', 39.06], ['раз.', 39.3], ['Месяц', 39.92], ['назад.', 40.36]] },
  { end: 43.9, words: [['Иногда', 41.22], ['тебя', 41.56], ['видят', 41.78], ['лучше,', 42.2], ['чем', 42.58], ['ты', 42.7], ['сама', 42.88], ['себя.', 43.1]] },
  { end: 49.9, words: [['Из', 44.18], ['дневника', 44.3], ['Норы:', 44.78], ['«Он', 45.24], ['помнит,', 45.8], ['какое', 46.36], ['какао', 46.54], ['я', 47.12], ['люблю.', 47.24], ['Может,', 47.98], ['я', 48.22], ['не', 48.56], ['слишком».', 48.94]] },
];

makeEpisode({
  title: 'ep02 — он позвал гулять',
  duration: 53.5,
  scenes: [
    { // 1. Приглашение
      start: 0, end: 3.9,
      draw: (t, lt) => camera(`
        ${room(t, { blur: 3 })}
        ${nora({ x: 540, y: 820, s: 1.25, expr: lt < 1.6 ? 'surprised' : 'worried', phone: true, ly: 6, blink: blinkAt(t, [2.5]) })}
        ${chatCard({ y: lerp(-300, 200, easeOut(seg(lt, 0.15, 0.6))), status: 'в сети', msgs: [{ text: INVITE }] })}
      `, lerp(1, 1.05, lt / 3.9)),
    },
    { // 2. Примерка свитеров
      start: 3.9, end: 10.2,
      draw: (t, lt) => {
        let col = SWEATERS[0][0];
        for (const [c, s] of SWEATERS) if (t >= s) col = c;
        const swap = SWEATERS.find(([, s]) => t >= s && t < s + 0.18);
        const dy = swap ? 40 : 0;
        const pile = SWEATERS.filter(([, s]) => t >= s + 1.2).length;
        let th = '';
        if (t > 6.3) th += thought('этот слишком яркий', 540, 330, easeOut(seg(t, 6.3, 6.7)));
        if (t > 7.6) th += thought('этот слишком скучный', 540, 410, easeOut(seg(t, 7.6, 8.0)));
        if (t > 8.9) th += thought('а если я ему не понравлюсь', 540, 500, easeOut(seg(t, 8.9, 9.3)), 56) + thought('вживую?', 540, 560, easeOut(seg(t, 8.9, 9.3)), 56);
        return camera(`
          ${room(t, { blur: 3 })}
          ${nora({ x: 540, y: 860, s: 1.0, expr: 'worried', lx: -4, blink: blinkAt(t, [5.6, 9.6]) })}
          ${heldSweater(col, 540, 1330 + dy, t)}
          ${sweaterPile(pile)}
          ${th}
        `, lerp(1.02, 1.0, lt / 6.3));
      },
    },
    { // 3. Почти отменила
      start: 10.2, end: 16.4,
      draw: (t, lt) => `
        ${phonePOV(t)}
        ${chatCard({ y: 230, status: 'был(а) недавно', msgs: [{ text: INVITE }], input: typed(CANCEL, t, 10.5, 13.6), cursor: cursorOn(t) })}`,
    },
    { // 4. Мысль, крупный план
      start: 16.4, end: 24.3,
      draw: (t, lt) => camera(`
        ${room(t, { blur: 16 })}
        ${nora({ x: 540, y: 900, s: 1.9, expr: 'worried', ly: 4, lx: lerp(-6, 4, seg(lt, 2, 6)), blink: blinkAt(t, [19.6, 22.6]) })}
        ${thought('«пока он меня не видит,', 540, 290, easeOut(seg(t, 17.0, 17.6)))}
        ${thought('я ему нравлюсь»', 540, 360, easeOut(seg(t, 17.3, 17.9)))}
      `, lerp(1, 1.08, ease(lt / 7.9))),
    },
    { // 5. Стирает и отправляет «давай)»
      start: 24.3, end: 30.9,
      draw: (t, lt) => {
        let input = CANCEL, msgs = [{ text: INVITE }];
        if (t >= 24.6) input = CANCEL.slice(0, Math.round(CANCEL.length * (1 - seg(t, 24.6, 25.9))));
        if (t >= 26.2) input = typed('давай)', t, 26.2, 27.0);
        if (t >= 27.6) { input = ''; msgs = [{ text: INVITE }, { text: 'давай)', me: true, ticks: t > 28.4 ? '✓✓' : '✓', op: easeOut(seg(t, 27.6, 27.9)) }]; }
        return `
          ${phonePOV(t)}
          ${chatCard({ y: 230, status: 'был(а) недавно', msgs, input, cursor: cursorOn(t) })}`;
      },
    },
    { // 6. Суббота, улица
      start: 30.9, end: 35.5,
      draw: (t, lt) => camera(`
        ${street(t, { blur: 3 })}
        ${snow(t, { n: 80, seed: 3, r: [3, 7], speed: [60, 120], op: 0.8 })}
        ${himSilhouette(lerp(1300, 930, easeOut(seg(lt, 1.0, 3.2))), 1250)}
        ${nora({ x: 450, y: 880 + Math.sin(t * 5) * 6, s: 1.05, expr: lt < 3.0 ? 'neutral' : 'smile', scarf: '#e9dcc8', lx: lt > 2.6 ? 8 : 0, blink: blinkAt(t, [32.4]) })}
      `, lerp(1.0, 1.06, lt / 4.6), lerp(20, -20, lt / 4.6)),
    },
    { // 7. Кафе, какао
      start: 35.5, end: 41.0,
      draw: (t, lt) => {
        const mx = lerp(1300, 600, easeOut(seg(lt, 0.3, 1.4)));
        const handX = lerp(mx, 1400, ease(seg(lt, 1.7, 2.4)));
        const expr = lt < 1.6 ? 'neutral' : lt < 4.4 ? 'surprised' : 'smile';
        return camera(`
          ${cafe(t, { blur: 3 })}
          ${nora({ x: 540, y: 820, s: 1.12, expr, ly: lt < 1.6 ? 10 : 0, blink: blinkAt(t, [39.6]) })}
          <rect x="0" y="1250" width="${W}" height="670" fill="#3e2a1f"/>
          <rect x="0" y="1250" width="${W}" height="24" fill="#5a3d2b"/>
          ${mug(mx, 1320, t)}
          <path d="M${handX + 90} 1290 L1200 1230 L1200 1410 L${handX + 90} 1390 Z" fill="#161d36"/>
          <ellipse cx="${handX + 100}" cy="1340" rx="50" ry="40" fill="${C.skin}"/>
          ${thought('«я говорила об этом один раз…', 540, 300, easeOut(seg(t, 38.1, 38.7)), 56)}
          ${thought('месяц назад»', 540, 370, easeOut(seg(t, 39.8, 40.4)), 56)}
        `, lerp(1.0, 1.05, lt / 5.5));
      },
    },
    { // 8. Его шарф
      start: 41.0, end: 44.0,
      draw: (t, lt) => camera(`
        ${street(t, { blur: 8 })}
        ${snow(t, { n: 70, seed: 8, r: [3, 8], speed: [50, 100], op: 0.8 })}
        ${nora({ x: 540, y: 900, s: 1.55, expr: lt < 1.4 ? 'smile' : 'happy', scarf: '#3d4a6b', scarfUp: ease(seg(lt, 1.4, 2.1)), tilt: lt > 1.6 ? -3 : 0, blink: blinkAt(t, [41.8]) })}
      `, lerp(1.0, 1.06, lt / 3.0)),
    },
    { // 9. Дневник
      start: 44.0, end: 50.0,
      draw: (t, lt) => diary(t, lt),
    },
    { // 10. Заставка
      start: 50.0, end: 53.5, noOverlay: true,
      draw: (t, lt) => endCard(t, lt),
    },
  ],
  captions: CAPTIONS,
});
