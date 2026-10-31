// ============================================================================
//  Titik masuk untuk Vercel (serverless).
//  Vercel mencari file "index.js" yang mengimpor express dan meng-export aplikasinya.
//  Kode aslinya ada di src/ dan sudah di-build ke dist/ oleh `npm run build`.
//  Server biasa (laptop / Render) tetap memakai `npm start` → dist/index.js.
// ============================================================================
import "express";

import { createApp } from "./dist/app.js";

export default createApp();
