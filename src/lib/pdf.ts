import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { showAlert } from './dialog';

export type PdfSection = { title: string; rows?: [string, string][]; paragraphs?: string[]; bullets?: string[] };

// aman walau nilainya kosong / angka
const esc = (t: unknown) =>
  String(t ?? '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// template HTML sederhana bergaya Dubidu untuk diubah jadi PDF
function buildHtml(title: string, subtitle: string, sections: PdfSection[]) {
  const body = sections
    .map(
      (s) => `
      <section>
        <h2>${esc(s.title)}</h2>
        ${s.rows ? `<table>${s.rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>` : ''}
        ${(s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('')}
        ${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </section>`
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" /><title>${esc(title)}</title>
  <style>
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #22324A; padding: 32px; }
    header { background: #3D7ABD; color: #fff; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; }
    header .brand { font-weight: 800; letter-spacing: 2px; font-size: 13px; opacity: .85; }
    header h1 { margin: 6px 0 2px; font-size: 22px; }
    header p { margin: 0; opacity: .9; font-size: 13px; }
    section { border: 1px solid #E3EAF3; border-radius: 14px; padding: 16px 20px; margin-bottom: 14px; }
    h2 { color: #1E528A; font-size: 15px; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 6px 0; border-bottom: 1px solid #F0F3F8; }
    td:last-child { text-align: right; }
    p, li { font-size: 13px; line-height: 1.6; }
    footer { text-align: center; color: #6B7A90; font-size: 11px; margin-top: 24px; }
  </style></head><body>
    <header><div class="brand">DUBIDU</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></header>
    ${body}
    <footer>Dokumen ini dibuat otomatis oleh aplikasi Dubidu · ${new Date().toLocaleDateString('id-ID')}</footer>
  </body></html>`;
}

// buat PDF lalu buka menu simpan/bagikan.
// kalau gagal, cadangannya dialog print bawaan HP (bisa pilih "Simpan sebagai PDF")
export async function downloadPdf(title: string, subtitle: string, sections: PdfSection[]) {
  let html: string;
  try {
    html = buildHtml(title, subtitle, sections);
  } catch (e) {
    showAlert('Gagal membuat PDF', errorText(e));
    return;
  }

  if (Platform.OS === 'web') {
    try {
      await Print.printAsync({ html });
    } catch (e) {
      showAlert('Gagal membuat PDF', errorText(e));
    }
    return;
  }

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const named = await renameFile(uri, title);
    if (Platform.OS === 'android') {
      // dialog print Android pakai nama file dari uri -> pilih "Simpan sebagai PDF"
      await Print.printAsync({ uri: named });
    } else if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(named, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
    } else {
      await Print.printAsync({ uri: named });
    }
  } catch (e) {
    // dialog print yang ditutup user juga dianggap error oleh expo-print, abaikan saja
    if (!/cancel|did not complete/i.test(String(e))) showAlert('Gagal membuat PDF', errorText(e));
  }
}

// pesan teknis dari expo-print berbahasa Inggris, jadi tidak ditampilkan ke pengguna
const errorText = (_e: unknown) => 'Coba lagi beberapa saat lagi.';

// nama file default dari expo-print acak, ganti jadi misal "Dubidu_Report_Card_Elisya_2026-11-01.pdf"
async function renameFile(uri: string, title: string) {
  try {
    const slug = title.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const date = new Date().toISOString().slice(0, 10);
    const dest = new File(Paths.cache, `Dubidu_${slug}_${date}.pdf`);
    if (dest.exists) dest.delete();
    const src = new File(uri);
    try {
      await src.copy(dest);
    } catch {
      // cadangan kalau copy gagal: tulis ulang isi file-nya
      await dest.write(await src.bytes());
    }
    return dest.uri;
  } catch {
    return uri;
  }
}
