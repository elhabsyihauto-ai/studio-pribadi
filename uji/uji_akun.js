// Uji SP18-SP22: 5 akun (Sugi Studio AI, Mia, Nara, Ustad Taysir, Rio), wajah baru Mia, aturan khusus Ustad Taysir, kakak-adik.
const { pw, halaman, cek, ringkas, bingkai } = require('./alat');
(async () => {
  const b = await pw.chromium.launch(); const log = [];
  const page = await halaman(b, log);
  await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll('.kartu .ikon img').length >= 5, null, { timeout: 8000 }).catch(() => { });
  const kartu = await page.locator('.grid2').first().locator('.kartu b').allInnerTexts();
  cek(kartu.join('|') === 'Akun 1 · Sugi Studio AI|Akun 2 · Mia|Akun 3 · Nara|Akun 4 · Ustad Taysir|Akun 5 · Rio|Kolaborasi', 'SP20 Beranda: urutan 5 akun + kolaborasi', kartu.join('|'));
  cek(await page.locator('.kartu .ikon img').count() === 5, 'SP18 foto kelima figur tampil (termasuk Fikri dan Ustad Taysir)');
  const bank = await page.evaluate(() => { const B = SP._uji.bank, o = {}; for (const k in B) o[k] = B[k].length; return o; });
  cek(['a1', 'a2', 'a3', 'a4', 'a5', 'kolab'].every(k => bank[k] >= 20), 'SP21 bank judul ada untuk keenam pilihan', JSON.stringify(bank));

  // ===== Ustad Taysir =====
  await page.click('text=Akun 4 · Ustad Taysir');
  cek(await page.locator('.chip.on:has-text("Koko putih")').count() === 1 && await page.locator('.chip.on:has-text("Ruang belajar Ustad Taysir")').count() === 1, 'SP18 Ustad Taysir: koko putih + ruang belajar bawaan');
  cek(await page.locator('input.sp-detail[data-f="taysir"][data-k="hijab"]').count() === 0, 'SP18 Ustad Taysir: tanpa kolom hijab');
  cek(await page.locator('.chip:has-text("Daftar kelas baca Al-Qur\'an")').count() === 1 && await page.locator('.chip:has-text("Cek keranjang")').count() === 0, 'SP22 ajakan Ustad: kelas baca Al-Qur\'an, tanpa keranjang kuning');
  await page.click('.pilih:has-text("Pelajaran metode Taysir")');
  let k = await page.evaluate(() => SP._uji.konfig());
  cek(/RECITATION RULE/.test(k.konteks) && /lip-sync only to the uploaded recitation audio/.test(k.konteks) && /LIP-SYNC RECITATION:/.test(k.konteks), 'SP22 bacaan ayat = lip-sync suara asli, bukan suara AI');
  cek(/Never generate Arabic letters/.test(k.konteks) && /No promises of instant results/.test(k.konteks) && /never show the prophet or companion/.test(k.konteks), 'SP22 tanpa tulisan Arab buatan AI, tanpa janji instan, tanpa sosok nabi/sahabat');
  cek(/polite, gentle Indonesian/.test(k.konteks) && !/casual Indonesian/.test(k.konteks.split('Speech in')[1] || ''), 'SP22 ucapan santun (bukan santai)');
  cek(/peci/.test(k.figur[0].en) && /Ramah\/hangat/.test(k.figur[0].watak.join()) && /Kalem/.test(k.figur[0].watak.join()), 'SP18 data Ustad: peci + watak Ramah/hangat dan Kalem');
  await page.click('.pilih:has-text("Tips orang tua")');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(!/RECITATION RULE/.test(k.konteks), 'SP22 aturan lip-sync hanya di format yang ada bacaan ayat/doa');
  // tulisan "untuk anak-anak" tidak ditolak di akun Ustad
  await page.fill('#sp-ide', 'Cara menegur dengan lembut untuk anak-anak yang susah salat');
  await page.click('button:has-text("Mulai buat video")');
  await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap && !document.querySelector('#sp-muat[style*="flex"]'); }, null, { timeout: 30000 });
  let fr = await bingkai(page);
  const t0 = await fr.evaluate(() => selections.tokoh[0]);
  cek(t0.nama === 'Ustad Taysir' && Array.isArray(t0.watak) && t0.watak.includes('Kalem'), 'SP18 watak Ustad masuk ke data tokoh mesin (K239)', JSON.stringify(t0.watak));
  cek(await fr.evaluate(() => selections.namaUsaha) === 'Ustad Taysir', 'SP4 nama akun Ustad Taysir');

  // ===== Sugi Studio AI (Fikri) =====
  await page.click('#sp-tab .tab:has-text("Beranda")');
  await page.click('text=Akun 1 · Sugi Studio AI');
  cek(await page.locator('input.sp-detail[data-f="sugi"][data-k="hijab"]').count() === 0 && await page.locator('.chip:has-text("Ikut kelas video AI")').count() === 1, 'SP18 Fikri: tanpa kolom hijab, ajakan kelas video AI');
  await page.click('.pilih:has-text("Sebelum-sesudah")');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(k.figur[0].nama === 'Fikri' && /SCREEN RULE/.test(k.konteks) && /No promises of income/.test(k.konteks), 'SP20 Sugi Studio AI: Fikri, rekaman layar, tanpa janji penghasilan');
  cek(!/earbuds/i.test(k.figur[0].pakaian) && /No earbuds unless/.test(k.figur[0].en) && !/logo/.test(k.figur[0].pakaian.replace('tanpa logo', '')), 'SP18 hoodie tanpa logo dan tanpa earbuds tetap');

  // ===== Mia (wajah baru, khusus baju) =====
  await page.evaluate(() => SP.buka('akun', { akun: 'a2' }));
  await page.click('.pilih:has-text("Outfit hari ini")');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(/dark-grey chiffon hijab/.test(k.figur[0].en) && /outfit changes from video to video/.test(k.figur[0].en) && /no clip-on microphone/.test(k.figur[0].en), 'SP19 Mia: hijab abu tua tetap, pakaian boleh berganti, tanpa mikrofon klip');
  cek(/matches the clothing featured/.test(k.figur[0].en) && /ALWAYS clothing, never bags or shoes/.test(k.konteks), 'SP20 Mia khusus baju: outfit mengikuti baju yang dipromosikan');
  const fotoMia = await page.evaluate(() => { const i = [...document.querySelectorAll('.foto-mini')][0]; return i ? i.naturalWidth : 0; });
  cek(fotoMia >= 700, 'SP19 foto wajah Mia baru (potongan close-up sheet) dimuat', fotoMia);

  // ===== Nara (tas & sepatu) =====
  await page.evaluate(() => SP.buka('akun', { akun: 'a3' }));
  await page.click('.pilih:has-text("Review jujur")');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(/ALWAYS a bag or a pair of shoes/.test(k.konteks) && /no live stream/i.test(k.konteks) && k.namaAkun === 'Nara | Spesialis Tas & Sepatu', 'SP20 Nara khusus tas & sepatu, tanpa live');
  cek(await page.locator('.chip:has-text("Tonton live")').count() === 0, 'SP20 Nara: pilihan ajakan live tidak ada');

  // ===== Rio (pembawa acara, tanpa live) =====
  await page.evaluate(() => SP.buka('akun', { akun: 'a1' }));
  cek(await page.locator('.chip:has-text("Tonton live Sugi Studio AI")').count() === 1 && await page.locator('.chip:has-text("Tonton live Mia")').count() === 1 && await page.locator('.chip', { hasText: /^🔴 Tonton live$/ }).count() === 0, 'SP20 Rio: ajakan ke live Sugi Studio dan Mia, tanpa live sendiri');
  cek(await page.locator('.pilih:has-text("Tutorial")').count() === 0 && await page.locator('.pilih:has-text("Kabar AI singkat")').count() === 1, 'SP20 Rio: tutorial pindah ke Sugi Studio AI, format kabar AI');
  await page.click('.pilih:has-text("Kenalan geng")');
  await page.click('.chip:has-text("Tonton live Sugi Studio AI")');
  await page.fill('#sp-live', 'Kamis jam 8 malam');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(/Sugi Studio AI live \(AI video class\) \(schedule: Kamis jam 8 malam\)/.test(k.konteks), 'SP20 jadwal live ikut ajakan live Sugi Studio');

  // ===== Kolaborasi: kakak-adik =====
  await page.evaluate(() => SP.buka('akun', { akun: 'kolab' }));
  await page.click('.pilih:has-text("Kakak-adik")');
  k = await page.evaluate(() => SP._uji.konfig());
  cek(k.figur.map(f => f.nama).join(',') === 'Fikri,Ustad Taysir' || k.figur.map(f => f.nama).join(',') === 'Ustad Taysir,Fikri', 'SP18 format kakak-adik: Ustad Taysir + Fikri', k.figur.map(f => f.nama).join(','));
  const per = k.figur.map(f => f.peran).join(' | ');
  cek(/kakak kandung Fikri/.test(per) && /adik kandung Ustad Taysir/.test(per), 'SP18 peran kakak dan adik kandung', per);
  cek(/BROTHERS:[^\n]*ALWAYS wears a plain black peci[^\n]*NEVER wears a peci/.test(k.konteks) && /USTAD TAYSIR:[^\n]*never takes part in selling/.test(k.konteks), 'SP18 pembeda wajah kakak-adik + Ustad tidak ikut jualan');
  cek(/kakak-adik/.test(k.pemeran), 'SP18 pemeran: kakak-adik', k.pemeran);
  // Ustad di format pasangan/tantangan ditolak
  await page.click('.pilih:has-text("Saling tanya")');
  await page.click('.kotak:has-text("Siapa yang tampil") .chip:has-text("Ustad Taysir")').catch(() => { });
  const fig = await page.evaluate(() => SP._uji.pil().figur);
  if (fig.indexOf('taysir') < 0) await page.click('.kotak:has-text("Siapa yang tampil") .chip:has-text("Ustad Taysir")');
  await page.click('button:has-text("Mulai buat video")');
  cek(/Ustad Taysir tidak ikut format ini/.test(await page.innerText('#sp-akun-galat')), 'SP22 Ustad Taysir ditolak di format saling tantang (konten tetap terjaga)');
  // bank figur
  await page.evaluate(() => SP.buka('bank'));
  const isiBank = await page.innerText('#sp-isi');
  cek(/Fikri/.test(isiBank) && /Ustad Taysir/.test(isiBank) && /nama dan usia sementara/.test(isiBank) && /adik kandung Ustad Taysir/.test(isiBank), 'SP18 Bank Figur: Fikri (nama sementara) dan Ustad Taysir');
  cek(!(await page.evaluate(() => document.body.innerText)).includes('undefined'), 'Bank Figur tanpa teks rusak');
  cek(!log.some(x => /PAGEERROR/.test(x)), 'Tanpa galat halaman', log.filter(x => /PAGEERROR/.test(x)).join(' | '));
  await page.evaluate(() => SP.buka('beranda'));
  await page.screenshot({ path: '/tmp/claude-0/sp_beranda.png', fullPage: true });
  await b.close();
  process.exit(ringkas() ? 1 : 0);
})().catch(e => { console.log('GAGAL', e.message); ringkas(); process.exit(1); });
