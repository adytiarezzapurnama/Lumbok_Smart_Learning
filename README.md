# LUMBOK SMART LEARNING — Paket Penyempurnaan

## Perubahan pada paket ini
- Tombol evaluasi paket dan evaluasi per materi tersambung ke Bank Soal berdasarkan paket; soal dapat diberi kaitan materi opsional.
- Hasil quiz menyimpan nama siswa, paket/materi, waktu, nilai, dan jumlah jawaban benar untuk dibaca di Studio Guru → Hasil Belajar.
- Mode Siswa menampilkan sumber materi yang dipublikasikan guru (teks, rumus, gambar, video, file unduhan, tautan, aktivitas, dan pertanyaan).
- Game tidak lagi ditampilkan di dalam Paket Belajar. Game dikumpulkan di fitur **Game Library** khusus siswa dan tetap dapat dimainkan siswa.
- Ditambahkan **Upload Tugas** pada Mode Siswa. Siswa dapat mengirim satu atau beberapa file sekaligus dalam format PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, CSV, TXT/RTF, gambar, ZIP/RAR/7Z, ODT/ODS/ODP. Maksimal 20 MB per file.
- Ditambahkan **Pengumpulan Tugas** di Studio Guru untuk melihat, mengunduh, dan menghapus tugas yang tersimpan. Pengumpulan ikut masuk Backup/Restore.
- MathLive 0.111.0 disertakan secara lokal; tidak memerlukan CDN. Keyboard virtual diperbaiki dengan urutan pemuatan MathLive yang benar, mode keyboard otomatis, tombol buka/tutup yang responsif, dan pemanggilan keyboard saat field difokuskan.
- Game HTML dapat dimainkan dari Game Library siswa maupun pratinjau Game Library guru.
- Service worker diperbarui untuk cache aset MathLive dan memperbarui cache versi lama.

## Cara menjalankan
1. Ekstrak ZIP.
2. Jalankan melalui server lokal atau unggah seluruh isi folder ke GitHub Pages. Untuk PWA/offline, buka setidaknya sekali saat online.
3. Login guru dengan PIN awal `LUMBOK2026`; segera ubah melalui Pengaturan Guru.
4. Buat paket, materi, soal, dan impor game HTML. Centang “Tampilkan kepada siswa” pada materi.
5. Siswa membuka Mode Siswa → paket → Belajar untuk materi/evaluasi; Game tersedia terpisah di **Game Library**.
6. Siswa membuka **Upload Tugas** untuk mengirim file.
7. Guru memeriksa rekap di Studio Guru → Hasil Belajar dan pengumpulan di **Pengumpulan Tugas**.

## Catatan penyimpanan
Data disimpan di IndexedDB browser/perangkat yang sedang digunakan. Agar data berpindah perangkat, gunakan Backup dan Restore. File besar (terutama video) dapat memenuhi kuota penyimpanan browser; gunakan tautan video bila perlu. Game impor harus berupa file HTML mandiri atau menyertakan sumber daya yang sudah tertanam/relatif tersedia.

## Pemeriksaan
`app.js` telah diperiksa dengan `node --check`. Struktur IndexedDB dinaikkan ke versi 2 agar store `submissions` dibuat otomatis pada pembaruan aplikasi. Uji akhir alur interaktif tetap perlu dilakukan pada browser target setelah unggah, karena IndexedDB, PWA cache, izin autoplay, dan kuota penyimpanan bergantung pada browser/perangkat.
