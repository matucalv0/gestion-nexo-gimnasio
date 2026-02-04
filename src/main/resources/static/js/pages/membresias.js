import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaMembresiasBody");

  // Botones Home y Logout
  document.getElementById("btnHome")
    .addEventListener("click", () => window.location.href = "home.html");

  document.getElementById("btnLogout")
    .addEventListener("click", logout);

  // Botón Nueva Membresía
  document.getElementById("btnNuevaMembresia")
    .addEventListener("click", () => {
      window.location.href = "registrar-membresia.html";
    });

  // Cargar membresías
  cargarMembresias(tablaBody);
});

async function cargarMembresias(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar membresías");
    const membresias = await res.json();
    renderMembresias(tablaBody, membresias);
  } catch (err) {
    console.error(err);
    tablaBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
          No se pudieron cargar las membresías
        </td>
      </tr>
    `;
  }
}

function renderMembresias(tablaBody, membresias) {
  const emptyState = document.getElementById('emptyStateMembresias');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStateMembresias)');
  rows.forEach(row => row.remove());

  if (!membresias?.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

  membresias.forEach(m => {
    const tr = document.createElement("tr");

    // Solo borde inferior y hover
    tr.classList.add("border-b", "border-[var(--input-border)]", "hover:bg-[#1a1a1a]");

    tr.innerHTML = `
  <td class="px-6 py-4">${m.nombre}</td>
      <td class="px-6 py-4">${m.duracionDias} días</td>
      <td class="px-6 py-4">${m.asistenciasPorSemana === null ? "Ilimitadas" : m.asistenciasPorSemana}</td>
      <td class="px-6 py-4">$${m.precioSugerido}</td>
      <td class="px-6 py-4">${m.tipoMembresia}</td>
      <td class="px-6 py-4">${m.estado ? "Activa" : "Inactiva"}</td>
      <td class="px-6 py-4">
        <button class="editarMembresia text-[var(--orange)] font-medium hover:underline transition">Editar</button>
      </td>
    `;

    // Evento click para editar
    tr.querySelector(".editarMembresia").addEventListener("click", () => {
      window.location.href = `editar-membresia.html?id=${m.idMembresia}`;
    });

    tablaBody.appendChild(tr);
  });
}






