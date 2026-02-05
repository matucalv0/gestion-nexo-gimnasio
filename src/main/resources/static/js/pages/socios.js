import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

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

  btnHome?.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  btnLogout?.addEventListener("click", logout);

  btnNuevoSocio?.addEventListener("click", () => {
    window.location.href = "registrar-socio.html";
  });

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
});


async function cargarSocios(tablaBody) {
  try {
    const q = document.getElementById("inputBusqueda").value;
    const activo = document.getElementById("filtroActivo").value; // "", "true", "false"

    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (activo) url += `&activo=${activo}`;

    const res = await authFetch(url);
    const pageData = await res.json();

    // pageData es PageResponseDTO
    await renderSocios(tablaBody, pageData.content);

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
    // Podríamos mostrar alerta si hubiera contenedor de alerta
  }
}

async function renderSocios(tablaBody, socios) {
  const emptyState = document.getElementById('emptyStateSocios');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStateSocios)');
  rows.forEach(row => row.remove());

  if (!socios || !socios.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

  // Hacer un POST con todos los DNIs para ver si están activos (membresía)
  const dnis = socios.map(s => s.dni);
  let activosMap = {};

  try {
    const res = await authFetch(`${API_URL}/activo-mes-listado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dnis),
    });
    activosMap = await res.json();
  } catch (e) {
    console.error("Error obteniendo estado activos", e);
  }

  socios.forEach(s => {
    const tr = document.createElement("tr");
    const isActivo = activosMap[s.dni];

    tr.className = "border-b border-[var(--input-border)] hover:bg-[#1a1a1a] transition";

    tr.innerHTML = `
      <td class="px-6 py-4">${s.dni}</td>
      <td class="px-6 py-4">${s.nombre}</td>
      <td class="px-6 py-4">${s.telefono ?? "-"}</td>
      <td class="px-6 py-4">${s.email ?? "-"}</td>
      <td class="px-6 py-4 font-semibold ${isActivo ? "text-[var(--orange)]" : "text-gray-500"}">
        ${isActivo ? "Activo" : "Inactivo"}
      </td>
      <td class="px-6 py-4">
        <button class="text-[var(--orange)] font-medium hover:underline transition">
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






