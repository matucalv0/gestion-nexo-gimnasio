import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";
import { renderMasterTable, createAvatarCell, createStatusBadge } from "../ui/tabla.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";
import { formatDate, formatDiasRestantes, formatDiasDesdeVencimiento } from "../utils/date-utils.js";

checkAuth();

const API_URL = "/socios";

// Estado paginación
let currentPage = 0;
const pageSize = 20;

let searchDebounceTimer = null;

export function init() {
  const inputBusqueda = document.getElementById("inputBusqueda");
  const filtroActivo = document.getElementById("filtroActivo");
  const segmentedControl = document.getElementById("segmentedControl");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnNuevoSocio = document.getElementById("btnNuevoSocio");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const btnExportar = document.getElementById("btnExportar");

  btnHome?.addEventListener("click", () => {
    history.back();
  });

  btnLogout?.addEventListener("click", () => {
    logout();
  });

  btnNuevoSocio?.addEventListener("click", () => {
    navigateTo("registrar-socio");
  });

  // Exportar CSV
  btnExportar?.addEventListener("click", exportarCSV);

  // Buscar Button
  btnBuscar?.addEventListener("click", () => {
    clearTimeout(searchDebounceTimer);
    currentPage = 0;
    cargarSocios();
  });

  // Real-time debounced search
  inputBusqueda?.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage = 0;
      cargarSocios();
    }, 300);
  });

  // Enter en buscador
  inputBusqueda?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchDebounceTimer);
      currentPage = 0;
      cargarSocios();
    }
  });

  // Segmented Control Tabs
  if (segmentedControl) {
    const tabs = segmentedControl.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        if (filtroActivo) filtroActivo.value = val;
        
        // Update active classes
        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");

        currentPage = 0;
        cargarSocios();
      });
    });
  }

  // Fallback Filtro Select Change si existe
  filtroActivo?.addEventListener("change", () => {
    currentPage = 0;
    cargarSocios();
  });

  // Limpiar
  btnLimpiar?.addEventListener("click", () => {
    clearTimeout(searchDebounceTimer);
    if (inputBusqueda) inputBusqueda.value = "";
    if (filtroActivo) filtroActivo.value = "TODOS";

    if (segmentedControl) {
      const tabs = segmentedControl.querySelectorAll(".tab-btn");
      tabs.forEach((t) => {
        if (t.getAttribute("data-value") === "TODOS") {
          t.classList.add("active");
        } else {
          t.classList.remove("active");
        }
      });
    }

    currentPage = 0;
    cargarSocios();
  });

  // Carga inicial
  cargarSocios();

  // Foco automático en el input de búsqueda
  const params = getRouteParams();
  if (params.get("focus") === "true" || !params.has("focus")) {
    inputBusqueda?.focus();
  }
}

export function destroy() {
  clearTimeout(searchDebounceTimer);
}

async function cargarSocios() {
  const query = document.getElementById("inputBusqueda")?.value?.trim() || "";
  const filtro = document.getElementById("filtroActivo")?.value || "TODOS";

  try {
    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;

    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    if (filtro && filtro !== "TODOS") {
      url += `&activo=${encodeURIComponent(filtro)}`;
    }

    const res = await authFetch(url);
    if (!res.ok) throw new Error("Error al obtener socios");

    const data = await res.json();

    // Actualizar contadores globales de pestañas
    const totalTodos = (data.totalActivos || 0) + (data.totalVencidos || 0) + (data.totalSinMembresia || 0);
    actualizarContador("contadorTodos", totalTodos);
    if (data.totalActivos !== undefined) actualizarContador("contadorActivos", data.totalActivos);
    if (data.totalVencidos !== undefined) actualizarContador("contadorVencidos", data.totalVencidos);
    if (data.totalSinMembresia !== undefined) actualizarContador("contadorSinMembresia", data.totalSinMembresia);

    // Renderizar la Master Table usando el componente centralizado
    renderSociosTable(data.socios || []);

    // Paginación
    renderPagination(
      document.getElementById("paginationContainer"),
      data.pageNumber || 0,
      data.totalPages || 0,
      (newPage) => {
        currentPage = newPage;
        cargarSocios();
      },
    );
  } catch (err) {
    console.error("Error al cargar socios", err);
    Alerta.error("No se pudieron cargar los socios");
  }
}

function actualizarContador(id, count) {
  const el = document.getElementById(id);
  if (el) el.textContent = count;
}

function renderSociosTable(socios) {
  const tbody = document.getElementById("tablaSociosMasterBody");
  const emptyElement = document.getElementById("emptyMaster");

  renderMasterTable({
    tbody,
    emptyElement,
    data: socios,
    columns: [
      {
        field: "dni",
        className: "text-left",
        format: (dni) => `<span class="text-xs font-mono text-gray-400 group-hover:text-gray-300 transition-colors">${dni}</span>`
      },
      {
        render: (s) => createAvatarCell(s.nombre)
      },
      {
        render: (s) => `
          <div class="flex flex-col items-start">
            <span class="text-xs text-gray-300 font-medium">${s.telefono || '<span class="text-gray-600">—</span>'}</span>
            <span class="text-[11px] text-gray-500 max-w-[140px] truncate">${s.email || ""}</span>
          </div>
        `
      },
      {
        render: (s) => {
          if (s.tieneMembresiaVigente) {
            return createStatusBadge(s.nombreMembresia || "Activa", "success", true);
          } else if (s.diasVencidos !== null && s.diasVencidos !== undefined) {
            return createStatusBadge("Vencida", "danger");
          } else {
            return createStatusBadge("Sin Membresía", "neutral");
          }
        }
      },
      {
        render: (s) => {
          if (s.tieneMembresiaVigente) {
            const diasTexto = formatDiasRestantes(s.diasRestantes);
            const diasColor = s.diasRestantes <= 5 ? "text-orange-400 font-semibold" : "text-green-400 font-medium";
            return `
              <div class="flex flex-col items-start">
                <span class="text-xs ${diasColor}">${diasTexto}</span>
                <span class="text-[11px] text-gray-500 font-mono">${s.fechaVencimientoMembresia ? formatDate(s.fechaVencimientoMembresia) : ""}</span>
              </div>
            `;
          } else if (s.diasVencidos !== null && s.diasVencidos !== undefined) {
            const diasTexto = formatDiasDesdeVencimiento(s.diasVencidos);
            const diasColor = s.diasVencidos > 7 ? "text-red-400 font-semibold" : "text-red-300 font-medium";
            return `
              <div class="flex flex-col items-start">
                <span class="text-xs ${diasColor}">${diasTexto}</span>
                <span class="text-[11px] text-gray-500 font-mono">${s.ultimaMembresiaVencimiento ? formatDate(s.ultimaMembresiaVencimiento) : ""}</span>
              </div>
            `;
          } else {
            return `<span class="text-gray-600 text-xs">—</span>`;
          }
        }
      }
    ],
    actions: [
      {
        icon: "add",
        type: "success",
        title: "Renovar membresía / Cobrar",
        onClick: (s) => navigateTo("registrar-pago", { dni: s.dni })
      },
      {
        icon: "view",
        type: "primary",
        title: "Ver ficha del socio",
        onClick: (s) => navigateTo("socio-detalle", { dni: s.dni })
      }
    ]
  });
}

async function exportarCSV() {
  try {
    const q = document.getElementById("inputBusqueda")?.value || "";
    const activo = document.getElementById("filtroActivo")?.value || "TODOS";

    let url = `/exportar/socios?`;
    if (q.trim()) url += `q=${encodeURIComponent(q.trim())}&`;
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

