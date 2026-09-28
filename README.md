# Bengkel Coding — Rakit PC Simulator

Project simulator rakit PC 3D ini dibuat dan dikembangkan oleh **Bengkel Coding** untuk belajar arsitektur komputer melalui perakitan komponen PC.

## Menjalankan simulator

Pastikan Python 3 tersedia. Dari folder project, jalankan:

```powershell
py -m http.server 8080 --bind 127.0.0.1 --directory src
```

Buka <http://localhost:8080/>. Pilih preset untuk memulai. Tidak perlu memasang dependency atau menjalankan database/backend. Koneksi internet diperlukan untuk memuat Three.js dari CDN.

## Isi project

- `src/index.html` — antarmuka dan simulasi Three.js.
- `src/assets/models` — model 3D dan lisensi masing-masing aset.
- `src/assets/images` dan `src/assets/gif` — gambar dan animasi project.
- `legacy-backup.zip` — salinan kode aplikasi lama.

## Lisensi

Kode sumber proyek asal dilisensikan di bawah MIT License dan atribusi Vincent Chin tetap dipertahankan di [LICENSE](LICENSE). Bengkel Coding mengembangkan versi simulator ini. Aset model dapat memiliki lisensi berbeda; lihat file `license.txt` pada folder model terkait.
