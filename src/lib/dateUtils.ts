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
  const [datePart] = dateStr.split('T');
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(dateStr);
  }

  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formata uma data no formato "YYYY-MM-DD" para "DD/MM/YYYY"
 * sem passar pelo objeto Date para evitar qualquer desvio de fuso horário.
 */
export function formatReleaseDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
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
