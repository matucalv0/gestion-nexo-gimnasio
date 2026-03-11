import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

const API_URL = "/socios";

// Estado paginación
let currentPage = 0;
const pageSize = 20;

export function init() {
  const tablaBody = document.getElementById("tablaSociosBody");
  const inputBusqueda = document.getElementById("inputBusqueda");
  const filtroActivo = document.getElementById("filtroActivo");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnNuevoSocio = document.getElementById("btnNuevoSocio");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const btnExportar = document.getElementById("btnExportar");

  btnHome?.addEventListener("click", () => {
    history.back();
  });

  btnLogout?.addEventListener("click", logout);

  btnNuevoSocio?.addEventListener("click", () => {
    navigateTo("registrar-socio");
  });

  // Exportar CSV
  btnExportar?.addEventListener("click", exportarCSV);

  // Buscar Button
  btnBuscar?.addEventListener("click", () => {
    currentPage = 0;
    cargarSocios(tablaBody);
  });

  // Enter en buscador
  inputBusqueda?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentPage = 0;
      cargarSocios(tablaBody);
    }
  });

  // Filtro Estado Change
  filtroActivo?.addEventListener("change", () => {
    currentPage = 0;
    cargarSocios(tablaBody);
  });

  // Limpiar
  btnLimpiar?.addEventListener("click", () => {
    inputBusqueda.value = "";
    filtroActivo.value = ""; // Todos
    currentPage = 0;
    cargarSocios(tablaBody);
  });

  // Carga inicial
  cargarSocios(tablaBody);

  // Foco automático en el input de búsqueda
  const params = getRouteParams();
  if (params.get("focus") === "true" || !params.has("focus")) {
    inputBusqueda?.focus();
  }
}

export function destroy() {
  // Limpiar event listeners no anclados al DOM si es necesario
}

async function cargarSocios(tablaBody) {
  try {
    const q = document.getElementById("inputBusqueda").value;
    const activo = document.getElementById("filtroActivo").value;

    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (activo) url += `&activo=${activo}`;

    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error("No se pudo obtener la lista de socios");
    }
    const pageData = await res.json();

    renderSocios(tablaBody, pageData.content);

    // Render paginación
    renderPagination(
      document.getElementById("paginationContainer"),
      pageData.page,
      pageData.totalPages,
      (newPage) => {
        currentPage = newPage;
        cargarSocios(tablaBody);
      },
    );
  } catch (err) {
    console.error("Error al cargar socios", err);
    Alerta.error("No se pudieron cargar los socios");
  }
}

function renderSocios(tablaBody, socios) {
  const emptyState = document.getElementById("emptyStateSocios");

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll("tr:not(#emptyStateSocios)");
  rows.forEach((row) => row.remove());

  if (!socios || !socios.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  socios.forEach((s, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("hover:bg-[#161616]", "transition-colors", "group");
    if (index < 10) {
      tr.classList.add("animate-fade-in-up");
      tr.style.animationDelay = `${index * 50}ms`;
    }

    const isActivo = s.activo === true;

    // Generar Avatar (color hash basado en el nombre)
    const nombreCompleto = s.nombre || "Desconocido";
    const iniciales = nombreCompleto
      .split(" ")
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join("");

    const colors = [
      "bg-rose-500/10 text-rose-400 border-rose-500/20",
      "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "bg-purple-500/10 text-purple-400 border-purple-500/20",
      "bg-orange-500/10 text-orange-400 border-orange-500/20",
      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < nombreCompleto.length; i++) {
      hash = nombreCompleto.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const avatarClass = colors[colorIndex];

    const estadoBtn = isActivo
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
           <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span> Activo
         </span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
           <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Baja
         </span>`;

    tr.innerHTML = `
      <td class="py-4 px-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-sm ${avatarClass}">
            ${iniciales}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-xs">${nombreCompleto}</p>
          </div>
        </div>
      </td>
      <td class="py-4 px-6 text-right">
        <p class="text-sm font-mono text-gray-400 group-hover:text-gray-300 transition-colors">${s.dni}</p>
      </td>
      <td class="py-4 px-6 text-right">
        <div class="flex flex-col items-end">
          <p class="text-sm text-gray-300">${s.telefono || '<span class="text-gray-600">—</span>'}</p>
          <p class="text-xs text-gray-500 max-w-[120px] truncate">${s.email || ""}</p>
        </div>
      </td>
      <td class="py-4 px-6 text-center">
        ${estadoBtn}
      </td>
      <td class="py-4 px-6 text-center">
        <div class="flex items-center justify-center">
          <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-[var(--orange)] hover:bg-[var(--orange)]/10 transition-colors" title="Ver ficha del socio">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () => {
      navigateTo("socio-detalle", { dni: s.dni });
    });

    tablaBody.appendChild(tr);
  });
}

async function exportarCSV() {
  try {
    const q = document.getElementById("inputBusqueda").value;
    const activo = document.getElementById("filtroActivo").value;

    let url = `/exportar/socios?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (activo) url += `activo=${activo}`;

    const res = await authFetch(url);
    if (!res.ok) {
      if (res.status === 403) {
        Alerta.error("Solo administradores pueden exportar");
        return;
      }
      throw new Error("Error al exportar");
    }

    const blob = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = `socios_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(urlBlob);

    Alerta.success("Archivo exportado correctamente");
  } catch (err) {
    console.error("Error exportando", err);
    Alerta.error("No se pudo exportar el archivo");
  }
}
