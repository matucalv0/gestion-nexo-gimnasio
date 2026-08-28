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
  const badgeClass =
    m.tipoMovimiento === "INGRESO" ? "badge-success" : "badge-danger";

  let socioHtml = "—";
  if (m.tipoMovimiento === "INGRESO" && m.dniSocio) {
    socioHtml = `${m.nombreSocio} <span class="text-xs text-gray-400">(${m.dniSocio})</span>`;
  }

  return `
    <td class="py-5 px-6 align-middle">${formatDate(m.fecha)}</td>
    <td class="py-5 px-6 align-middle">${socioHtml}</td>
    <td class="py-5 px-6 align-middle text-center">
      <span class="badge ${badgeClass}">${m.tipoMovimiento}</span>
    </td>
    <td class="py-5 px-6 align-middle text-right font-semibold text-[var(--beige)] font-mono">$ ${Number(m.monto).toLocaleString()}</td>
    <td class="py-5 px-6 align-middle text-gray-500 font-mono text-center">#${m.idReferencia}</td>
    <td class="py-5 px-6 align-middle text-center">
      <div class="flex gap-2 justify-center">
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
    <td colspan="6" class="p-0 border-b border-white/[0.04]">
      <div id="${contentId}" class="detail-panel py-5 px-8 bg-[#0a0a0d] border-t border-b border-white/[0.04]">
        <p class="text-xs text-zinc-500 font-mono">Cargando detalle...</p>
      </div>
    </td>
  `;
}

/**
 * @param {{ detalles?: Array<{tipo:string,nombre:string,cantidad:number,precioUnitario:number}> }} pago
 */
export function detalleIngresoHtml(pago) {
  if (!pago?.detalles || !pago.detalles.length) {
    return `<p class="text-xs text-zinc-500 font-mono">Sin detalle registrado.</p>`;
  }

  return `
    <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Detalle del cobro</h4>
    <div class="detail-items flex flex-col gap-3">
      ${pago.detalles
        .map(
          (d) => `
          <div class="flex justify-between items-center p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div>
              <span class="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">${d.tipo}</span>
              <p class="text-sm text-white font-semibold mt-0.5">${d.nombre}</p>
              <p class="text-xs text-zinc-400 mt-1 font-mono">Cantidad: <span class="text-white font-bold">${d.cantidad}</span></p>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-zinc-400 uppercase tracking-wider">Precio Unitario</span>
              <p class="text-sm text-emerald-400 font-mono font-bold mt-0.5">$ ${Number(d.precioUnitario).toLocaleString()}</p>
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
    <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Detalle del gasto</h4>
    <div class="flex flex-wrap gap-3">
      <div class="flex-1 min-w-[200px] p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <span class="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Categoría</span>
        <p class="text-sm text-white font-semibold mt-0.5">${gasto?.categoria?.trim() || "Sin categoría"}</p>
      </div>
      <div class="flex-1 min-w-[200px] p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <span class="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Proveedor / Observación</span>
        <p class="text-sm text-white font-semibold mt-0.5">${gasto?.proveedor?.trim() || "Sin descripción"}</p>
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
