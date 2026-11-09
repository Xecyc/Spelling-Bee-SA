// Browser end-to-end test: a "PC" and a "phone" in separate browser contexts.
// Setup once:  npm i -D playwright && npx playwright install chromium
// Run:         npm run build && npm start   (in one terminal)   then   npm run e2e
// Optional:    BASE=http://192.168.1.42:3000 npm run e2e
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const OUT = process.env.E2E_OUT || 'e2e/screenshots';
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 10000) { const t = Date.now(); while (Date.now() - t < ms) { try { if (await fn()) return true; } catch {} await sleep(100); } return false; }

import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
// Two separate contexts = two devices: no shared localStorage, no shared BroadcastChannel.
const pcCtx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pc = await pcCtx.newPage();
const phone = await phoneCtx.newPage();
pc.on('pageerror', (e) => console.log('  [pc pageerror]', e.message));
phone.on('pageerror', (e) => console.log('  [phone pageerror]', e.message));

// --- 0. phone alone: server reachable, but nobody is on stage
await phone.goto(`${BASE}/?view=remote`);
check('phone shows warning when no stage is open', await until(async () => (await phone.getByText('No stage screen is open').count()) > 0));
await phone.screenshot({ path: `${OUT}/01-phone-no-stage.png` });

// --- 1. open stage on the "PC"
await pc.goto(`${BASE}/`);
await sleep(1500);
check('warning disappears once the stage is open', await until(async () => (await phone.getByText('No stage screen is open').count()) === 0));
await pc.screenshot({ path: `${OUT}/02-pc-stage-start.png` });

// --- 2. SPIN WHEEL from the phone
await phone.getByRole('button', { name: /spin wheel/i }).tap();
check('phone toast confirms delivery', await until(async () => (await phone.getByText('Spin wheel sent').count()) > 0, 3000));
check('phone button flips to Spinning...', await until(async () => (await phone.getByText('Spinning...').count()) > 0, 3000));
await sleep(1500);
await pc.screenshot({ path: `${OUT}/03-pc-spinning.png` });
// stage winner modal appears after ~6.5s; phone shows the chosen word
check('wheel finished: phone shows WORD CHOSEN', await until(async () => (await phone.getByText('Word Chosen', { exact: false }).count()) > 0, 15000));
const word = (await phone.locator('h2').first().innerText()).trim();
check('phone shows the chosen word', word.length > 0 && word !== 'READY FOR WORD', `word=${word}`);
check('same word is on the PC stage modal', await until(async () => (await pc.getByText(word, { exact: true }).count()) > 0, 5000));
await pc.screenshot({ path: `${OUT}/04-pc-word-modal.png` });
await phone.screenshot({ path: `${OUT}/05-phone-word-chosen.png` });

// --- 3. timer controls
const stageTime = async () => (await pc.getByText(/^\d\d:\d\d$/).first().innerText()).trim();
const t0 = await stageTime();
await phone.getByRole('button', { name: /start \d+s timer/i }).tap();
await sleep(2600);
const t1 = await stageTime();
check('START timer: stage countdown runs', t1 !== t0, `${t0} -> ${t1}`);
await phone.getByRole('button', { name: /pause timer/i }).first().tap();
await sleep(400);
const p1 = await stageTime(); await sleep(2200); const p2 = await stageTime();
check('STOP timer: stage countdown freezes', p1 === p2, `${p1} == ${p2}`);
await phone.getByTitle('Reset Timer').tap();
await sleep(600);
const r1 = await stageTime();
check('RESET timer: stage back to full time', r1 === t0, `${r1} vs ${t0}`);

// --- 4. CLOSE
await phone.getByRole('button', { name: /^close$/i }).tap();
check('CLOSE: modal gone from stage', await until(async () => (await pc.getByText(word, { exact: true }).count()) === 0, 4000));

// --- 5. spin again, STOP SPIN, then REMOVE WORD
await sleep(2200);
await phone.getByRole('button', { name: /spin wheel/i }).tap();
await sleep(1200);
await phone.getByRole('button', { name: /stop spin/i }).tap();
check('STOP SPIN: a word is chosen immediately', await until(async () => (await phone.getByText('Word Chosen', { exact: false }).count()) > 0, 4000));
const word2 = (await phone.locator('h2').first().innerText()).trim();
await phone.getByRole('button', { name: /remove word/i }).tap();
check('REMOVE WORD: modal gone from stage', await until(async () => (await pc.getByText(word2, { exact: true }).count()) === 0, 4000));

// --- 6. a stray STOP tap while idle must NOT pop a word
await phone.getByRole('button', { name: /stop spin/i }).tap();
await sleep(1200);
check('idle STOP does nothing on stage', (await phone.getByText('Word Chosen', { exact: false }).count()) === 0);

// --- 7. PODIUM
await phone.getByText('Podium Menu').tap();
await phone.getByPlaceholder('e.g. Sofia Rodriguez').fill('Sofia Rodriguez');
await phone.getByPlaceholder('e.g. Mateo Gonzalez').fill('Mateo Gonzalez');
await phone.getByPlaceholder('e.g. Camila Perez').fill('Camila Perez');
await phone.getByRole('button', { name: /push to stage/i }).tap();
check('PUSH TO STAGE: stage switches to podium with the names', await until(async () => (await pc.getByText('Sofia Rodriguez').count()) > 0 && (await pc.getByText('Camila Perez').count()) > 0, 6000));
await sleep(3500);
await pc.screenshot({ path: `${OUT}/06-pc-podium.png` });
await phone.screenshot({ path: `${OUT}/07-phone-podium.png` });
await phone.getByRole('button', { name: /clear board/i }).tap();
check('CLEAR BOARD: names removed from stage', await until(async () => (await pc.getByText('Sofia Rodriguez').count()) === 0, 4000));

// --- 8. refreshing the stage must NOT replay old spins
await pc.reload(); await sleep(2500);
check('stage reload does not auto-spin or pop old words', (await pc.locator('[role=dialog], .fixed.inset-0.z-50').count()) === 0);

// --- 9. server dies: phone says so instead of silently doing nothing
const dead = await phoneCtx.newPage();
await dead.goto(`${BASE}/?view=remote`); await sleep(1500);
await dead.context().setOffline(true);
await dead.getByRole('button', { name: /spin wheel/i }).tap();
check('offline: tap reports NOT sent', await until(async () => (await dead.getByText('was NOT sent', { exact: false }).count()) > 0, 6000));
check('offline: red banner shown', await until(async () => (await dead.getByText("Can't reach the stage server", { exact: false }).count()) > 0, 6000));
await dead.screenshot({ path: `${OUT}/08-phone-offline.png` });
await dead.context().setOffline(false);
check('back online: banner clears by itself', await until(async () => (await dead.getByText("Can't reach the stage server", { exact: false }).count()) === 0, 15000));

await browser.close();
console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL E2E CHECKS PASSED');
process.exit(failed ? 1 : 0);
