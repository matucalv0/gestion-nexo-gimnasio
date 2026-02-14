/**
 * Renderiza una tabla dinámica reutilizable.
 *
 * @param {HTMLElement} tbodyEl - El elemento tbody donde se insertan las filas
 * @param {Array} data - Array de objetos a renderizar
 * @param {Array} columns - Array de funciones o strings indicando qué mostrar en cada columna
 * @param {Function} actionBtnFn - Función opcional para renderizar el botón de acción por fila
 */
export function renderTabla(tbodyEl, data, columns, actionBtnFn) {
  tbodyEl.innerHTML = "";

  data.forEach((item, i) => {
    // Alternancia de colores en modo oscuro
    const rowBg = i % 2 === 0 ? "bg-gray-800" : "bg-gray-700/50";

    const row = document.createElement("tr");
    row.className = `${rowBg} border-b border-gray-700 hover:bg-gray-700 transition-colors`;

    // Columnas
    columns.forEach(col => {
      const td = document.createElement("td");
      td.className = "px-6 py-4 text-gray-300";

      if (typeof col === "function") {
        const content = col(item, i);
        if (content instanceof Node) {
          td.appendChild(content);
        } else {
          td.innerHTML = content;
        }
      } else if (typeof col === "string") {
        td.textContent = item[col] ?? "";
      }

      row.appendChild(td);
    });

    // Acción
    const actionTd = document.createElement("td");
    actionTd.className = "px-6 py-4";

    if (actionBtnFn) {
      const btn = actionBtnFn(item, i);
      if (btn) actionTd.appendChild(btn);
    }

    row.appendChild(actionTd);

    tbodyEl.appendChild(row);
  });
}
