import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";

checkAuth();

const API_URL = "/socios";

// Estado paginación
let currentPage = 0;
const pageSize = 20;

document.addEventListener("DOMContentLoaded", () => {
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
    window.location.href = "registrar-socio.html";
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
  const params = new URLSearchParams(window.location.search);
  if (params.get("focus") === "true" || !params.has("focus")) {
    inputBusqueda?.focus();
  }
});


async function cargarSocios(tablaBody) {
  try {
    const q = document.getElementById("inputBusqueda").value;
    const activo = document.getElementById("filtroActivo").value;

    // Usar endpoint básico que funciona
    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (activo) url += `&activo=${activo}`;

    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error("No se pudo obtener la lista de socios");
    }
    const pageData = await res.json();

    // Obtener info de membresías para los socios
    const dnis = pageData.content.map(s => s.dni);
    let membresiaInfo = {};

    if (dnis.length > 0) {
      try {
        const resMem = await authFetch(`${API_URL}/activo-mes-listado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dnis),
        });
        if (resMem.ok) {
          membresiaInfo = await resMem.json();
        }
      } catch (e) {
        console.error("Error obteniendo info de membresías", e);
      }
    }

    renderSocios(tablaBody, pageData.content, membresiaInfo);

    // Render paginación
    renderPagination(
      document.getElementById("paginationContainer"),
      pageData.page,
      pageData.totalPages,
      (newPage) => {
        currentPage = newPage;
        cargarSocios(tablaBody);
      }
    );

  } catch (err) {
    console.error("Error al cargar socios", err);
    Alerta.error("No se pudieron cargar los socios");
  }
}

function renderSocios(tablaBody, socios, membresiaInfo = {}) {
  const emptyState = document.getElementById('emptyStateSocios');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStateSocios)');
  rows.forEach(row => row.remove());

  if (!socios || !socios.length) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  socios.forEach(s => {
    const tr = document.createElement("tr");
    const isActivo = membresiaInfo[s.dni] === true;

    tr.className = "border-b border-[var(--input-border)] hover:bg-[#1a1a1a] transition";

    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs">${s.dni}</td>
      <td class="px-4 py-3 font-medium">${s.nombre}</td>
      <td class="px-4 py-3 text-gray-400">${s.telefono ?? "-"}</td>
      <td class="px-4 py-3 text-gray-400">${s.email ?? "-"}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${isActivo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
          ${isActivo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td class="px-4 py-3">
        <button class="text-[var(--orange)] font-medium hover:underline transition text-sm">
          Ver
        </button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () => {
      window.location.href = `socio-detalle.html?dni=${s.dni}`;
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
    a.download = `socios_${new Date().toISOString().split('T')[0]}.csv`;
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






