/**
 * Utilitários para manipulação segura de datas de lançamentos
 */

/**
 * Converte uma data de lançamento (ex: "2026-10-02T00:00:00Z" ou "2026-10-02")
 * para um objeto Date seguro no fuso horário local sem shift de fuso horário.
 * 
 * Como as datas de lançamento são originalmente dias de calendário puros (YYYY-MM-DD),
 * o backend as armazena/serializa em UTC meia-noite (00:00:00Z).
 * Em fusos horários negativos (como Brasil UTC-3), parseISO("2026-10-02T00:00:00Z")
 * vira 21:00 do dia 01/10 (dia anterior).
 * 
 * Ao definir o horário para 12:00 (meio-dia) no horário local usando ano, mês e dia,
 * garantimos que a data permaneça exata independentemente do fuso horário ou horário de verão.
 */
export function parseReleaseDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Caso seja apenas data pura de calendário (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }

  // Como o backend armazena datas de lançamento do TMDB em UTC meia-noite (00:00:00 UTC),
  // a serialização em fusos negativos (ex: America/Sao_Paulo UTC-3) gera 'T21:00:00-03:00'.
  // O dia real do calendário original do TMDB é obtido com precisão a partir de getUTCFullYear, getUTCMonth e getUTCDate.
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth();
  const day = parsed.getUTCDate();

  // Cria um objeto Date local fixado ao meio-dia (12:00) para garantir estabilidade visual na UI
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Formata uma data para "DD/MM/YYYY" de forma segura e resiliente a offsets de fuso.
 */
export function formatReleaseDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = parseReleaseDate(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr || "";
  }
}

/**
 * Verifica se uma data de lançamento ainda não ocorreu (data futura em relação a hoje).
 * Compara apenas o dia do calendário (ano, mês, dia) local.
 */
export function isFutureDate(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  const d = parseReleaseDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return d.getTime() > today.getTime();
}
