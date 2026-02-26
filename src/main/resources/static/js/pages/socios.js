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
      }
    );

  } catch (err) {
    console.error("Error al cargar socios", err);
    Alerta.error("No se pudieron cargar los socios");
  }
}

function renderSocios(tablaBody, socios) {
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
    const isActivo = s.activo === true;
    tr.innerHTML = `
      <td>${s.dni}</td>
      <td class="font-medium">${s.nombre}</td>
      <td class="text-gray-400">${s.telefono ?? "-"}</td>
      <td class="text-gray-400">${s.email ?? "-"}</td>
      <td>
        <span class="badge ${isActivo ? 'badge-success' : 'badge-danger'}">
          ${isActivo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td>
        <button class="table-action-btn" title="Ver detalle">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
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








