/**
 * =========================================================
 * NEXO UI — Componente Centralizado: Master Table
 * =========================================================
 * Renderizador declarativo y universal para tablas de datos del sistema.
 * Asegura 100% de coherencia visual, rendimiento y estética Dark Tech.
 */

const AVATAR_PALETTE = [
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
];

/**
 * Obtiene iniciales y paleta calculada por hash para avatares consistentes.
 */
export function getAvatarData(nombreCompleto = "") {
  if (!nombreCompleto) return { iniciales: "—", avatarClass: "bg-gray-800 text-gray-400 border-gray-700" };
  const partes = nombreCompleto.trim().split(/\s+/);
  let iniciales = partes[0]?.[0] || "";
  if (partes.length > 1) {
    iniciales += partes[partes.length - 1]?.[0] || "";
  }
  iniciales = iniciales.toUpperCase();

  let hash = 0;
  for (let i = 0; i < nombreCompleto.length; i++) {
    hash = nombreCompleto.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % AVATAR_PALETTE.length;
  return { iniciales, avatarClass: AVATAR_PALETTE[colorIndex] };
}

/**
 * Genera un bloque HTML para celdas de usuario/socio con avatar e información secundaria.
 */
export function createAvatarCell(nombre, subtitulo = "") {
  const { iniciales, avatarClass } = getAvatarData(nombre);
  return `
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center border font-bold text-xs shrink-0 ${avatarClass}">
        ${iniciales}
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">${nombre || "—"}</p>
        ${subtitulo ? `<p class="text-xs text-gray-500 truncate">${subtitulo}</p>` : ""}
      </div>
    </div>
  `;
}

/**
 * Genera un badge de estado estilizado con micro-pulso opcional.
 */
export function createStatusBadge(texto, tipo = "neutral", conPulso = false) {
  let styleClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  let dotColor = "bg-gray-500";

  switch (tipo) {
    case "success":
    case "activa":
    case "completado":
      styleClasses = "bg-green-500/10 text-green-400 border-green-500/20";
      dotColor = "bg-green-400";
      break;
    case "danger":
    case "vencida":
    case "cancelado":
      styleClasses = "bg-red-500/10 text-red-400 border-red-500/20";
      dotColor = "bg-red-400";
      break;
    case "warning":
    case "pendiente":
      styleClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      dotColor = "bg-amber-400";
      break;
    case "info":
      styleClasses = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      dotColor = "bg-blue-400";
      break;
  }

  const pulseClass = conPulso ? "animate-pulse" : "";

  return `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styleClasses}">
      <span class="w-1.5 h-1.5 rounded-full ${dotColor} ${pulseClass}"></span>
      ${texto}
    </span>
  `;
}

/**
 * Íconos SVG comúnmente utilizados en acciones de tabla
 */
export const ICONS = {
  view: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`,
  edit: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`,
  delete: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`,
  add: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
  print: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>`,
  check: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`
};

/**
 * Renderiza una tabla maestra unificada con configuración declarativa.
 *
 * @param {Object} config
 * @param {HTMLElement} config.tbody - Elemento <tbody>
 * @param {HTMLElement} [config.emptyElement] - Elemento de empty state opcional
 * @param {Array} config.data - Lista de objetos a renderizar
 * @param {Array} config.columns - Configuración de columnas
 * @param {Array} [config.actions] - Botones de acción por fila
 * @param {Function} [config.onRowClick] - Evento de clic en fila
 * @param {Boolean} [config.animate=true] - Habilitar micro-animación de entrada
 */
export function renderMasterTable({
  tbody,
  emptyElement,
  data = [],
  columns = [],
  actions = [],
  onRowClick = null,
  animate = true,
}) {
  if (!tbody) return;

  tbody.innerHTML = "";

  // Manejo de estado vacío
  if (!data || data.length === 0) {
    if (emptyElement) emptyElement.classList.remove("hidden");
    return;
  }

  if (emptyElement) emptyElement.classList.add("hidden");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = "group transition-colors";

    if (animate && index < 12) {
      tr.classList.add("animate-fade-in-up");
      tr.style.animationDelay = `${index * 25}ms`;
    }

    if (onRowClick) {
      tr.classList.add("cursor-pointer");
      tr.addEventListener("click", (e) => {
        // Evitar activar click de fila si se hizo clic en un botón de acción
        if (e.target.closest("button") || e.target.closest("a")) return;
        onRowClick(item, index);
      });
    }

    // Renderizado de celdas
    columns.forEach((col) => {
      const td = document.createElement("td");
      if (col.className) td.className = col.className;

      if (typeof col.render === "function") {
        const res = col.render(item, index);
        if (res instanceof HTMLElement) {
          td.appendChild(res);
        } else {
          td.innerHTML = res ?? "";
        }
      } else if (col.field) {
        const val = item[col.field];
        if (typeof col.format === "function") {
          td.innerHTML = col.format(val, item, index) ?? "";
        } else {
          td.textContent = val ?? "—";
        }
      }

      tr.appendChild(td);
    });

    // Renderizado de acciones
    if (actions && actions.length > 0) {
      const actionTd = document.createElement("td");
      actionTd.className = "text-right";

      const actionWrapper = document.createElement("div");
      actionWrapper.className = "flex items-center justify-end gap-1.5";

      actions.forEach((act) => {
        if (typeof act.isVisible === "function" && !act.isVisible(item)) {
          return;
        }

        const btn = document.createElement("button");
        const btnType = act.type || "neutral";
        btn.className = `table-action-btn table-action-btn-${btnType}`;
        btn.title = act.title || "";
        btn.innerHTML = act.svg || ICONS[act.icon] || act.icon || "";

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          act.onClick(item, index, e);
        });

        actionWrapper.appendChild(btn);
      });

      actionTd.appendChild(actionWrapper);
      tr.appendChild(actionTd);
    }

    tbody.appendChild(tr);
  });
}

/**
 * Compatibilidad con la función anterior `renderTabla`
 */
export function renderTabla(tbodyEl, data, columns, actionBtnFn) {
  renderMasterTable({
    tbody: tbodyEl,
    data,
    columns: columns.map(c => typeof c === 'string' ? { field: c } : { render: c }),
    actions: actionBtnFn ? [{ render: actionBtnFn }] : []
  });
}

