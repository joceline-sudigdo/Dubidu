import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { showAlert } from './dialog';

export type PdfSection = { title: string; rows?: [string, string][]; paragraphs?: string[]; bullets?: string[] };

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

  return `<!doctype html><html><head><meta charset="utf-8" />
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

// buat PDF lalu buka menu simpan/bagikan (web: dialog print bawaan browser)
export async function downloadPdf(title: string, subtitle: string, sections: PdfSection[]) {
  try {
    const html = buildHtml(title, subtitle, sections);
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
    } else {
      showAlert('PDF tersimpan', `File tersimpan di: ${uri}`);
    }
  } catch {
    showAlert('Gagal membuat PDF', 'Coba lagi beberapa saat lagi.');
  }
}
