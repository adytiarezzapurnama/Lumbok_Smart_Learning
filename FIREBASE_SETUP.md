# Setup sinkronisasi cloud LUMBOK SMART LEARNING

LUMBOK SMART LEARNING tetap **offline-first**. IndexedDB menjadi penyimpanan lokal, sedangkan Firebase Realtime Database dipakai untuk sinkronisasi antar perangkat ketika internet tersedia.

## 1. Buat Firebase Project
1. Buka Firebase Console: https://console.firebase.google.com/
2. Buat project baru untuk sekolah.
3. Tambahkan **Web App**.
4. Salin object `firebaseConfig` yang diberikan Firebase.

## 2. Aktifkan login anonim
Firebase Console → Authentication → Sign-in method → aktifkan **Anonymous**.

## 3. Buat Realtime Database
Firebase Console → Realtime Database → Create Database.
Pilih lokasi database yang sesuai dan mulai dalam mode rules.

Contoh rules untuk prototipe sekolah:

```json
{
  "rules": {
    "lumbok-smart-learning": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

File contoh tersedia sebagai `firebase-rules.json`.

> Catatan keamanan: rules di atas membuat data dapat diakses oleh pengguna anonim yang mengetahui project dan kode ruang sinkronisasi. Untuk deployment dengan data siswa yang sensitif, gunakan Authentication yang lebih kuat dan rules berbasis identitas/kelas.

## 4. Konfigurasi di aplikasi
Konfigurasi Firebase dari project `lumbok-smart-learning` sudah tertanam sebagai konfigurasi awal pada paket aplikasi. Kode sekolah awal adalah `SMPN1LUMBOK-2026`.

Jika ingin mengganti ruang sinkronisasi: login sebagai Guru → **Pengaturan Guru** → **Sinkronisasi Sekolah**.

Masukkan:
- **Kode Sekolah / Ruang Sinkronisasi**, misalnya `SMPN1LUMBOK-2026`.
- **Firebase Web Config** dari langkah 1.

Klik **Simpan & Aktifkan Sinkronisasi**.

Semua perangkat yang ingin berbagi data harus menggunakan Firebase project dan kode ruang yang sama.

## 5. Cara kerja
- Saat online: perubahan dikirim otomatis ke Firebase.
- Saat offline: perubahan masuk antrean lokal di IndexedDB.
- Saat koneksi kembali: antrean dikirim otomatis.
- Perubahan dari perangkat lain ditarik ke perangkat ini secara otomatis.
- Data inti: paket, materi, bank soal, game, hasil belajar, pengumpulan tugas.
- Backup/Restore tetap tersedia sebagai cadangan manual.

## 6. Batasan penting
Versi ini menyimpan file tugas dan sebagian aset materi/game sebagai data aplikasi. Untuk penggunaan skala besar atau file sangat besar, sebaiknya tahap berikutnya menggunakan Firebase Storage untuk file dan Realtime Database hanya untuk metadata.
