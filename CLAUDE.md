# Studio Pribadi: aturan kerja untuk Claude

Aplikasi pribadi pengguna (bukan untuk member) untuk membuat prompt video AI bagi tiga akun TikTok-nya, di Gemini Canvas.

## Status (17 Nov 2026)
- **V1.1** di `main` (SP1-SP5). V1.0 sudah diuji pengguna di Canvas asli: berhasil (AI dari bingkai berjalan, figur Rio terkunci, aturan rekaman layar berjalan).
- Penomoran temuan berikutnya: **SP6**. Temuan di mesin Sugi diberi nomor K (lanjutan dapur Sugi) dan dikerjakan di repo `sugi-studio-dapur`.
- Menunggu: foto wajah resmi Nara (dan Mia) dari pengguna → simpan di `figur/nara.jpg`, `figur/mia.jpg` (sekitar 768 px, JPEG).

## Tentang pengguna
- Pemula dalam pemrograman, biasanya memakai HP. Jawab dalam **bahasa Indonesia** sederhana.
- **Jangan mengubah kode sebelum pengguna bilang "kerjakan".** Temuan dijelaskan, diberi nomor (SP untuk Studio Pribadi, K untuk mesin Sugi), dicatat, lalu dikerjakan sekaligus.
- Jujur: uji di sini memakai jawaban AI tiruan; sebutkan yang hanya bisa dibuktikan di Canvas.
- Commit dalam bahasa Indonesia.

## Akun dan figur (terkunci di `studio-pribadi.html`)
- Akun 1 · **Rio** (pria 27 tahun, foto `figur/rio.jpg`): tutorial ilmu AI, terutama video AI. Nama akun: **Rio | Suhu Digital**.
- Akun 2 · **Mia** (wanita sekitar 30 tahun, hijab georgette abu tua): tutorial affiliate dengan video AI. Nama akun: **Mia | Affiliate Pakai AI** (username @suhudigital123 tetap).
- Akun 3 · **Nara** (wanita 26 tahun, hijab pashmina terakota, kacamata bulat): produk digital dan AI. Nama akun: **Nara | Produk Digital AI**.
- Kolaborasi: tiga sahabat. Lokasi: ruang kerja masing-masing (tetap), tempat kumpul tetap (Markas, Kafe langganan, Teras atap), tempat jumpa lain yang bisa berganti.
- Setiap outfit punya sepatu tetap (SP3). Dengan foto wajah, usia/wajah/rambut tidak dikirim ke AI (SP2).

## Cara kerja
- `pemanggil-studio-pribadi.html` ditempel di Canvas (memuat penanda alamat AI Gemini, tanpa `document.write`), mengambil `studio-pribadi.html` dari `main`.
- Setiap video berjalan di iframe `srcdoc` sendiri (maks. 3). Mesin = `kreator.html` atau `serba-bisa.html` dari repo **Sugimation main**, diambil saat dibuka. AI dari bingkai dititipkan ke halaman utama lewat `postMessage` (cara Satu Pintu); halaman utama menambahkan **konteks akun** ke setiap perintah AI teks (`tambahKonteks`, `konteksKini`: lokasi mengikuti `selections.lokasi` di bingkai).
- `PERSONA()` dijalankan di bingkai setelah mesin: membungkus `resetProject` (isi figur, foto, lokasi, `namaUsaha`), `afterLokasi`, `buildLokasiHtml`/`buildPemeranHtml` (kartu figur/lokasi akun di atas), `openProject` (foto kembali), `goNew`/`goHome` (kembali ke Beranda Studio Pribadi), dan mengganti logo. Bila nama fungsi mesin berubah, aplikasi menampilkan "Perlu pembaruan".
- Ajakan penutup (SP5): pilihan per akun, maks. 2, "Tulis ajakan sendiri", jadwal live opsional; dikirim lewat konteks (CLOSING CALL TO ACTION) dan diperiksa QC (aturan K101 di mesin Sugi).

## Uji
- `node uji/uji.js` (Playwright dari `/opt/npm-tools/node_modules/playwright`, harness Sugi di `../sugi-studio-dapur/test`). Mesin Sugi diambil dari folder `SUGIMATION` (bawaan `/home/claude/sugimation`). 48 uji, semua harus lolos.
