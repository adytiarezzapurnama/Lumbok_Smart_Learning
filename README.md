# LUMBOK SMART LEARNING — Paket Penyempurnaan

## Perubahan pada paket ini
- Tombol evaluasi paket dan evaluasi per materi tersambung ke Bank Soal berdasarkan paket; soal dapat diberi kaitan materi opsional.
- Hasil quiz menyimpan nama siswa, paket/materi, waktu, nilai, dan jumlah jawaban benar untuk dibaca di Studio Guru → Hasil Belajar.
- Mode Siswa menampilkan sumber materi yang dipublikasikan guru (teks, rumus, gambar, video, file unduhan, tautan, aktivitas, dan pertanyaan) serta daftar game yang telah diimpor.
- Game HTML dapat dimainkan dari Mode Siswa maupun pratinjau Game Library.
- MathLive 0.111.0 disertakan secara lokal; tidak memerlukan CDN. Tombol Keyboard Virtual mengambang dengan lapisan teratas, tetap tersedia saat dialog materi/quiz terbuka, dan dapat menyisipkan rumus ke kolom teks aktif.
- Service worker diperbarui untuk cache aset MathLive dan memperbarui cache versi lama.

## Cara menjalankan
1. Ekstrak ZIP.
2. Jalankan melalui server lokal atau unggah seluruh isi folder ke GitHub Pages. Untuk PWA/offline, buka setidaknya sekali saat online.
3. Login guru dengan PIN awal `LUMBOK2026`; segera ubah melalui Pengaturan Guru.
4. Buat paket, materi, soal, dan impor game HTML. Centang “Tampilkan kepada siswa” pada materi.
5. Siswa membuka Mode Siswa → paket → Belajar, lalu membaca materi dan memilih evaluasi atau game.
6. Guru memeriksa rekap di Studio Guru → Hasil Belajar.

## Catatan penyimpanan
Data disimpan di IndexedDB browser/perangkat yang sedang digunakan. Agar data berpindah perangkat, gunakan Backup dan Restore. File besar (terutama video) dapat memenuhi kuota penyimpanan browser; gunakan tautan video bila perlu. Game impor harus berupa file HTML mandiri atau menyertakan sumber daya yang sudah tertanam/relatif tersedia.

## Pemeriksaan
`app.js` telah diperiksa dengan `node --check`. Uji akhir alur interaktif tetap perlu dilakukan pada browser target setelah unggah, karena IndexedDB, PWA cache, izin autoplay, dan kuota penyimpanan bergantung pada browser/perangkat.
