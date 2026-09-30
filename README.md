# Memory Journey

Web untuk merangkai tiga kenangan menjadi hadiah berbentuk cerita interaktif. Setiap memori memiliki judul dan 1–3 pasangan foto serta cerita. Pengguna dapat melihat pratinjau, membaca ringkasan, lalu membuat tautan untuk dibagikan.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Server Node menjalankan API dan Vite dalam satu proses.

Untuk produksi:

```bash
npm run build
npm start
```

Atur `PORT` bila port 3000 tidak tersedia. Atur `DATA_DIR` ke direktori persisten saat deploy. Secara bawaan, cerita tersimpan di `data/journeys/`; direktori ini diabaikan Git. Hosting statis saja tidak dapat menyimpan atau membuka tautan cerita karena fitur berbagi membutuhkan server Node.

## Alur

1. Isi nama penerima, tiga judul memori, dan 1–3 foto beserta cerita di setiap memori.
2. Baca pratinjau cerita yang bergerak dari pembuka sampai penutup.
3. Lihat ringkasan dan klik **Buat & salin tautan**. Tautan berbentuk `/j/<id>`.

Foto diperkecil di browser sebelum dikirim. Server memvalidasi data dan menyimpan tiap cerita sebagai berkas JSON dengan ID acak. Siapa pun yang memiliki tautan dapat melihat cerita beserta foto; tidak ada akun atau fitur hapus cerita pada versi ini.
