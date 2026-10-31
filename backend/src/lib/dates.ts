// Semua tanggal disimpan UTC di database. Untuk "hari ini" kita pakai zona WIB (UTC+7),
// supaya check-in jam 06:00 pagi di Indonesia tidak terhitung sebagai hari kemarin.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function wib(date: Date) {
  return new Date(date.getTime() + WIB_OFFSET_MS);
}

/** Tanggal kalender WIB sebagai Date UTC tengah malam (cocok untuk kolom @db.Date). */
export function wibDate(date = new Date()) {
  const d = wib(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** "2026-10-30" */
export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Senin minggu ini (WIB) sebagai tanggal @db.Date */
export function startOfWeekWib(date = new Date()) {
  const today = wibDate(date);
  const mondayOffset = (today.getUTCDay() + 6) % 7; // Sen=0 ... Min=6
  return new Date(today.getTime() - mondayOffset * 86400000);
}

/** Awal & akhir hari ini (WIB) dalam UTC — untuk query "jadwal hari ini". */
export function todayRangeWib(date = new Date()) {
  const start = new Date(wibDate(date).getTime() - WIB_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 86400000) };
}

export function dayShort(date: Date) {
  return DAYS_SHORT[wib(date).getUTCDay()];
}

/** "Jumat, 15:00" */
export function dayTime(date: Date) {
  return `${DAYS_LONG[wib(date).getUTCDay()]}, ${hhmm(date)}`;
}

/** "15:00" (WIB) */
export function hhmm(date: Date) {
  return wib(date).toISOString().slice(11, 16);
}

/** "10 Agu 2026" */
export function shortDate(date: Date) {
  const d = wib(date);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Hitung umur (tahun) dari tanggal lahir */
export function ageFrom(birthDate: Date | null | undefined) {
  if (!birthDate) return null;
  const now = wibDate();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = now.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}
