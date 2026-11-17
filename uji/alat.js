// Alat uji Studio Pribadi: jawaban AI tiruan (diambil dari harness Sugi) + GitHub raw diarahkan ke file lokal
const pw = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const H = fs.readFileSync('/home/claude/sugi-studio-dapur/test/harness.js', 'utf8');
const TINY = fs.readFileSync('/home/claude/sugi-studio-dapur/test/tiny.b64', 'utf8').trim();
const kode = H.slice(H.indexOf('function storyboard'), H.indexOf('async function newPage'));
const mockText0 = new Function(kode + '; return mockText;')();
function mockText(sys, user) {
    if (/\{"ide":\[\{"judul"/.test(sys) && /"format"/.test(sys)) return JSON.stringify({ ide: [1, 2, 3].map(i => ({ judul: 'Ide akun ' + i, format: i === 2 ? 'tips' : 'tutorial', ringkasan: 'Ringkasan ide ' + i + '.', hook: 'Kalimat pembuka ' + i })) });
    return mockText0(sys, user);
}
const SUGI = process.env.SUGIMATION || '/home/claude/sugimation', SP = require('path').resolve(__dirname, '..');
async function halaman(browser, log, opsi = {}) {
    const page = await browser.newPage({ viewport: opsi.viewport || { width: 412, height: 734 } });
    page.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    page.on('dialog', d => { log.push('DIALOG ' + d.message()); d.dismiss(); });
    global.prompts = [];
    await page.route('**/raw.githubusercontent.com/**', async route => {
        const u = new URL(route.request().url());
        let m = u.pathname.match(/^\/elhabsyihauto-ai\/Sugimation\/main\/(.+)$/), f = null;
        if (m) f = path.join(SUGI, m[1]);
        m = u.pathname.match(/^\/elhabsyihauto-ai\/studio-pribadi\/main\/(.+)$/);
        if (m) f = path.join(SP, m[1]);
        if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: '404: Not Found' });
        const tipe = f.endsWith('.jpg') ? 'image/jpeg' : 'text/plain; charset=utf-8';
        return route.fulfill({ status: 200, contentType: tipe, body: fs.readFileSync(f) });
    });
    await page.route('**/generativelanguage.googleapis.com/**', async route => {
        const body = JSON.parse(route.request().postData() || '{}');
        const isImg = body.generationConfig && (body.generationConfig.responseModalities || []).includes('IMAGE');
        const sys = (body.systemInstruction && body.systemInstruction.parts[0].text) || '';
        const user = (body.contents[0].parts.find(p => p.text) || {}).text || '';
        global.prompts.push({ sys, user, img: isImg, refs: body.contents[0].parts.filter(p => p.inlineData).length });
        if (isImg) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: TINY } }] } }] }) });
        await new Promise(r => setTimeout(r, 20));
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: mockText(sys, user) }] } }] }) });
    });
    await page.goto('file://' + SP + '/' + (opsi.file || 'pemanggil-studio-pribadi.html'));
    return page;
}
let lulus = 0, gagal = 0;
function cek(ok, nama, info) { if (ok) { lulus++; console.log('✓ ' + nama); } else { gagal++; console.log('✗ ' + nama + (info ? ' :: ' + info : '')); } }
function ringkas() { console.log(`\n${lulus} lolos, ${gagal} gagal`); return gagal; }
async function bingkai(page) { const h = await page.$('#sp-bingkai iframe.kini'); return h ? await h.contentFrame() : null; }
module.exports = { pw, halaman, cek, ringkas, bingkai };
