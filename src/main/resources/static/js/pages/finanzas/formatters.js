// Formatters del módulo Finanzas

const LOCALE = "es-AR";

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
  return new Date(value).toLocaleDateString(LOCALE);
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

