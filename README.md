# Layanan Pembelajaran Virtual (LMS)

Aplikasi web pembelajaran daring: akses materi kuliah, pengumpulan tugas, dan ujian online dengan timer serta penilaian otomatis.

> **Versi demo:** semua data disimpan di `localStorage` browser, jadi tiap pengguna hanya melihat datanya sendiri. Untuk penggunaan nyata dengan banyak pengguna, hubungkan ke backend (lihat bagian "Pengembangan lanjutan").

## Fitur
- Login sederhana dengan peran **Mahasiswa** dan **Dosen**
- Materi kuliah (teks atau tautan PDF/video/slide)
- Tugas: mahasiswa mengumpulkan, dosen memberi nilai
- Ujian pilihan ganda dengan timer, auto-submit, dan skor otomatis (satu kali percobaan)

## Menjalankan di komputer
Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Publikasi lewat GitHub Pages
1. Buat repositori baru di https://github.com/new (mis. `lms-virtual`), set **Public**.
2. Di folder proyek:
   ```bash
   git init
   git add .
   git commit -m "Versi awal LMS"
   git branch -M main
   git remote add origin https://github.com/USERNAME/lms-virtual.git
   git push -u origin main
   ```
3. Di GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. Tunggu 1–2 menit. Situs tersedia di `https://USERNAME.github.io/lms-virtual/`.

## Pengembangan lanjutan
GitHub Pages hanya hosting file statis (bukan server). Untuk data bersama dan upload berkas sungguhan:
- **Supabase / Firebase**: autentikasi, database, dan penyimpanan berkas, tetap bisa dari frontend statis.
- **Node.js + Express + database**: deploy ke Render/Railway/Fly.io dari repositori GitHub yang sama.
