import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaMembresiasBody");


  document.getElementById("btnHome")
    .addEventListener("click", () => window.location.href = "home.html");

  document.getElementById("btnLogout")
    .addEventListener("click", logout);

  document.getElementById("btnNuevaMembresia")
    .addEventListener("click", () => {
      window.location.href = "registrar-membresia.html";
    });


  cargarMembresias(tablaBody);
});

async function cargarMembresias(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const data = await res.json();
    renderMembresias(tablaBody, data);
  } catch (err) {
    console.error(err);
    alert("Error al cargar membresías");
  }
}

function renderMembresias(tablaBody, membresias) {
  tablaBody.innerHTML = "";

  if (!membresias?.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          No hay membresías registradas
        </td>
      </tr>
    `;
    return;
  }

  membresias.forEach(m => {
    const tr = document.createElement("tr");
    tr.classList.add("border-b", "border-gray-300", "hover:bg-gray-100"); // ← aquí
  
    tr.innerHTML = `
      <td class="px-6 py-4">${m.nombre}</td>
      <td class="px-6 py-4">${m.duracionDias} días</td>
      <td class="px-6 py-4">
        ${m.asistenciasPorSemana === null ? "Ilimitadas" : m.asistenciasPorSemana}
      </td>
      <td class="px-6 py-4">$ ${m.precioSugerido}</td>
      <td class="px-6 py-4">${m.tipoMembresia}</td>
      <td class="px-6 py-4">
        ${m.estado ? "Activa" : "Inactiva"}
      </td>
    `;
  
    tablaBody.appendChild(tr);
  });
}


