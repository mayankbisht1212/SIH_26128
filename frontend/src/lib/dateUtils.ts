/**
 * Date formatting utilities for PashuRaksha
 * Standardized to DD/MM/YYYY (ddmmyyyy) format across the application
 */

export function formatDateDDMMYYYY(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (str === 'Overdue' || str === 'None' || str === 'Pending') return str;

  // If already in DD/MM/YYYY or DD-MM-YYYY format
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
    return str.replace(/-/g, '/');
  }

  // If ISO date string YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [year, month, day] = str.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return str;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getCurrentDateDDMMYYYY(): string {
  return formatDateDDMMYYYY(new Date());
}

export function getNextYearDateDDMMYYYY(): string {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return formatDateDDMMYYYY(nextYear);
}
