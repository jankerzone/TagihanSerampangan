# TagihanSerampangan

Proyek ini adalah aplikasi web yang dibangun menggunakan React, Vite, TypeScript, dan di-styling dengan Tailwind CSS serta komponen dari shadcn/ui.

## Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Memulai

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

1.  **Clone repositori:**
    ```bash
    git clone git@github.com:jankerzone/TagihanSerampangan.git
    cd TagihanSerampangan
    ```

2.  **Install dependensi:**
    Disarankan menggunakan `pnpm`.
    ```bash
    pnpm install
    ```

3.  **Jalankan server development:**
    ```bash
    pnpm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173`.

## Skrip yang Tersedia

Dalam file `package.json`, terdapat beberapa skrip yang dapat Anda gunakan:

- `pnpm run dev`: Menjalankan aplikasi dalam mode development.
- `pnpm run build`: Mem-build aplikasi untuk production ke dalam folder `dist`.
- `pnpm run lint`: Menjalankan ESLint untuk memeriksa masalah dalam kode.
- `pnpm run preview`: Menjalankan server lokal untuk melihat hasil build production.

## Struktur Folder

Struktur folder utama dalam proyek ini adalah sebagai berikut:

```
/
├── public/         # Aset statis
├── src/
│   ├── components/   # Komponen UI (termasuk shadcn/ui)
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilitas dan fungsi bantuan
│   ├── pages/        # Halaman-halaman aplikasi
│   ├── utils/        # Utilitas umum
│   ├── App.tsx       # Komponen root dan routing
│   └── main.tsx      # Titik masuk aplikasi
└── package.json      # Dependensi dan skrip proyek
```

## Panduan Kontribusi

- **Struktur Kode**:
    - Semua kode sumber berada di dalam direktori `src`.
    - Halaman ditempatkan di `src/pages/`.
    - Komponen yang dapat digunakan kembali ditempatkan di `src/components/`.
    - Halaman utama (default) adalah `src/pages/Index.tsx`.

- **Komponen & Styling**:
    - **Gunakan shadcn/ui**: Manfaatkan komponen yang sudah ada dari `shadcn/ui` sebisa mungkin. Semua komponen sudah ter-install.
    - **Tailwind CSS**: Gunakan kelas utilitas Tailwind CSS untuk semua styling.
    - **Ikon**: Gunakan ikon dari `lucide-react`.

- **Routing**:
    - Konfigurasi routing aplikasi berada di `src/App.tsx`. Pastikan untuk mendaftarkan halaman baru di sana.