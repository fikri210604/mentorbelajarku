# Folder Animasi Loading DotLottie

Letakkan file animasi DotLottie Anda di sini dengan nama:
`loading.lottie` (atau `loading.json`)

Path lengkap di aplikasi:
`public/animations/loading.lottie`

### Cara Pasang:
1. Export animasi dari LottieFiles atau After Effects dengan format **.lottie** (DotLottie).
2. Simpan atau copy file tersebut ke folder ini (`public/animations/loading.lottie`).
3. Sistem secara otomatis mendeteksi file tersebut dan langsung memutarnya di seluruh halaman loading aplikasi!

### (Opsional) Menggunakan Library Resmi `@lottiefiles/dotlottie-react`:
Jika Anda ingin rendering canvas performa tinggi, jalankan perintah:
```bash
pnpm add @lottiefiles/dotlottie-react
```
Lalu aktifkan komponen `<DotLottieReact src="/animations/loading.lottie" loop autoplay />` di dalam `components/shared/dot-lottie-loading.tsx`.
