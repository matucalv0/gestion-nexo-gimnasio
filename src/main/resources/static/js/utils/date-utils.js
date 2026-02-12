/**
 * Utilidades para manejo de fechas
 * Resuelve el problema de timezone cuando el backend envía fechas sin hora (YYYY-MM-DD)
 * que JavaScript interpreta como UTC y puede mostrar un día anterior en zona horaria local
 */

const LOCALE = 'es-AR';

/**
 * Parsea una fecha del backend de forma segura.
 * Si es solo fecha (YYYY-MM-DD), la interpreta como fecha local.
 * Si incluye hora, la parsea normalmente.
 * @param {string|Date} dateValue - Fecha del backend
 * @returns {Date} - Objeto Date en hora local
 */
export function parseDate(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) return dateValue;

  const str = String(dateValue);

  // Si es solo fecha (YYYY-MM-DD), parsear como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Si es fecha con hora pero sin timezone, agregar 'T' si falta
  // Formato: "2024-01-15 10:30:00" -> "2024-01-15T10:30:00"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
    return new Date(str.replace(' ', 'T'));
  }

  // Otros formatos, parsear normalmente
  return new Date(str);
}

/**
 * Formatea una fecha como string legible
 * @param {string|Date} dateValue - Fecha a formatear
 * @param {object} options - Opciones de formato (Intl.DateTimeFormat)
 * @returns {string} - Fecha formateada
 */
export function formatDate(dateValue, options = {}) {
  const date = parseDate(dateValue);
  if (!date || isNaN(date.getTime())) return '-';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };

  return date.toLocaleDateString(LOCALE, defaultOptions);
}

/**
 * Formatea una fecha con hora
 * @param {string|Date} dateValue - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
export function formatDateTime(dateValue) {
  const date = parseDate(dateValue);
  if (!date || isNaN(date.getTime())) return '-';

  return date.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea solo la hora
 * @param {string|Date} dateValue - Fecha a formatear
 * @returns {string} - Hora formateada (HH:mm)
 */
export function formatTime(dateValue) {
  const date = parseDate(dateValue);
  if (!date || isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea fecha en formato corto para tablas
 * @param {string|Date} dateValue - Fecha a formatear
 * @returns {string} - Fecha formateada (dd/mm/yyyy)
 */
export function formatDateShort(dateValue) {
  return formatDate(dateValue);
}

/**
 * Formatea fecha con nombre del mes
 * @param {string|Date} dateValue - Fecha a formatear
 * @returns {string} - Fecha formateada (15 de enero de 2024)
 */
export function formatDateLong(dateValue) {
  const date = parseDate(dateValue);
  if (!date || isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

