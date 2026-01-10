// alerta.js

/**
 * Muestra una alerta en un contenedor
 * @param {Object} options
 * @param {string} options.mensaje - Texto de la alerta
 * @param {string} [options.tipo="success"] - Tipo: success | danger | warning
 * @param {HTMLElement|string} [options.contenedor="#alert-container"] - Contenedor donde se agregará la alerta
 * @param {number|null} [options.tiempo=null] - Tiempo en ms para auto-cierre (opcional)
 */
export function mostrarAlerta({ mensaje, tipo = "success", contenedor = "#alert-container", tiempo = null }) {
  const colors = {
    success: "text-green-700 bg-green-100",
    danger: "text-red-700 bg-red-100",
    warning: "text-yellow-700 bg-yellow-100"
  };

  const container = typeof contenedor === "string" ? document.querySelector(contenedor) : contenedor;
  if (!container) return;

  const alertDiv = document.createElement("div");
  alertDiv.className = `flex p-4 mb-4 rounded-lg text-sm ${colors[tipo] || colors.success} items-center justify-between`;
  alertDiv.innerHTML = `
    <span>${mensaje}</span>
    <button type="button" class="ml-4 font-bold" aria-label="Cerrar alerta">✕</button>
  `;

  const btnCerrar = alertDiv.querySelector("button");
  btnCerrar.addEventListener("click", () => alertDiv.remove());

  container.appendChild(alertDiv);

  if (tiempo) setTimeout(() => alertDiv.remove(), tiempo);
}

/**
 * Limpia todas las alertas de un contenedor
 * @param {HTMLElement|string} [contenedor="#alert-container"]
 */
export function limpiarAlertas(contenedor = "#alert-container") {
  const container = typeof contenedor === "string" ? document.querySelector(contenedor) : contenedor;
  if (!container) return;
  container.innerHTML = "";
}






