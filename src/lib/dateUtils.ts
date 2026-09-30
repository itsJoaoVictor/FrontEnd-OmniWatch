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
