const { pw, halaman, cek, ringkas, bingkai } = require('./alat');
const T = (fr, txt) => fr.locator(`#app-container button:has-text("${txt}")`).first();
const judul = async fr => (await fr.locator('#app-container h2').first().textContent()).trim();
async function tungguBingkai(page) {
    await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap && !document.querySelector('#sp-muat[style*="flex"]'); }, null, { timeout: 30000 });
    await page.waitForTimeout(400);
    return bingkai(page);
}
async function keRingkasan(fr) {
    for (let k = 0; k < 16; k++) {
        const t = await judul(fr); if (t === 'Ringkasan') return;
        const dur = fr.locator('button', { hasText: /^\s*15\s*detik/ }); if (await dur.count()) { await dur.first().click(); continue; }
        if (/Pembuka/.test(t)) { await fr.waitForSelector('#app-container button:has-text("Biarkan AI")', { timeout: 20000 }).catch(() => { }); const b = fr.locator('#app-container button:has-text("Biarkan AI")'); if (await b.count()) { await b.first().click(); continue; } }
        await fr.locator('#app-container button:has-text("Lanjut")').last().click(); await fr.waitForTimeout(150);
    }
}
(async () => {
    const b = await pw.chromium.launch(); const log = [];
    const page = await halaman(b, log);
    await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
    await page.waitForFunction(() => document.querySelector('.kartu .ikon img'), null, { timeout: 8000 }).catch(() => { });
    cek(await page.locator('.kartu .ikon img').count() === 1, 'Beranda: foto Rio tampil di kartu Akun 1');
    cek(!(await page.evaluate(() => document.body.innerText)).includes('undefined'), 'Beranda tanpa teks rusak');

    // ===== A. Rio, tutorial, sampai hasil =====
    await page.click('text=Akun 1 · Rio');
    await page.click('text=Tutorial langkah demi langkah');
    cek(await page.locator('.chip.on:has-text("Smart casual")').count() === 1, 'Akun 1: outfit bawaan Smart casual');
    cek(await page.locator('.chip.on:has-text("Ruang kerja Rio")').count() === 1, 'Akun 1: lokasi bawaan Ruang kerja Rio');
    cek(await page.locator('.chip.on:has-text("Foto wajah resmi")').count() === 1, 'Akun 1: foto wajah resmi dipilih');
    await page.click('button:has-text("Mulai buat video")');
    let fr = await tungguBingkai(page);
    const st = await fr.evaluate(() => ({ v: step1View, nama: (selections.tokoh || [])[0] && selections.tokoh[0].nama, foto: !!ownPhotos[0], lok: selections.lokasi, sp: selections.sp, logo: document.querySelector('.k-logo-w').textContent }));
    cek(st.v === 'pemeran' && st.nama === 'Rio' && st.foto, 'Bingkai: halaman Pembicara, Rio terisi, foto terpasang', JSON.stringify(st));
    cek(/Ruang kerja Rio/.test(st.lok) && st.sp && st.sp.akun === 'a1', 'Bingkai: lokasi dan data akun tersimpan di proyek');
    cek(/STUDIO PRIBADI/.test(st.logo), 'Bingkai: logo Studio Pribadi');
    cek(await fr.locator('#sp-pem-lanjut:has-text("Lanjut dengan Rio")').count() === 1, 'SP1 Pembicara: kartu Rio di atas dengan tombol lanjut');
    // ketuk "1 pria" lalu kembali ke Rio
    await T(fr, '1 pria').click(); await fr.waitForTimeout(200);
    if (await judul(fr) !== 'Pembicara') await fr.locator('#app-container button:has-text("Kembali")').first().click().catch(() => {});
    await fr.waitForTimeout(200);
    const pem1 = await fr.evaluate(() => selections.pemeran);
    cek(await fr.locator('#sp-pem-lanjut:has-text("Pakai Rio")').count() === 1 || pem1 === '1 pria', 'SP1 pilih "1 pria": tombol kembali ke figur akun muncul', pem1);
    await fr.click('#sp-pem-lanjut');
    cek(await judul(fr) === 'Lokasi' && (await fr.evaluate(() => selections.tokoh[0].nama)) === 'Rio' && /Rio/.test(await fr.evaluate(() => selections.pemeran)), 'SP1 tombol figur: kembali ke Rio dan lanjut ke Lokasi', await judul(fr));
    cek(await fr.locator('#sp-lok-lanjut:has-text("Lanjut dengan lokasi ini")').count() === 1, 'SP1 Lokasi: kartu lokasi akun di atas');
    await fr.click('#sp-lok-lanjut');
    await fr.waitForSelector('text=Ide 1', { timeout: 15000 });
    let p = global.prompts.filter(x => !x.img).pop();
    cek(p && /STUDIO PRIBADI - PERSONAL CHANNEL CONTEXT/.test(p.sys) && /Rio: the adult man from the user's reference photo/.test(p.sys), 'Ide dari mesin: konteks akun + figur Rio ikut');
    cek(p && /SCREEN RULE/.test(p.sys), 'Format tutorial: aturan sisipan rekaman layar ikut');
    await fr.click('text=Ide 1'); await fr.click('#btn-lanjut');
    const cepat = fr.locator('#app-container button:has-text("Cepat")'); if (await cepat.count()) await cepat.first().click();
    await keRingkasan(fr);
    cek(await judul(fr) === 'Ringkasan', 'Sampai Ringkasan');
    global.prompts = [];
    await fr.click('button:has-text("Sutradarai Videoku")');
    await fr.waitForFunction(() => !isProcessingQueue && phaseQcText.length > 0, null, { timeout: 120000 });
    const teks = global.prompts.filter(x => !x.img);
    const master = teks.find(x => /Master Character/.test(x.sys) && /Master Voice/.test(x.sys));
    cek(master && /Ruang kerja Rio/.test(master.user + master.sys), 'Master Aset menerima lokasi Ruang kerja Rio');
    cek(master && /Rio/.test(master.user) && /kemeja polos biru muda/.test(master.user), 'Master Aset menerima nama dan pakaian Rio');
    cek(master && /sepatu loafer kulit cokelat tua/.test(master.user) && /dark-brown leather loafers/.test(master.sys), 'SP3 sepatu Rio ikut (pakaian + konteks)');
    cek(master && !/usia 27|rambut hitam/.test(master.user) && !/27-year-old|short black hair/.test(master.sys), 'SP2 pakai foto: usia dan rambut tidak dikirim');
    cek(master && /Nama akun atau channel: Rio \| Suhu Digital/.test(master.user), 'SP4 nama akun Rio | Suhu Digital terisi');
    cek(master && /CLOSING CALL TO ACTION[^\n]*choose ONE fitting call to action/.test(master.sys), 'SP5 ajakan bawaan: AI tentukan');
    cek(master && /Location: Ruang kerja Rio/.test(master.sys), 'SP1 konteks lokasi = lokasi akun');
    cek(teks.every(x => /STUDIO PRIBADI/.test(x.sys) || /^You shorten/.test(x.sys)), 'Semua perintah AI teks membawa konteks akun', teks.filter(x => !/STUDIO PRIBADI/.test(x.sys)).map(x => x.sys.slice(0, 60)).join(' | '));
    cek(teks.filter(x => (x.sys.match(/STUDIO PRIBADI - PERSONAL/g) || []).length > 1).length === 0, 'Konteks tidak dobel');
    await fr.locator('button:has-text("Buat Gambar")').first().click().catch(() => { });
    await fr.waitForTimeout(1500);
    const img = global.prompts.filter(x => x.img);
    cek(img.length > 0 && !img.some(x => /STUDIO PRIBADI/.test(x.sys + x.user)) && img[0].refs > 0, 'AI gambar: foto Rio terlampir, tanpa tambahan konteks', 'img=' + img.length + ' refs=' + (img[0] || {}).refs);
    cek(teks.some(x => x.refs > 0), 'Foto Rio dikirim ke AI (Character Sheet / Master)');
    const kode = await fr.evaluate(() => makeProjectCode());
    cek(/^SGM[01]:/.test(kode), 'Kode Proyek dibuat');
    await page.screenshot({ path: '/tmp/spA.png' });

    // ✨ Baru di bingkai = kembali ke Beranda Studio Pribadi
    await fr.evaluate(() => goNew());
    await page.waitForTimeout(300);
    cek(await page.locator('text=Studio konten pribadimu').isVisible(), '✨ Baru di bingkai kembali ke Beranda Studio Pribadi');
    cek(await page.locator('#sp-tab .tab').count() === 2, 'Tab video tetap ada (Beranda + 1 video)');

    // ===== B. Mia, ide sudah ditulis =====
    await page.click('text=Akun 2 · Mia');
    await page.click('text=Format Hari 2');
    cek(await page.locator('.chip.on:has-text("Dari deskripsi")').count() === 1, 'Mia tanpa foto resmi: wajah dari deskripsi');
    cek(await page.locator('.chip:has-text("Cek keranjang kuning")').count() === 1 && await page.locator('.chip:has-text("Ikut kelas")').count() === 0, 'SP5 Mia: pilihan keranjang kuning ada, kelas tidak');
    await page.click('.chip:has-text("Cek keranjang kuning")');
    await page.click('.chip:has-text("Tonton live")');
    await page.fill('#sp-live', 'tiap malam jam 8');
    await page.click('.chip:has-text("Komentar")');
    cek(await page.locator('.chip.on').filter({ hasText: /keranjang|live|Komentar|AI tentukan/ }).count() === 2, 'SP5 paling banyak 2 ajakan');
    await page.click('.chip:has-text("Tulis ajakan sendiri")');
    await page.fill('#sp-ajakan', 'Tulis MAU di komentar ya');
    await page.click('.chip:has-text("Tonton live")');
    await page.fill('#sp-live', 'tiap malam jam 8');
    await page.fill('#sp-ide', 'Mia menjelaskan 3 cara memilih produk affiliate yang laku.');
    await page.click('button:has-text("Mulai buat video")');
    fr = await tungguBingkai(page);
    const stB = await fr.evaluate(() => ({ t: selections.tokoh[0], foto: !!ownPhotos[0], pk: selections.pakaiFoto }));
    cek(stB.t.nama === 'Mia' && stB.t.umur === '30' && /hijab/.test(stB.t.ciri) && !stB.foto, 'Mia: umur, hijab, tanpa foto', JSON.stringify(stB));
    await fr.click('#app-container button:has-text("Lanjut")');
    await fr.click('#sp-lok-lanjut');
    await fr.waitForTimeout(300);
    const stB2 = await fr.evaluate(() => ({ v: step1View, s: selections[1] }));
    cek(stB2.v === 'story' && /produk affiliate/.test(stB2.s), 'Ide tertulis: langsung ke halaman cerita (tanpa ide AI)', JSON.stringify(stB2));
    cek(await fr.evaluate(() => selections.namaUsaha) === 'Mia | Affiliate Pakai AI (@suhudigital123)', 'SP4 nama akun Mia');
    global.prompts = [];
    await fr.evaluate(() => { selections.lokasi = 'Taman kota sore hari'; return fetchGemini({ contents: [{ parts: [{ text: 'tes' }] }], systemInstruction: { parts: [{ text: 'You are a test.' }] } }); });
    const pB = global.prompts[0].sys;
    cek(/changed the location in the app to "Taman kota sore hari"/.test(pB) && !/Location: Ruang kerja Mia/.test(pB), 'SP1 lokasi diganti di bingkai: konteks AI ikut lokasi baru');
    cek(/Tulis MAU di komentar ya/.test(pB) && /watch the next live \(schedule: tiap malam jam 8\)/.test(pB), 'SP5 ajakan sendiri + live dengan jadwal masuk konteks');
    cek(/the account's|account name/.test(pB) && !/@suhudigital123/.test(pB), 'SP4 nama akun tidak dimasukkan ke ucapan');
    await page.click('#sp-tab .tab:has-text("Beranda")');

    // ===== C. Kolaborasi obrolan =====
    await page.click('text=Kolaborasi');
    await page.click('text=Obrolan sahabat');
    cek(await page.locator('.chip.on:has-text("Markas")').count() === 1, 'Kolaborasi: lokasi bawaan Markas');
    await page.click('button:has-text("Mulai buat video")');
    fr = await tungguBingkai(page);
    const stC = await fr.evaluate(() => ({ n: selections.tokoh.length, nm: selections.tokoh.map(t => t.nama).join(','), foto: ownPhotos.map(Boolean), tema: selections.temaRek.id, slot: castSlots(), pem: selections.pemeran }));
    cek(stC.n === 3 && stC.nm === 'Rio,Mia,Nara' && stC.slot === 3, 'Kolaborasi: 3 tokoh terisi', JSON.stringify(stC));
    cek(stC.foto[0] && !stC.foto[1] && !stC.foto[2] && stC.tema === 'podcast', 'Kolaborasi: foto hanya Rio, mesin podcast');

    // ===== F. Batas 3 video =====
    await page.click('#sp-tab .tab:has-text("Beranda")');
    await page.click('text=Akun 3 · Nara');
    await page.click('text=Ide produk digital');
    await page.click('button:has-text("Mulai buat video")');
    await page.waitForTimeout(400);
    cek(await page.locator('#sp-dialog:visible').count() === 1 && /Sudah 3 video/.test(await page.locator('#sp-dialog').innerText()), 'Video ke-4 ditolak dengan pesan');
    await page.click('#sp-dialog button');

    // tutup video Mia
    const nTab = await page.locator('#sp-tab .tab').count();
    await page.locator('#sp-tab .tab:has-text("Mia ·") .x').click();
    await page.click('#sp-dialog button:has-text("Tutup video")');
    cek(await page.locator('#sp-tab .tab').count() === nTab - 1, 'Video bisa ditutup');

    // ===== D. Skit (Serba Bisa) =====
    await page.click('#sp-tab .tab:has-text("Beranda")').catch(() => { });
    if (!(await page.locator('text=Studio konten pribadimu').isVisible())) await page.evaluate(() => SP.buka('beranda'));
    // tutup kolaborasi supaya ada tempat
    await page.locator('#sp-tab .tab:has-text("Rio+Mia+Nara") .x').click(); await page.click('#sp-dialog button:has-text("Tutup video")');
    await page.evaluate(() => SP.buka('beranda'));
    await page.click('text=Kolaborasi');
    await page.click('text=Skit tiga sahabat');
    await page.click('.chip:has-text("Mia")'); // Mia keluar, tinggal Rio + Nara
    await page.fill('#sp-ide', 'Rio dan Nara berebut kursi terakhir di kafe.');
    await page.click('button:has-text("Mulai buat video")');
    fr = await tungguBingkai(page);
    const stD = await fr.evaluate(() => ({ app: HISTORY_KEY, v: step1View, s: selections[1], nm: selections.tokoh.map(t => t.nama).join(',') }));
    cek(/serba/.test(stD.app) && stD.v === 'story' && /kursi terakhir/.test(stD.s) && stD.nm === 'Rio,Nara', 'Skit: mesin Serba Bisa, cerita terisi, Rio + Nara', JSON.stringify(stD));

    // ===== Lanjutkan Proyek dari kode =====
    await page.locator('#sp-tab .tab:has-text("Rio · Tutorial") .x').click(); await page.click('#sp-dialog button:has-text("Tutup video")');
    await page.evaluate(() => SP.buka('lanjut'));
    await page.fill('#sp-kode', kode);
    await page.click('button:has-text("Buka proyek")');
    fr = await tungguBingkai(page);
    await fr.waitForTimeout(500);
    const stE = await fr.evaluate(() => ({ sp: selections.sp && selections.sp.akun, foto: !!ownPhotos[0], hasil: !!phase1ResultText, view: currentView }));
    cek(stE.sp === 'a1' && stE.foto && stE.hasil, 'Kode Proyek: proyek Rio terbuka lagi lengkap dengan foto', JSON.stringify(stE));
    global.prompts = [];
    await fr.evaluate(() => fetchGemini({ contents: [{ parts: [{ text: 'tes' }] }], systemInstruction: { parts: [{ text: 'You are a test.' }] } }));
    cek(/Rio: the adult man from the user's reference photo/.test(global.prompts[0].sys), 'Kode Proyek: konteks akun ikut lagi');

    // ===== E. Ide Konten =====
    await page.evaluate(() => SP.buka('ide'));
    await page.click('button:has-text("Buat ide")');
    await page.waitForSelector('text=Ide akun 3', { timeout: 15000 });
    cek(await page.locator('.ide').count() === 3, 'Ide Konten: 3 ide tampil');
    await page.locator('.ide button').nth(1).click();
    cek(await page.locator('.pilih.on:has-text("Tips cepat")').count() === 1 && /Ide akun 2/.test(await page.inputValue('#sp-ide')), 'Buat video ini: format dan ide terisi');
    await page.screenshot({ path: '/tmp/spE.png', fullPage: true });

    console.log('\nLOG:', log.filter(x => !/404/.test(x)).slice(0, 10));
    await b.close();
    process.exit(ringkas() ? 1 : 0);
})().catch(e => { console.log('GAGAL', e.message); ringkas(); process.exit(1); });
