// Templates HTML (strings) del módulo Finanzas
// Nota: mantenemos Tailwind/estilos existentes para coherencia visual.

import { formatCurrency, formatDate } from "./formatters.js";

/**
 * @param {{ idReferencia: number|string, tipoMovimiento: string }} m
 */
export function detalleRowIds(m) {
  return {
    rowId: `detalle-${m.idReferencia}-${m.tipoMovimiento}`,
    contentId: `detalle-content-${m.idReferencia}-${m.tipoMovimiento}`,
  };
}

/**
 * @param {{ idReferencia: number|string, tipoMovimiento: string, fecha: string, monto: number }} m
 */
export function movimientoMainRowHtml(m) {
  const badgeClass = m.tipoMovimiento === "INGRESO" ? "badge-success" : "badge-danger";

  return `
    <td>${formatDate(m.fecha)}</td>
    <td>
      <span class="badge ${badgeClass}">${m.tipoMovimiento}</span>
    </td>
    <td class="font-semibold text-[var(--beige)]">$ ${Number(m.monto).toLocaleString()}</td>
    <td>
      <div class="flex gap-2">
        <button type="button" class="table-action-btn" data-action="detalle" data-id="${m.idReferencia}" data-tipo="${m.tipoMovimiento}" title="Ver detalle">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <button type="button" class="table-action-btn table-action-btn-danger" data-action="eliminar" data-id="${m.idReferencia}" data-tipo="${m.tipoMovimiento}" title="Eliminar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </td>
  `;
}

/**
 * @param {{ idReferencia: number|string, tipoMovimiento: string }} m
 */
export function movimientoDetailRowHtml(m) {
  const { contentId } = detalleRowIds(m);

  return `
    <td colspan="4" class="p-0">
      <div id="${contentId}" class="detail-panel">
        <p class="text-sm text-gray-500">Cargando detalle...</p>
      </div>
    </td>
  `;
}

/**
 * @param {{ detalles?: Array<{tipo:string,nombre:string,cantidad:number,precioUnitario:number}> }} pago
 */
export function detalleIngresoHtml(pago) {
  if (!pago?.detalles || !pago.detalles.length) {
    return `<p class="text-sm text-gray-500">Sin detalle.</p>`;
  }

  return `
    <h4 class="detail-panel-title">Detalle del ingreso</h4>
    <div class="detail-items">
      ${pago.detalles
        .map(
          (d) => `
          <div class="detail-item">
            <div>
              <p class="detail-item-type">${d.tipo}</p>
              <p class="detail-item-name">${d.nombre}</p>
              <p class="detail-item-qty">Cantidad: ${d.cantidad}</p>
            </div>
            <div class="text-right">
              <p class="detail-item-label">Unitario</p>
              <p class="detail-item-price">$ ${d.precioUnitario}</p>
            </div>
          </div>
        `,
        )
        .join("")}
    </div>
  `;
}

/**
 * @param {{ categoria?: string, proveedor?: string }} gasto
 */
export function detalleGastoHtml(gasto) {
  return `
    <h4 class="detail-panel-title">Detalle del gasto</h4>
    <div class="detail-items">
      <div class="detail-item">
        <div>
          <p class="detail-item-type">Categoría</p>
          <p class="detail-item-name">${gasto?.categoria?.trim() || "Sin categoría"}</p>
        </div>
      </div>
      <div class="detail-item">
        <div>
          <p class="detail-item-type">Proveedor</p>
          <p class="detail-item-name">${gasto?.proveedor?.trim() || "Sin descripción"}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Para KPIs
 * @param {number|string} current
 * @param {number|string} previous
 */
export function kpiValueHtml(current, previous) {
  return {
    current: formatCurrency(current),
    previous: formatCurrency(previous),
  };
}

