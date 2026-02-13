import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaMembresiasBody");

  // Botones Home y Logout
  document.getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

  document.getElementById("btnLogout")
    ?.addEventListener("click", logout);

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

    tr.innerHTML = `
      <td class="font-medium">${m.nombre}</td>
      <td>${m.duracionDias} días</td>
      <td>${m.asistenciasPorSemana === null ? "Ilimitadas" : m.asistenciasPorSemana}</td>
      <td class="font-semibold">$${m.precioSugerido}</td>
      <td><span class="badge">${m.tipoMembresia}</span></td>
      <td><span class="badge ${m.estado ? 'badge-success' : 'badge-danger'}">${m.estado ? "Activa" : "Inactiva"}</span></td>
      <td>
        <button class="editarMembresia table-action-btn" title="Editar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </td>
    `;

    // Evento click para editar
    tr.querySelector(".editarMembresia").addEventListener("click", () => {
      window.location.href = `editar-membresia.html?id=${m.idMembresia}`;
    });

    tablaBody.appendChild(tr);
  });
}






