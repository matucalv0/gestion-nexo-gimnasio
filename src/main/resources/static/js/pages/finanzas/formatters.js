// Formatters del módulo Finanzas

const LOCALE = "es-AR";

/**
 * Parsea una fecha del backend de forma segura.
 * @param {string|Date} dateValue - Fecha del backend
 * @returns {Date} - Objeto Date en hora local
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;

  const str = String(dateValue);

  // Si es solo fecha (YYYY-MM-DD), parsear como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Si es fecha con hora pero sin timezone
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
    return new Date(str.replace(' ', 'T'));
  }

  return new Date(str);
}

/**
 * @param {unknown} value
 */
export function formatCurrency(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString(LOCALE)}`;
}

/**
 * @param {string|number|Date} value
 */
export function formatDate(value) {
  const date = parseDate(value);
  if (!date || isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(LOCALE);
}

/**
 * @param {number|null|undefined} variacion
 */
export function formatVariation(variacion) {
  if (variacion == null) return null;

  const esPositivo = variacion >= 0;
  return {
    esPositivo,
    icono: esPositivo ? "▲" : "▼",
    value: Math.abs(variacion).toFixed(1),
  };
}

