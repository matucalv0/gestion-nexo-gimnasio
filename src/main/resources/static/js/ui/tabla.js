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
    const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";

    const row = document.createElement("tr");
    row.className = `${rowBg} border-b border-gray-200 hover:bg-gray-100`;

    // Columnas
    columns.forEach(col => {
      const td = document.createElement("td");
      td.className = "px-6 py-4 text-gray-800";

      if (typeof col === "function") {
        td.innerHTML = col(item, i);
      } else if (typeof col === "string") {
        td.textContent = item[col] ?? "";
      }

      row.appendChild(td);
    });

    // Acción
    const actionTd = document.createElement("td");
    actionTd.className = "px-6 py-4";

    if (actionBtnFn) {
      actionTd.appendChild(actionBtnFn(item, i));
    }

    row.appendChild(actionTd);

    tbodyEl.appendChild(row);
  });
}
