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
  const badgeColor = m.tipoMovimiento === "INGRESO" ? "text-green-400" : "text-red-400";

  return `
    <td class="px-6 py-4">${formatDate(m.fecha)}</td>

    <td class="px-6 py-4">
      <span class="px-3 py-1 text-xs rounded-full border ${badgeColor}">
        ${m.tipoMovimiento}
      </span>
    </td>

    <td class="px-6 py-4 font-semibold text-[var(--beige)]">
      $ ${Number(m.monto).toLocaleString()}
    </td>

    <td class="px-6 py-4 flex gap-3">
      <button
        type="button"
        class="text-[var(--orange)] font-semibold hover:underline"
        data-action="detalle"
        data-id="${m.idReferencia}"
        data-tipo="${m.tipoMovimiento}">
        Ver detalle
      </button>
      <button
        type="button"
        class="text-red-500 font-semibold hover:underline"
        data-action="eliminar"
        data-id="${m.idReferencia}"
        data-tipo="${m.tipoMovimiento}">
        Eliminar
      </button>
    </td>
  `;
}

/**
 * @param {{ idReferencia: number|string, tipoMovimiento: string }} m
 */
export function movimientoDetailRowHtml(m) {
  const { contentId } = detalleRowIds(m);

  return `
    <td colspan="4" class="px-6 py-4 bg-[#0f0f0f]">
      <div
        id="${contentId}"
        class="bg-[#121212] border border-[var(--input-border)] rounded-xl p-5 shadow-inner text-sm text-gray-400">
        Cargando detalle...
      </div>
    </td>
  `;
}

/**
 * @param {{ detalles?: Array<{tipo:string,nombre:string,cantidad:number,precioUnitario:number}> }} pago
 */
export function detalleIngresoHtml(pago) {
  if (!pago?.detalles || !pago.detalles.length) {
    return `<p class="text-sm text-gray-400">Sin detalle.</p>`;
  }

  return `
    <div class="space-y-3">
      ${pago.detalles
        .map(
          (d) => `
          <div class="bg-[#181818] border border-[var(--input-border)] rounded-lg p-3 flex justify-between">
            <div>
              <p class="text-xs text-gray-400">${d.tipo}</p>
              <p class="font-medium">${d.nombre}</p>
              <p class="text-xs text-gray-400">Cantidad: ${d.cantidad}</p>
            </div>

            <div class="text-right">
              <p class="text-sm text-gray-400">Unitario</p>
              <p class="font-semibold">$ ${d.precioUnitario}</p>
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
    <div class="text-sm space-y-2">
      <p>
        <span class="text-gray-400">Tipo:</span><br>
        ${gasto?.categoria?.trim() || "Sin categoria"}
      </p>

      <p>
        <span class="text-gray-400">Descripción:</span><br>
        ${gasto?.proveedor?.trim() || "Sin descripción"}
      </p>
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

