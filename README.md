# LUMBOK SMART LEARNING — V1.8 CLOUD SYNC

## Model yang diterapkan
**Online → Offline → Online kembali**

LUMBOK Smart Learning dirancang sebagai aplikasi pembelajaran **offline-first** untuk sekolah dengan jaringan dan listrik yang tidak selalu stabil. Internet menjadi pendukung, bukan prasyarat fitur inti.

### Saat ONLINE
- Guru dapat memperbarui paket, materi, soal, dan game.
- Perubahan otomatis dikirim ke cloud jika sinkronisasi Firebase sudah dikonfigurasi.
- Perangkat lain yang memakai Firebase Project dan Kode Sekolah yang sama menerima perubahan secara otomatis.
- Hasil quiz dan pengumpulan tugas dapat kembali ke perangkat Guru.

### Saat OFFLINE
- Paket, materi, soal, game, quiz, dan pengumpulan tugas tetap dapat digunakan dari IndexedDB.
- Perubahan lokal masuk antrean sinkronisasi.
- Status aplikasi berubah menjadi **Offline • tersimpan lokal**.

### ONLINE KEMBALI
- Antrean perubahan dikirim otomatis.
- Perubahan dari perangkat lain ditarik kembali.
- Status berubah menjadi **Online • Tersinkron** jika koneksi cloud berhasil.

## Fitur
- Mode Siswa dan Studio Guru.
- Paket Belajar, Materi, Bank Soal, Hasil Belajar.
- Game Library terpisah dari Paket Belajar, tetapi tetap dapat dimainkan siswa.
- Keyboard matematika MathLive yang dapat dibuka/tutup dan digunakan saat mengisi bidang matematika.
- Upload Tugas beberapa file sekaligus, maksimal 20 MB per file.
- Pengumpulan tugas Guru.
- Backup/Restore manual sebagai cadangan tambahan.
- Automatic cloud sync untuk paket, materi, soal, game, hasil, dan pengumpulan tugas.
- Service worker/PWA untuk aset aplikasi lokal.

## Setup Firebase

**Project Firebase sudah dipasang ke konfigurasi web yang diberikan pengguna.** Default kode sekolah pada paket ini adalah `SMPN1LUMBOK-2026`. Pada penggunaan pertama, pastikan **Authentication → Anonymous** diaktifkan dan Realtime Database sudah dibuat. Jika Anda ingin mengganti ruang sinkronisasi, buka Pengaturan Guru.

Lihat **FIREBASE_SETUP.md** untuk langkah lengkap.

Ringkasnya:
1. Buat Firebase Project.
2. Tambahkan Web App dan salin `firebaseConfig`.
3. Aktifkan Authentication → Anonymous.
4. Aktifkan Realtime Database.
5. Atur Database Rules sesuai kebutuhan sekolah.
6. Login Guru → Pengaturan Guru → Sinkronisasi Sekolah.
7. Masukkan Firebase Web Config dan Kode Sekolah.
8. Pada semua perangkat, gunakan project Firebase dan Kode Sekolah yang sama.

## Catatan keamanan
Firebase Web Config bukan password rahasia. Namun **Realtime Database Rules menentukan keamanan data**. Contoh `firebase-rules.json` dalam paket adalah rules sederhana untuk prototipe dan bukan konfigurasi keamanan tingkat tinggi untuk data siswa yang sensitif. Untuk deployment nyata, gunakan Authentication dan rules berbasis identitas/kelas.

## Catatan file besar
V1.8 mempertahankan penyimpanan file aplikasi sebagai data lokal agar offline-first tetap sederhana. Untuk penggunaan dengan banyak file besar, tahap berikutnya sebaiknya memindahkan file tugas, video, gambar besar, dan game besar ke **Firebase Storage**, sedangkan Realtime Database menyimpan metadata dan status sinkronisasi.

## Pemeriksaan paket
- `node --check app.js` berhasil.
- Struktur ZIP diuji dengan `unzip -t`.
- PWA cache dinaikkan ke `lsl-v5`.

## GitHub Pages
Unggah seluruh isi ZIP ke repository GitHub Pages. Tidak perlu server Node. Firebase menjadi layanan cloud eksternal; aplikasi tetap dapat berjalan dari GitHub Pages sebagai static web/PWA.
