# Studio Pribadi: aturan kerja untuk Claude

Aplikasi pribadi pengguna (bukan untuk member) untuk membuat prompt video AI bagi tiga akun TikTok-nya, di Gemini Canvas.

## Status (18 Nov 2026)
- **V1.5 (SP1-SP16, simpan otomatis ke akun) di `main` (18 Nov 2026)**, atas persetujuan pengguna ("pindahkan"). Cabang kerja: `ccr-bbb52875-s589vb`. Belum diuji pengguna di Canvas asli (masuk, simpan, buka lagi).
- V1.4 (SP1-SP15): V1.0 sudah diuji pengguna di Canvas asli: berhasil (AI dari bingkai berjalan, figur Rio terkunci, aturan rekaman layar berjalan).
- Penomoran temuan berikutnya: **SP17**. Temuan di mesin Sugi diberi nomor K (lanjutan dapur Sugi) dan dikerjakan di repo `sugi-studio-dapur`.
- Foto wajah resmi: `figur/rio.jpg`, `figur/nara.jpg` (SP6), `figur/mia.jpg` (SP12, potongan kotak "Depan" dari karakter sheet Mia; ganti bila ada foto besar).

## Tentang pengguna
- Pemula dalam pemrograman, biasanya memakai HP. Jawab dalam **bahasa Indonesia** sederhana.
- **Jangan mengubah kode sebelum pengguna bilang "kerjakan".** Temuan dijelaskan, diberi nomor (SP untuk Studio Pribadi, K untuk mesin Sugi), dicatat, lalu dikerjakan sekaligus.
- Jujur: uji di sini memakai jawaban AI tiruan; sebutkan yang hanya bisa dibuktikan di Canvas.
- Commit dalam bahasa Indonesia.

## Akun dan figur (terkunci di `studio-pribadi.html`)
- Akun 1 · **Rio** (pria 27 tahun, foto `figur/rio.jpg`; 6 pakaian sesuai karakter sheet: Smart casual (bawaan Akun 1), Kasual denim (bawaan kolaborasi), Traveling, Formal, Rumah, Olahraga; jam tangan perak bertali hitam): tutorial ilmu AI, terutama video AI. Nama akun: **Rio | Suhu Digital**.
- Akun 2 · **Mia** (wanita sekitar 30 tahun, foto `figur/mia.jpg`, hijab georgette abu tua; Kardigan lavender + celana lebar beige, Blazer navy, Dress anggun): tutorial affiliate dengan video AI. Nama akun: **Mia | Affiliate Pakai AI** (username @suhudigital123 tetap).
- Akun 3 · **Nara** (wanita 26 tahun, foto `figur/nara.jpg`; hijab sifon beige, jam tangan perak, 5 pakaian dari karakter sheet: kasual, traveling, formal, rumah, olahraga): produk digital dan AI. Nama akun: **Nara | Produk Digital AI**. (Karakter sheet Nara dari pengguna sempat berjudul "Mia": salah tulis, itu Nara.)
- **Rio dan Nara berpacaran, Mia sahabat mereka (SP9).** Interaksi Rio dan Nara selalu **sopan dan hangat**: boleh berdampingan, saling menyemangati, bercanda; tidak berpelukan, mencium, atau bermesraan (`ATURAN_PASANGAN`, dikirim ke AI bila keduanya tampil). Format kolaborasi "💑 Konten Rio & Nara" (mesin Serba Bisa).
- Kolaborasi: Lokasi: ruang kerja masing-masing (tetap), tempat kumpul tetap (Markas, Kafe langganan, Teras atap), tempat jumpa lain yang bisa berganti.
- Pakaian disusun dari bagian `b` (Indonesia) dan `e` (Inggris): hijab, atasan, bawahan, sepatu, aksesori. **SP13:** "⚙️ Atur detail pakaian (opsional)" per figur (hijab hanya Mia/Nara, + warna utama); bagian yang diisi saja yang mengganti (`pakaianFigur`), kosong = gaya khas figur; ikut Kode Proyek. **SP11:** "👫 Kembar serasi" Rio & Nara (otomatis di format Konten Rio & Nara; konteks MATCHING OUTFITS). Setiap outfit punya sepatu tetap (SP3). Dengan foto wajah, usia/wajah/rambut tidak dikirim ke AI (SP2).

