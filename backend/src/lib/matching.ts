// Smart-Matching Engine
// Skor 0–100 dari 4 faktor (bobot bisa diubah di sini):
//   - kecocokan kebutuhan anak vs spesialisasi teacher  (60)
//   - jarak / radius lokasi                              (20)
//   - rating & jumlah ulasan                             (10)
//   - status verifikasi                                  (10)

export const WEIGHTS = { needs: 60, distance: 20, rating: 10, verified: 10 };

export type MatchInput = {
  childNeedIds: string[];
  teacherNeedIds: string[];
  distanceKm: number | null;
  radiusKm: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
};

export function matchScore(input: MatchInput) {
  const childNeeds = new Set(input.childNeedIds);
  const overlap = input.teacherNeedIds.filter((id) => childNeeds.has(id)).length;
  const needsRatio = childNeeds.size === 0 ? 0.5 : overlap / childNeeds.size;

  // tanpa koordinat → anggap netral (setengah poin)
  const distanceRatio =
    input.distanceKm == null ? 0.5 : Math.max(0, 1 - input.distanceKm / Math.max(input.radiusKm, 1));

  // rating 0–5, dikoreksi sedikit kalau ulasannya masih sedikit
  const confidence = Math.min(1, input.reviewCount / 10);
  const ratingRatio = ((input.rating / 5) * confidence) + 0.5 * (1 - confidence);

  const score =
    WEIGHTS.needs * needsRatio +
    WEIGHTS.distance * distanceRatio +
    WEIGHTS.rating * ratingRatio +
    WEIGHTS.verified * (input.verified ? 1 : 0);

  return { score: Math.round(score), overlap };
}

/** Jarak dua titik (km) dengan rumus haversine. */
export function distanceKm(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
