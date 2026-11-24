// Uji SP16: simpan otomatis Studio Pribadi ke akun (Firebase tiruan yang meniru aturan Firestore Satu Pintu).
const { pw, halaman, cek, ringkas, bingkai } = require('./alat');
const ADMIN = { email: 'admin@contoh.id', sandi: 'rahasia123', uid: 'UIDADMIN' };
const MEMBER = { email: 'rina-k7m2q9@anggota.sugistudio.app', sandi: 'RINA-K7M2Q9', uid: 'UIDRINA' };   // member tidak aktif: ditolak aturan
const db = {};   // jalur -> dokumen
const catat = [];
function pasangFirebase(page) {
  return page.route(/identitytoolkit|firestore\.googleapis|securetoken/, async route => {
    const req = route.request(), u = new URL(req.url()), m = req.method();
    const balas = (st, j) => route.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(j) });
    if (/signInWithPassword/.test(u.pathname)) {
      const b = JSON.parse(req.postData() || '{}');
      const a = [ADMIN, MEMBER].find(x => x.email === b.email && x.sandi === b.password);
      if (!a) return balas(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
      return balas(200, { idToken: 'TOK-' + a.uid, refreshToken: 'REF-' + a.uid, localId: a.uid, email: a.email, expiresIn: '3600' });
    }
    if (/securetoken/.test(u.host)) { const r = /refresh_token=REF-(\w+)/.exec(req.postData() || ''); return r ? balas(200, { id_token: 'TOK-' + r[1], refresh_token: 'REF-' + r[1], expires_in: '3600' }) : balas(400, { error: { message: 'INVALID_REFRESH_TOKEN' } }); }
    const uid = ((req.headers()['authorization'] || '').match(/Bearer TOK-(\w+)/) || [])[1];
    const jalur = decodeURIComponent(u.pathname.split('/documents/')[1] || '');
    catat.push(m + ' ' + jalur);
    const pemilik = (jalur.match(/^pengguna\/(\w+)\//) || [])[1];
    if (!uid || uid !== pemilik || uid !== ADMIN.uid) return balas(403, { error: { status: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } });
    if (m === 'GET') {
      const docs = Object.keys(db).filter(k => k.startsWith(jalur + '/') && !k.slice(jalur.length + 1).includes('/')).map(k => ({ name: 'projects/sugi-studio-ai/databases/(default)/documents/' + k, fields: db[k] }));
      return balas(200, docs.length ? { documents: docs } : {});
    }
    if (m === 'PATCH') { db[jalur] = JSON.parse(req.postData()).fields; return balas(200, { name: jalur, fields: db[jalur] }); }
    if (m === 'DELETE') { delete db[jalur]; return balas(200, {}); }
    return balas(400, {});
  });
}
const proyek = (id, judul, akun) => ({ id: String(id), date: new Date(2026, 10, 18, 9, id % 60).toISOString(), formattedDate: '18 Nov 2026', selections: { 1: judul, sp: { akun } }, phaseUndText: 'x' });
(async () => {
  const b = await pw.chromium.launch(); const log = [];
  let ctx = await b.newContext({ viewport: { width: 412, height: 734 } });
  let page = await halamanKonteks(ctx);
  async function halamanKonteks(c) {
    const p0 = c.newPage.bind(c); const brw = { newPage: () => p0() };
    const pg = await halaman(Object.assign(Object.create(b), { newPage: o => c.newPage() }), log);
    await pasangFirebase(pg); return pg;
  }
  await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  cek(/Belum tersimpan ke akun/.test(await page.innerText('#sp-isi')), 'Beranda: tanda simpan otomatis belum aktif + tombol Masuk');
  cek(await page.locator('.kartu:has-text("Proyek Saya")').count() === 1, 'Beranda: kartu Proyek Saya');
  // proyek lokal tanpa masuk
  await page.evaluate(p => localStorage.setItem('sugimation_kreator3_history', JSON.stringify([p])), proyek(101, 'Tutorial foto bicara', 'a1'));
  await page.click('.kartu:has-text("Proyek Saya")');
  let isi = await page.innerText('#sp-isi');
  cek(/Tutorial foto bicara/.test(isi) && /hanya di HP ini/.test(isi), 'Proyek Saya tanpa masuk: proyek di HP tampil, ditandai "hanya di HP ini"', isi.slice(0, 300));
  cek(await page.locator('#sp-kode').count() === 1, 'Proyek Saya: kotak tempel Kode Proyek tetap ada');
  // masuk salah
  await page.click('.awan button:has-text("Masuk")'); await page.click('.chip:has-text("Email admin")');
  await page.fill('#sp-email', ADMIN.email); await page.fill('#sp-sandi', 'salah');
  await page.click('#sp-masuk-btn'); await page.waitForTimeout(300);
  cek(/Email atau sandi salah/.test(await page.innerText('#sp-masuk-st')), 'Sandi salah: pesan jelas dalam bahasa Indonesia');
  // member yang tidak diizinkan aturan
  await page.fill('#sp-email', MEMBER.email); await page.fill('#sp-sandi', MEMBER.sandi);
  await page.click('#sp-masuk-btn'); await page.waitForTimeout(300);
  cek(/belum diizinkan menyimpan/.test(await page.innerText('#sp-masuk-st')) && !(await page.evaluate(() => SP._uji.akun())), 'Akun yang ditolak aturan Firestore: pesan jelas, tidak dianggap masuk');
  // masuk admin
  await page.fill('#sp-email', ADMIN.email); await page.fill('#sp-sandi', ADMIN.sandi);
  await page.click('#sp-masuk-btn');
  await page.waitForSelector('text=Simpan otomatis aktif', { timeout: 5000 });
  cek(/admin@contoh\.id/.test(await page.innerText('#sp-isi')), 'Masuk admin: simpan otomatis aktif, email tampil, langsung ke Proyek Saya');
  await page.waitForTimeout(3500);
  const k1 = 'pengguna/UIDADMIN/pribadi/kreator_101';
  cek(!!db[k1] && db[k1].mesin.stringValue === 'kreator' && /Tutorial foto bicara/.test(db[k1].data.stringValue) && db[k1].akun.stringValue === 'a1', 'Proyek di HP terunggah ke pengguna/{uid}/pribadi (bukan proyek Satu Pintu)', JSON.stringify(Object.keys(db)));
  cek(!Object.keys(db).some(k => /\/proyek\//.test(k)), 'Tidak menulis ke Proyek Saya Satu Pintu (pengguna/{uid}/proyek)');
  cek(/di akun/.test(await page.innerText('#sp-isi')), 'Proyek Saya: tanda ☁️ di akun setelah terunggah');
  // perubahan proyek ikut terunggah, tanpa unggah ulang yang tidak berubah
  const nPatch = catat.filter(x => /^PATCH/.test(x)).length;
  await page.waitForTimeout(3500);
  cek(catat.filter(x => /^PATCH/.test(x)).length === nPatch, 'Proyek yang tidak berubah tidak diunggah ulang');
  await page.evaluate(p => localStorage.setItem('sugimation_serbabisa3_history', JSON.stringify([p])), Object.assign(proyek(202, 'Konten Rio dan Nara', 'kolab'), { phase1ResultText: 'Master' }));
  await page.waitForTimeout(3500);
  cek(!!db['pengguna/UIDADMIN/pribadi/serba_202'], 'Proyek Serba Bisa baru ikut terunggah');
  // buka proyek dari bingkai sungguhan: buat video Sugi Studio AI lalu tunggu tersimpan
  await page.evaluate(() => SP.buka('beranda'));
  await page.click('text=Akun 1 · Sugi Studio AI'); await page.click('text=Tutorial 1 menit');
  await page.fill('#sp-ide', 'Cara bikin foto bicara pakai AI');
  await page.click('button:has-text("Mulai buat video")');
  await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap; }, null, { timeout: 30000 });
  const fr = await bingkai(page);
  await fr.evaluate(() => { phaseUndText = 'Pemahaman'; selections[1] = 'Cara bikin foto bicara pakai AI'; saveToHistory(); });
  await page.waitForTimeout(3500);
  const kunciBaru = Object.keys(db).find(k => /kreator_/.test(k) && !/_101$/.test(k));
  cek(!!kunciBaru && JSON.parse(db[kunciBaru].data.stringValue).selections.sp.akun === 'a4', 'Proyek dari bingkai mesin tersimpan otomatis, lengkap dengan data akun Studio Pribadi', kunciBaru);
  // Canvas ditutup: konteks baru (localStorage kosong), masuk lagi, proyek kembali
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 412, height: 734 } });
  page = await halamanKonteks(ctx);
  await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  cek(/Belum tersimpan ke akun/.test(await page.innerText('#sp-isi')), 'Canvas dibuka lagi: perlu masuk lagi');
  await page.click('.awan button:has-text("Masuk")'); await page.click('.chip:has-text("Email admin")');
  await page.fill('#sp-email', ADMIN.email); await page.fill('#sp-sandi', ADMIN.sandi); await page.click('#sp-masuk-btn');
  await page.waitForSelector('text=Simpan otomatis aktif', { timeout: 5000 });
  isi = await page.innerText('#sp-isi');
  cek(/Tutorial foto bicara/.test(isi) && /Konten Rio dan Nara/.test(isi) && /Cara bikin foto bicara/.test(isi), 'Setelah masuk lagi: ketiga proyek kembali di Proyek Saya', isi.slice(0, 400));
  // buka proyek tersimpan
  await page.locator('.proyek:has-text("Cara bikin foto bicara") button:has-text("Buka")').click();
  await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap && !document.querySelector('#sp-muat[style*="flex"]'); }, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const fr2 = await bingkai(page);
  const st = await fr2.evaluate(() => ({ s1: selections[1], sp: selections.sp && selections.sp.akun, und: phaseUndText }));
  cek(st.s1 === 'Cara bikin foto bicara pakai AI' && st.sp === 'a4' && st.und === 'Pemahaman', 'Buka dari Proyek Saya: proyek terbuka di bingkai lengkap dengan akun Sugi Studio AI', JSON.stringify(st));
  // hapus
  await page.evaluate(() => SP.buka('lanjut'));
  await page.locator('.proyek:has-text("Konten Rio dan Nara") button[aria-label="Hapus"]').click();
  await page.click('#sp-dialog button:has-text("Hapus")'); await page.waitForTimeout(300);
  cek(!db['pengguna/UIDADMIN/pribadi/serba_202'] && !/Konten Rio dan Nara/.test(await page.innerText('#sp-isi')), 'Hapus: proyek hilang dari akun dan daftar');
  // keluar
  await page.click('.awan button:has-text("Keluar")'); await page.click('#sp-dialog button:has-text("Keluar")');
  cek(/Belum tersimpan ke akun/.test(await page.innerText('#sp-isi')) && !!db['pengguna/UIDADMIN/pribadi/kreator_101'], 'Keluar: simpan otomatis mati, proyek di akun tetap aman');
  cek(!log.some(x => /PAGEERROR/.test(x)), 'Tanpa galat halaman', log.filter(x => /PAGEERROR/.test(x)).join(' | '));
  await b.close();
  process.exit(ringkas() ? 1 : 0);
})().catch(e => { console.log('GAGAL', e.message); process.exit(1); });
