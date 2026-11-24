// Uji SP23: masuk dengan kode pribadi, gambar acuan per proyek, Character Sheet figur disimpan sekali lalu dipakai lagi.
const { pw, halaman, cek, ringkas, bingkai } = require('./alat');
const ADMIN = { email: 'admin@contoh.id', sandi: 'rahasia123', uid: 'UIDADMIN' };
const KODE = { email: 'suhu-abc234@anggota.sugistudio.app', sandi: 'SUHU-ABC234', uid: 'UIDSUHU' };   // member aktif
const db = {};
function pasangFirebase(page) {
  return page.route(/identitytoolkit|firestore\.googleapis|securetoken/, async route => {
    const req = route.request(), u = new URL(req.url()), m = req.method();
    const balas = (st, j) => route.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(j) });
    if (/signInWithPassword/.test(u.pathname)) {
      const b = JSON.parse(req.postData() || '{}');
      const a = [ADMIN, KODE].find(x => x.email === b.email && x.sandi === b.password);
      if (!a) return balas(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
      return balas(200, { idToken: 'TOK-' + a.uid, refreshToken: 'REF-' + a.uid, localId: a.uid, email: a.email, expiresIn: '3600' });
    }
    if (/securetoken/.test(u.host)) { const r = /refresh_token=REF-(\w+)/.exec(req.postData() || ''); return r ? balas(200, { id_token: 'TOK-' + r[1], refresh_token: 'REF-' + r[1], expires_in: '3600' }) : balas(400, {}); }
    const uid = ((req.headers()['authorization'] || '').match(/Bearer TOK-(\w+)/) || [])[1];
    const jalur = decodeURIComponent(u.pathname.split('/documents/')[1] || '');
    const pemilik = (jalur.match(/^pengguna\/(\w+)\//) || [])[1];
    if (!uid || uid !== pemilik) return balas(403, { error: { status: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } });
    if (m === 'GET') {
      const docs = Object.keys(db).filter(k => k.startsWith(jalur + '/') && !k.slice(jalur.length + 1).includes('/')).map(k => ({ name: 'projects/sugi-studio-ai/databases/(default)/documents/' + k, fields: db[k] }));
      return balas(200, docs.length ? { documents: docs } : {});
    }
    if (m === 'PATCH') { db[jalur] = JSON.parse(req.postData()).fields; return balas(200, { name: jalur, fields: db[jalur] }); }
    if (m === 'DELETE') { delete db[jalur]; return balas(200, {}); }
    return balas(400, {});
  });
}
const T = (fr, txt) => fr.locator(`#app-container button:has-text("${txt}")`).first();
const judul = async fr => (await fr.locator('#app-container h2').first().textContent()).trim();
async function tungguBingkai(page) {
  await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap && !document.querySelector('#sp-muat[style*="flex"]'); }, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  return bingkai(page);
}
async function keRingkasan(fr) {
  for (let k = 0; k < 18; k++) {
    const t = await judul(fr); if (t === 'Ringkasan') return;
    const dur = fr.locator('button', { hasText: /^\s*15\s*detik/ }); if (await dur.count()) { await dur.first().click(); continue; }
    if (/Pembuka/.test(t)) { const bb = fr.locator('#app-container button:has-text("Biarkan AI")'); if (await bb.count()) { await bb.first().click(); continue; } }
    const cepat = fr.locator('#app-container button:has-text("Cepat")'); if (await cepat.count()) { await cepat.first().click(); continue; }
    await fr.locator('#app-container button:has-text("Lanjut")').last().click(); await fr.waitForTimeout(150);
  }
}
async function buatVideo(page, ide) {
  await page.evaluate(() => SP.buka('akun', { akun: 'a4' }));
  await page.click('.pilih:has-text("Tutorial 1 menit")');
  await page.fill('#sp-ide', ide);
  await page.click('button:has-text("Mulai buat video")');
  const fr = await tungguBingkai(page);
  await fr.click('#sp-pem-lanjut').catch(() => { });
  await fr.click('#sp-lok-lanjut').catch(() => { });
  await fr.waitForTimeout(300);
  await fr.locator('#app-container button:has-text("Lanjut")').last().click().catch(() => { });
  await keRingkasan(fr);
  await fr.click('button:has-text("Sutradarai Videoku")');
  await fr.waitForFunction(() => !isProcessingQueue && phaseQcText.length > 0, null, { timeout: 150000 });
  return fr;
}
(async () => {
  const b = await pw.chromium.launch(); const log = [];
  const page = await halaman(b, log);
  await pasangFirebase(page);
  await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  cek(await page.locator('.awan-belum:has-text("Belum tersimpan ke akun") button:has-text("Masuk")').count() === 1, 'Beranda: kotak belum masuk lebih menonjol + tombol Masuk');
  // (a) masuk dengan kode
  await page.click('.awan button:has-text("Masuk")');
  cek(await page.locator('.chip.on:has-text("Kode pribadi")').count() === 1 && await page.locator('#sp-kode-masuk').count() === 1, 'Halaman Masuk: kode pribadi jadi pilihan utama');
  await page.fill('#sp-kode-masuk', 'suhu abc999'); await page.click('#sp-masuk-btn');
  await page.waitForSelector('#sp-masuk-st .peringatan', { timeout: 5000 });
  cek(/Kode tidak dikenal/.test(await page.innerText('#sp-masuk-st')), 'Kode salah: pesan jelas');
  await page.fill('#sp-kode-masuk', 'suhu abc234'); await page.click('#sp-masuk-btn');
  await page.waitForSelector('text=Simpan otomatis aktif', { timeout: 5000 });
  cek(/Kode SUHU-ABC234/.test(await page.innerText('#sp-isi')), 'Masuk dengan kode (huruf kecil + spasi dirapikan): kode tampil di kotak simpan otomatis');
  await page.evaluate(() => SP.buka('beranda'));

  // (b) + (c) video pertama: Character Sheet dibuat lalu tersimpan
  let fr = await buatVideo(page, 'Cara bikin video bicara dari satu foto');
  const cs = await fr.evaluate(() => { const it = getImgItems().find(x => x.group === 'cs'); return it && { key: it.key, name: it.name, photo: it.photo }; });
  cek(!!cs, 'Video pertama: ada item Character Sheet', JSON.stringify(cs));
  await fr.evaluate(k => makeImage(k), cs.key);
  await fr.waitForFunction(k => !!imgStore[k], cs.key, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const pid = await fr.evaluate(() => String(currentProjectId));
  const kAset = Object.keys(db).find(k => k.startsWith('pengguna/UIDSUHU/pribadi/kreator_' + pid + '/aset/'));
  cek(!!kAset && db[kAset].group.stringValue === 'cs', 'SP23b gambar Character Sheet tersimpan per proyek di akun kode', Object.keys(db).join(' | '));
  const kFig = Object.keys(db).find(k => k.startsWith('pengguna/UIDSUHU/figur/sugi_hoodie_foto_'));
  cek(!!kFig, 'SP23c Character Sheet Fikri (hoodie, foto resmi) tersimpan per figur', Object.keys(db).filter(k => /figur/.test(k)).join(' | '));
  cek(!Object.keys(db).some(k => /UIDADMIN/.test(k)), 'Disimpan di akun kode sendiri, bukan akun admin');
  await page.waitForTimeout(3500);
  cek(!!db['pengguna/UIDSUHU/pribadi/kreator_' + pid], 'Teks proyek juga tersimpan (SP16 dengan akun kode)');

  // video kedua: sheet figur dipasang otomatis tanpa membuat ulang
  await page.click('#sp-tab .tab:has-text("Beranda")');
  global.prompts = [];
  fr = await buatVideo(page, 'Cara pakai gambar awal supaya video AI rapi');
  await fr.waitForFunction(() => (window.__spFigurTerpasang || 0) > 0, null, { timeout: 8000 }).catch(() => { });
  const st2 = await fr.evaluate(() => { const it = getImgItems().find(x => x.group === 'cs'); return { ada: !!(it && imgStore[it.key]), n: window.__spFigurTerpasang || 0 }; });
  cek(st2.ada && st2.n > 0, 'SP23c video kedua: Character Sheet Fikri langsung terpasang dari simpanan', JSON.stringify(st2));
  cek(!global.prompts.some(x => x.img && /Character Sheet/i.test(x.user + x.sys)), 'Video kedua tidak memanggil AI gambar untuk Character Sheet');

  // pakaian lain = sheet lain (tidak dipakai)
  await page.click('#sp-tab .tab:has-text("Beranda")');
  const kunciLain = await page.evaluate(() => SP._uji.kunciFigur('sugi', 'kemeja', 'x', true));
  cek(!!kunciLain && kunciLain.indexOf('sugi_kemeja_foto_') === 0 && !(await page.evaluate(k => k in SP._uji.asetFigur(), kunciLain)), 'Pakaian lain memakai kunci lain (sheet tidak tertukar)');
  cek(await page.evaluate(() => SP._uji.kunciFigur('mia', 'baru', 'x', true)) === '', 'Outfit "baru" Mia (berganti tiap video) tidak disimpan sebagai sheet tetap');

  // Bank Figur: daftar sheet tersimpan + hapus
  await page.click('#sp-tab .tab:has-text("Beranda")');
  await page.evaluate(() => SP.buka('bank'));
  const kotakFikri = page.locator('.kotak:has(h3:has-text("Fikri"))').first();
  cek(/Character Sheet tersimpan/.test(await kotakFikri.innerText()) && /Hoodie hitam/.test(await kotakFikri.innerText()) && /di akun/.test(await kotakFikri.innerText()), 'Bank Figur: Character Sheet tersimpan Fikri tampil (☁️ di akun)');

  // Canvas ditutup lalu dibuka lagi: masuk lagi, sheet figur dimuat dari akun
  const ctx2 = await b.newContext({ viewport: { width: 412, height: 734 } });
  const p2 = await halaman(Object.assign(Object.create(b), { newPage: () => ctx2.newPage() }), log);
  await pasangFirebase(p2);
  await p2.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  await p2.click('.awan button:has-text("Masuk")');
  await p2.fill('#sp-kode-masuk', 'SUHU-ABC234'); await p2.click('#sp-masuk-btn');
  await p2.waitForSelector('text=Simpan otomatis aktif', { timeout: 5000 });
  cek(Object.keys(await p2.evaluate(() => SP._uji.asetFigur())).some(k => /^sugi_hoodie_foto_/.test(k)), 'Canvas dibuka lagi: Character Sheet figur dimuat dari akun');
  // buka proyek lama: gambar acuan proyek kembali
  await p2.locator('.proyek:has-text("Cara bikin video bicara") button:has-text("Buka")').click();
  const fr3 = await tungguBingkai(p2);
  await fr3.waitForFunction(() => getImgItems().some(x => x.group === 'cs' && imgStore[x.key]), null, { timeout: 8000 }).catch(() => { });
  cek(await fr3.evaluate(() => getImgItems().some(x => x.group === 'cs' && imgStore[x.key])), 'SP23b buka proyek tersimpan: Character Sheet kembali tanpa dibuat ulang');
  // hapus proyek: gambar acuannya ikut terhapus
  await p2.click('#sp-tab .tab:has-text("Beranda")');
  await p2.evaluate(() => SP.buka('lanjut'));
  await p2.locator('.proyek:has-text("Cara bikin video bicara") button[aria-label="Hapus"]').click();
  await p2.click('#sp-dialog button:has-text("Hapus")');
  await p2.waitForTimeout(800);
  cek(!Object.keys(db).some(k => k.startsWith('pengguna/UIDSUHU/pribadi/kreator_' + pid)), 'Hapus proyek: teks dan gambar acuannya ikut terhapus dari akun');
  cek(!log.some(x => /PAGEERROR/.test(x)), 'Tanpa galat halaman', log.filter(x => /PAGEERROR/.test(x)).join(' | '));
  await b.close();
  process.exit(ringkas() ? 1 : 0);
})().catch(e => { console.log('GAGAL', e.message); ringkas(); process.exit(1); });
