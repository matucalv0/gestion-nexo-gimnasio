import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

const API_URL = "/membresias";

export function init() {
  const tablaBody = document.getElementById("tablaMembresiasBody");

  // Botones Home y Logout
  document
    .getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

  document.getElementById("btnLogout")?.addEventListener("click", logout);

  // Botón Nueva Membresía
  document.getElementById("btnNuevaMembresia").addEventListener("click", () => {
    navigateTo("registrar-membresia");
  });

  // Cargar membresías
  cargarMembresias(tablaBody);
}

export function destroy() {
  // Cleanup if needed
}

async function cargarMembresias(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar membresías");
    const membresias = await res.json();
    renderMembresias(tablaBody, membresias);
  } catch (err) {
    console.error(err);
    Alerta.error("No se pudieron cargar las membresías");
    tablaBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <p class="text-gray-500 text-sm">No se pudieron cargar las membresías</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderMembresias(tablaBody, membresias) {
  const emptyState = document.getElementById("emptyStateMembresias");

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll("tr:not(#emptyStateMembresias)");
  rows.forEach((row) => row.remove());

  if (!membresias?.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add("hidden");

  membresias.forEach((m) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#161616] transition-colors group";

    // Formatters
    const isActiva = m.estado;
    const duracionFmt = `${m.duracionDias} <span class="text-xs text-gray-500">días</span>`;
    const asisFmt =
      m.asistenciasPorSemana === null
        ? `<span class="italic text-gray-500">Ilimitadas</span>`
        : `${m.asistenciasPorSemana} <span class="text-xs text-gray-500">/ sem</span>`;
    const precioFmt = `<span class="text-gray-400">$</span><span class="text-gray-200 font-bold tracking-tight">${Number(m.precioSugerido).toLocaleString("es-AR")}</span>`;

    // Type Badge Colors
    let tipoColor = "text-gray-400 bg-gray-500/10 border-gray-500/20";
    if (m.tipoMembresia === "MUSCULACION")
      tipoColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (m.tipoMembresia === "FUNCIONAL")
      tipoColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (m.tipoMembresia === "MIXTA")
      tipoColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";

    const estadoDot = isActiva
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    const estadoTextClass = isActiva
      ? "text-gray-300"
      : "text-gray-500 line-through";

    tr.innerHTML = `
      <td class="py-4 px-6">
          <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full ${estadoDot}"></span>
              <span class="font-bold text-white tracking-tight ${estadoTextClass} group-hover:text-[var(--orange)] transition-colors">${m.nombre}</span>
          </div>
      </td>
      <td class="py-4 px-6 text-gray-300 font-medium">${duracionFmt}</td>
      <td class="py-4 px-6 text-gray-300 font-medium">${asisFmt}</td>
      <td class="py-4 px-6 text-lg tabular-nums">${precioFmt}</td>
      <td class="py-4 px-6">
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tipoColor}">
              ${m.tipoMembresia}
          </span>
      </td>
      <td class="py-4 px-6">
        <div class="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button class="editarMembresia w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] border border-[#333] flex items-center justify-center text-gray-400 hover:text-white transition-colors" title="Gestionar Plan">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
        </div>
      </td>
    `;

    // Evento click para editar
    tr.querySelector(".editarMembresia").addEventListener("click", () => {
      navigateTo("editar-membresia", { id: m.idMembresia });
    });

    tablaBody.appendChild(tr);
  });
}
