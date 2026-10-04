export interface RatingLabel {
  label: string;
  colorClass: string;
}

const LABELS: Record<number, RatingLabel> = {
  0.5: { label: "Péssimo", colorClass: "text-red-600" },
  1: { label: "Horrível", colorClass: "text-red-500" },
  1.5: { label: "Muito ruim", colorClass: "text-orange-600" },
  2: { label: "Ruim", colorClass: "text-orange-500" },
  2.5: { label: "Fraco", colorClass: "text-amber-500" },
  3: { label: "Regular", colorClass: "text-yellow-400" },
  3.5: { label: "Legal", colorClass: "text-lime-400" },
  4: { label: "Bom", colorClass: "text-green-400" },
  4.5: { label: "Muito bom", colorClass: "text-emerald-400" },
  5: { label: "Obra-prima", colorClass: "text-cyan-400" },
};

/** Maps a 0.5–5 rating (in 0.5 steps) to a descriptive label. */
export function getRatingLabel(rating: number | null | undefined): RatingLabel | null {
  if (!rating || rating <= 0) return null;
  const rounded = Math.min(5, Math.max(0.5, Math.round(rating * 2) / 2));
  return LABELS[rounded] ?? null;
}
