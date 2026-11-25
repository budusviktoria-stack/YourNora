// Рендер эпизода в mp4.
//   node render.mjs ep02                         → out/ep02.mp4 (с субтитрами) и out/ep02-clean.mp4 (без)
//   node render.mjs ep02 --audio voice.wav       → то же, с наложенной озвучкой
//   node render.mjs ep02 --stills 1,5.5,20       → PNG-кадры для проверки
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const ep = args[0] || 'ep02';
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const FPS = Number(opt('--fps') || 30);
const outDir = path.resolve(opt('--out') || path.join(here, 'out'));
mkdirSync(outDir, { recursive: true });
const url = 'file://' + path.join(here, 'page.html') + '?ep=' + ep;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await page.goto(url);
  await page.waitForFunction(() => window.ready === true);
  return page;
}

function ffmpeg(argv) {
  const p = spawn('ffmpeg', ['-v', 'error', '-y', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  return { p, done };
}

const write = (stream, buf) => new Promise(res => stream.write(buf) ? res() : stream.once('drain', res));

const browser = await chromium.launch();
const stills = opt('--stills');
if (stills) {
  const page = await openPage(browser);
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.render(t, { captions: true }), t);
    await page.locator('#stage').screenshot({ path: path.join(outDir, `${ep}-t${t}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const duration = await (await openPage(browser)).evaluate(() => window.EPISODE.duration);
const total = Math.round(duration * FPS);
const workers = Number(opt('--workers') || Math.max(1, Math.min(4, os.cpus().length - 1)));
const tmp = path.join(outDir, `.${ep}-parts`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const enc = file => ['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', file];

let doneFrames = 0;
async function work(w) {
  const from = Math.floor(total * w / workers), to = Math.floor(total * (w + 1) / workers);
  const page = await openPage(browser);
  const subs = ffmpeg(enc(path.join(tmp, `subs-${w}.mp4`)));
  const clean = ffmpeg(enc(path.join(tmp, `clean-${w}.mp4`)));
  for (let f = from; f < to; f++) {
    const t = f / FPS;
    await page.evaluate(t => window.render(t, { captions: false }), t);
    await write(clean.p.stdin, await page.locator('#stage').screenshot({ type: 'jpeg', quality: 92 }));
    await page.evaluate(t => window.render(t, { captions: true }), t);
    await write(subs.p.stdin, await page.locator('#stage').screenshot({ type: 'jpeg', quality: 92 }));
    if (++doneFrames % 150 === 0) console.log(`${doneFrames}/${total} кадров`);
  }
  subs.p.stdin.end(); clean.p.stdin.end();
  await Promise.all([subs.done, clean.done]);
}
await Promise.all([...Array(workers).keys()].map(work));
await browser.close();

const audio = opt('--audio');
for (const kind of ['subs', 'clean']) {
  const list = path.join(tmp, `${kind}.txt`);
  writeFileSync(list, [...Array(workers).keys()].map(w => `file '${kind}-${w}.mp4'`).join('\n'));
  const name = kind === 'subs' ? `${ep}.mp4` : `${ep}-clean.mp4`;
  const a = audio ? ['-i', path.resolve(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-shortest'] : [];
  const { done } = ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, ...a, '-c:v', 'copy', '-movflags', '+faststart', path.join(outDir, name)]);
  await done;
}
rmSync(tmp, { recursive: true, force: true });
console.log('готово:', outDir);