## Cara kerja
- `pemanggil-studio-pribadi.html` ditempel di Canvas (memuat penanda alamat AI Gemini, tanpa `document.write`), mengambil `studio-pribadi.html` dari `main`.
- Setiap video berjalan di iframe `srcdoc` sendiri (maks. 3). Mesin = `kreator.html` atau `serba-bisa.html` dari repo **Sugimation main**, diambil saat dibuka. AI dari bingkai dititipkan ke halaman utama lewat `postMessage` (cara Satu Pintu); halaman utama menambahkan **konteks akun** ke setiap perintah AI teks (`tambahKonteks`, `konteksKini`: lokasi mengikuti `selections.lokasi` di bingkai).
- `PERSONA()` dijalankan di bingkai setelah mesin: membungkus `resetProject` (isi figur, foto, lokasi, `namaUsaha`), `afterLokasi`, `buildLokasiHtml`/`buildPemeranHtml` (kartu figur/lokasi akun di atas), `openProject` (foto kembali), `goNew`/`goHome` (kembali ke Beranda Studio Pribadi), dan mengganti logo. Bila nama fungsi mesin berubah, aplikasi menampilkan "Perlu pembaruan".
- SP14: sisipan rekaman layar ditaruh di scene yang ucapannya menjelaskan langkah itu (aturan SCREEN RULE di konteks). SP15: `PERSONA` membungkus `kPromptCard` untuk menambah pengingat `.sp-ingat` di bawah Prompt Video bila figur memakai foto (lampirkan Character Sheet di Google Flow).
- Ajakan penutup (SP5): pilihan per akun, maks. 2, "Tulis ajakan sendiri", jadwal live opsional; dikirim lewat konteks (CLOSING CALL TO ACTION) dan diperiksa QC (aturan K101 di mesin Sugi).

- **SP16 simpan otomatis (V1.5):** kotak "☁️ Simpan otomatis" di atas Beranda dan di Proyek Saya. Masuk dengan **email dan sandi admin Satu Pintu** (Firebase `sugi-studio-ai` lewat REST, `FB` di kode; tidak perlu mengubah aturan Firestore karena admin boleh menulis `pengguna/{uid}/**`). Pemantau 3 detik (`sinkron`) membaca riwayat mesin di localStorage (`sugimation_kreator3_history`, `sugimation_serbabisa3_history`; bingkai `srcdoc` berbagi localStorage dengan halaman utama) dan mengunggah proyek yang berubah ke `pengguna/{uid}/pribadi/{mesin}_{id}` {mesin, judul, akun, waktu, data (JSON)}, terpisah dari Proyek Saya Satu Pintu (`pengguna/{uid}/proyek`). Proyek di atas 900 KB tidak diunggah (peringatan). Halaman "📂 Proyek Saya" (dulu Lanjutkan Proyek) = gabungan proyek di akun + di HP (☁️/📱), tombol Buka (`bukaSimpanan` -> `lanjutTeks` dengan JSON + label app) dan 🗑 (hapus dari akun dan HP), plus kotak tempel Kode Proyek. Status masuk disimpan di localStorage `sp_sesi` (hilang saat Canvas ditutup, jadi masuk lagi setiap membuka). Foto tidak ikut disimpan.

## Uji
- `node uji/uji.js` (Playwright dari `/opt/npm-tools/node_modules/playwright` atau `playwright` biasa, harness Sugi di folder dapur `DAPUR`). Mesin Sugi diambil dari folder `SUGIMATION` (bawaan `/home/claude/sugimation`, kalau tidak ada `/home/user/Sugimation`). 67 uji, semua harus lolos.
- `node uji/uji_simpan.js` (SP16, 19 uji, Firebase tiruan yang meniru aturan Firestore: hanya admin di jalurnya sendiri). Yang hanya bisa dibuktikan di Canvas: koneksi Firebase sungguhan dari Canvas Studio Pribadi.
