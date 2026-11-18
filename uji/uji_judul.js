// Uji SP17: judul konten jadi langkah pertama, bank judul siap pakai, format disarankan, judul baru dari AI.
const { pw, halaman, cek, ringkas, bingkai } = require('./alat');
(async () => {
  const b = await pw.chromium.launch(); const log = [];
  const page = await halaman(b, log);
  await page.waitForSelector('text=Studio konten pribadimu', { timeout: 15000 });
  cek(await page.locator('.kartu:has-text("Judul Konten")').count() === 1 && await page.locator('.kartu:has-text("Ide Konten")').count() === 0, 'Beranda: kartu "Judul Konten" (dulu Ide Konten)');
  const bank = await page.evaluate(() => { const B = SP._uji.bank; const o = {}; for (const k in B) o[k] = B[k].length; return o; });
  const total = Object.values(bank).reduce((a, x) => a + x, 0);
  cek(total >= 140 && Object.values(bank).every(x => x >= 25), 'Bank judul: banyak judul untuk tiap akun', JSON.stringify(bank) + ' = ' + total);
  const formatOk = await page.evaluate(() => { const B = SP._uji.bank; const salah = []; for (const a in B) B[a].forEach(x => { if (!SP._uji.saranFormat(a, x[0])) salah.push(a + ':' + x[0]); }); return salah; });
  cek(formatOk.length === 0, 'Setiap judul di bank punya format yang disarankan', formatOk.slice(0, 3).join(' | '));
  const blok = await page.evaluate(() => { const B = SP._uji.bank, re = /\b(1[0-7]|[1-9])\s*(th|tahun|thn)\b|\banak[- ]?anak\b|\bbalita\b|\bremaja\b|\bABG\b|\bbocah\b|\bSD\b/i; const out = []; for (const a in B) B[a].forEach(x => { if (re.test(x[0])) out.push(x[0]); }); return out; });
  cek(blok.length === 0, 'Bank judul tanpa kata yang diblok aturan 18+', blok.join(' | '));
  // Akun 1: judul jadi langkah 1, format langkah 2
  await page.click('text=Akun 1 · Rio');
  const urut = await page.locator('#sp-isi .kotak h3').allInnerTexts();
  cek(/Judul konten/.test(urut[0]) && /Format konten/.test(urut[1]), 'Langkah 1 Judul konten, langkah 2 Format konten', urut.slice(0, 3).join(' / '));
  cek(!urut.some(t => /Ide video/.test(t)), 'Kotak "Ide video" lama di bawah sudah tidak ada');
  cek(await page.locator('.bank-j').count() === 8, 'Bank judul: 8 judul tampil dulu (ringkas untuk HP)');
  const pertama = await page.locator('.bank-j b').first().innerText();
  await page.click('.chip:has-text("Judul lain")');
  cek((await page.locator('.bank-j b').first().innerText()) !== pertama, '🔀 Judul lain: judul berganti');
  await page.click('.chip:has-text("Lihat semua")');
  cek(await page.locator('.bank-j').count() === bank.a1, 'Lihat semua: semua judul akun tampil', await page.locator('.bank-j').count());
  await page.click('.chip:has-text("Ringkas")');
  await page.click('#sp-isi .chips .chip:has-text("Kesalahan")');
  const sem = await page.locator('.bank-j small').allInnerTexts();
  cek(sem.length > 0 && sem.every(t => /Kesalahan/.test(t)), 'Penyaring format: hanya judul format itu');
  await page.locator('.bank-j').first().click();
  const p1 = await page.evaluate(() => SP._uji.pil());
  cek(p1.ide && p1.format === 'kesalahan' && await page.locator('.pilih.on:has-text("Kesalahan pemula") .tag:has-text("Disarankan")').count() === 1, 'Ketuk judul: judul terisi, format "Kesalahan pemula" terpilih dan ditandai ⭐ Disarankan', JSON.stringify({ ide: p1.ide, f: p1.format }));
  // format dipilih sendiri tidak ditimpa
  await page.click('.pilih:has-text("Tips cepat")');
  await page.click('#sp-isi .chips .chip:has-text("Semua")');
  await page.locator('.bank-j').nth(2).click();
  cek((await page.evaluate(() => SP._uji.pil().format)) === 'tips', 'Format yang dipilih sendiri tidak ditimpa saran');
  // judul diketik sendiri: format disarankan tanpa menggambar ulang halaman
  await page.evaluate(() => SP.buka('akun', { akun: 'a1' }));
  await page.fill('#sp-ide', 'Prompt biasa vs prompt sinematik untuk video AI');
  await page.click('button:has-text("Mulai buat video")');
  await page.waitForFunction(() => { const f = document.querySelector('#sp-bingkai iframe.kini'); return f && f.contentWindow.__spSiap; }, null, { timeout: 30000 });
  const sp = await page.evaluate(() => SP._uji.pil());
  cek(sp.format === 'beforeafter' && /vs prompt sinematik/.test(sp.ide), 'Judul diketik lalu langsung ketuk Mulai: video terbuka sekali ketuk, format Before-after disarankan', JSON.stringify({ f: sp.format }));
  const fr = await bingkai(page);
  cek(/vs prompt sinematik/.test(await fr.evaluate(() => getStory())), 'Judul ikut masuk ke mesin sebagai ide');
  // judul baru dari AI
  await page.evaluate(() => SP.buka('akun', { akun: 'a3' }));
  const n0 = await page.evaluate(() => SP._uji.bank.a3.length);
  await page.click('.chip:has-text("Buatkan judul baru")');
  await page.waitForSelector('.bank-j:has-text("✨")', { timeout: 15000 });
  cek(await page.locator('.bank-j:has-text("✨")').count() >= 1 && /\(\d+\)/.test(await page.locator('.chip:has-text("Lihat semua")').innerText()), 'Judul baru dari AI tampil paling atas (bertanda ✨)');
  const pAI = global.prompts.filter(x => !x.img).pop();
  cek(pAI && /Do not repeat these titles/.test(pAI.user) && /no children/.test(pAI.sys), 'Perintah AI: jangan mengulang judul bank, tanpa anak');
  cek(!log.some(x => /PAGEERROR/.test(x)), 'Tanpa galat halaman', log.filter(x => /PAGEERROR/.test(x)).join(' | '));
  await page.screenshot({ path: '/tmp/claude-0/sp17.png', fullPage: false });
  await b.close();
  process.exit(ringkas() ? 1 : 0);
})().catch(e => { console.log('GAGAL', e.message); process.exit(1); });
