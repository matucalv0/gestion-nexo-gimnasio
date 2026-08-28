import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderMasterTable, createStatusBadge, ICONS } from "../ui/tabla.js";
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
    renderMembresiasTable(tablaBody, membresias);
  } catch (err) {
    console.error(err);
    Alerta.error("No se pudieron cargar las membresías");
  }
}

function renderMembresiasTable(tablaBody, membresias) {
  const emptyState = document.getElementById("emptyStateMembresias");

  renderMasterTable({
    tbody: tablaBody,
    emptyElement: emptyState,
    data: membresias,
    columns: [
      {
        render: (m) => {
          const isActiva = m.estado;
          const estadoDot = isActiva
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
          const estadoTextClass = isActiva ? "text-white" : "text-gray-500 line-through";

          return `
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full ${estadoDot}"></span>
              <span class="font-bold tracking-tight ${estadoTextClass} group-hover:text-[var(--orange)] transition-colors">${m.nombre}</span>
            </div>
          `;
        }
      },
      {
        field: "duracionDias",
        className: "text-gray-300 font-medium",
        format: (d) => `${d} <span class="text-xs text-gray-500">días</span>`
      },
      {
        render: (m) => {
          if (m.asistenciasPorSemana === null || m.asistenciasPorSemana === undefined) {
            return `<span class="italic text-gray-500">Ilimitadas</span>`;
          }
          return `<span class="text-gray-300 font-medium">${m.asistenciasPorSemana} <span class="text-xs text-gray-500">/ sem</span></span>`;
        }
      },
      {
        field: "precioSugerido",
        className: "font-mono font-bold text-gray-200 tabular-nums",
        format: (p) => `$ ${Number(p || 0).toLocaleString("es-AR")}`
      },
      {
        render: (m) => {
          let tipoColor = "text-gray-400 bg-gray-500/10 border-gray-500/20";
          if (m.tipoMembresia === "MUSCULACION") tipoColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
          if (m.tipoMembresia === "FUNCIONAL") tipoColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
          if (m.tipoMembresia === "MIXTA") tipoColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";

          return `
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tipoColor}">
              ${m.tipoMembresia}
            </span>
          `;
        }
      }
    ],
    actions: [
      {
        icon: "edit",
        type: "primary",
        title: "Gestionar Plan",
        onClick: (m) => {
          navigateTo("editar-membresia", { id: m.idMembresia });
        }
      }
    ]
  });
}
