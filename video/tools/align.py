"""Тайминги субтитров для эпизода.

Текст озвучки лежит в episodes/<ep>.voice.txt: одна строка = одна фраза субтитров.
Слово с меткой {имя} становится «опорной точкой» сцены: в коде эпизода её время берётся через cue('имя').

  python3 tools/align.py ep03                      # оценка таймингов без озвучки
  python3 tools/align.py ep03 words.json           # точные тайминги по распознанной озвучке

words.json — список {"w": слово, "s": начало, "e": конец} (см. tools/stt.py).
Результат пишется в episodes/<ep>.captions.js.
"""
import difflib, json, re, sys, os

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ep = sys.argv[1]
words_json = sys.argv[2] if len(sys.argv) > 2 else None

groups = []  # [[(слово, метка|None), ...], ...]
gap_before = {}  # индекс фразы -> пауза (с), вставляемая в озвучку перед ней
for line in open(os.path.join(here, 'episodes', ep + '.voice.txt'), encoding='utf8'):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    m = re.match(r'^\[пауза ([\d.]+)\]$', line)
    if m:
        gap_before[len(groups)] = gap_before.get(len(groups), 0) + float(m.group(1))
        continue
    toks = []
    for raw in line.split():
        m = re.match(r'^(.*?)\{(\w+)\}(.*)$', raw)
        toks.append((m.group(1) + m.group(3), m.group(2)) if m else (raw, None))
    # «—» приклеивается к предыдущему слову, как в субтитрах референса
    merged = []
    for w, c in toks:
        if w == '—' and merged:
            merged[-1] = (merged[-1][0] + ' —', merged[-1][1])
        else:
            merged.append((w, c))
    groups.append(merged)

norm = lambda s: re.sub(r'[^0-9a-zа-я]', '', s.lower().replace('ё', 'е'))
flat = [(gi, wi, w, c) for gi, g in enumerate(groups) for wi, (w, c) in enumerate(g)]
est_len = lambda w: 0.12 + 0.058 * len(norm(w))

times = [None] * len(flat)
if words_json:
    rec = json.load(open(words_json, encoding='utf8'))
    a = [norm(w) for _, _, w, _ in flat]
    b = [norm(r['w']) for r in rec]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                times[i1 + k] = rec[j1 + k]['s']
        elif tag == 'replace':
            # слово распознано иначе или разбито на части: раскладываем по порядку
            for k in range(i2 - i1):
                j = j1 + round(k * (j2 - j1) / max(1, i2 - i1))
                times[i1 + k] = rec[min(j, j2 - 1)]['s']
    voice_end = rec[-1]['e'] if rec else 0
    # пропуски — интерполяция между соседями
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[k] for k in range(i - 1, -1, -1) if times[k] is not None), 0.0)
            nxt_i = next((k for k in range(i + 1, len(times)) if times[k] is not None), None)
            nxt = times[nxt_i] if nxt_i is not None else voice_end
            gap = (nxt_i - i + 1) if nxt_i is not None else 2
            times[i] = prev + (nxt - prev) / gap
else:
    t, prev_g = 0.0, 0
    for i, (gi, wi, w, c) in enumerate(flat):
        if gi != prev_g:
            t += 0.5 + gap_before.get(gi, 0)
            prev_g = gi
        times[i] = round(t, 2)
        t += est_len(w) + (0.35 if re.search(r'[.!?…:]»?$', w) else 0.12 if w.endswith(',') or w.endswith('—') else 0)
    voice_end = t

audio_gaps = []
if words_json:
    # сдвигаем всё после паузы; в озвучку тишина вставляется при рендере
    shift, i = 0.0, 0
    for gi, g in enumerate(groups):
        if gi in gap_before:
            cut = times[i] - 0.12
            audio_gaps.append([round(cut, 2), gap_before[gi]])
            shift += gap_before[gi]
        for _ in g:
            times[i] += shift
            i += 1
    voice_end += shift

caps, cues, i = [], {}, 0
for gi, g in enumerate(groups):
    ws = []
    for (w, c) in g:
        ws.append([w, round(times[i], 2)])
        if c:
            cues[c] = round(times[i], 2)
        i += 1
    last = ws[-1]
    end = last[1] + est_len(last[0]) + 0.5
    if i < len(flat):
        end = min(end, times[i] - 0.1)
    caps.append({'end': round(end, 2), 'words': ws})
    cues['g%d' % gi] = ws[0][1]

out = os.path.join(here, 'episodes', ep + '.captions.js')
with open(out, 'w', encoding='utf8') as f:
    f.write('// Сгенерировано tools/align.py — не править руками.\n')
    f.write('// Источник: %s\n' % ('распознанная озвучка' if words_json else 'оценка без озвучки'))
    f.write('var VOICE_END = %.2f;\n' % voice_end)
    f.write('var AUDIO_GAPS = %s;\n' % json.dumps(audio_gaps))
    f.write('var CUES = %s;\n' % json.dumps(cues, ensure_ascii=False))
    f.write('var CAPTIONS = [\n')
    for c in caps:
        f.write('  ' + json.dumps(c, ensure_ascii=False) + ',\n')
    f.write('];\n')
print('записано', out, '— длительность озвучки %.1f с, меток: %d' % (voice_end, len(cues)))
