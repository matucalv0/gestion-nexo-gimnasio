import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.querySelector("#tablaMembresias tbody");
  const inputBusqueda = document.getElementById("inputBusqueda");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnNueva = document.getElementById("btnNuevaMembresia");

  cargarMembresias(tablaBody);

  btnHome.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  btnLogout.addEventListener("click", logout);

  btnNueva.addEventListener("click", () => {
    window.location.href = "registrar-membresia.html";
  });

  btnBuscar.addEventListener("click", () => {
    buscarMembresias(tablaBody, inputBusqueda.value);
  });

  inputBusqueda.addEventListener("input", () => {
    buscarMembresias(tablaBody, inputBusqueda.value);
  });
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
        <td colspan="5">No hay membresías</td>
      </tr>
    `;
    return;
  }

  membresias.forEach(m => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.nombre}</td>
      <td>${m.duracionDias}</td>
      <td>${m.asistenciasPorSemana === null ? "Ilimitadas" : m.asistenciasPorSemana}</td>
      <td>$${m.precioSugerido}</td>
      <td>${m.estado ? "Activa" : "Inactiva"}</td>
    `;

    tablaBody.appendChild(tr);
  });
}

async function buscarMembresias(tablaBody, valor) {
  if (valor.trim().length < 2) {
    cargarMembresias(tablaBody);
    return;
  }

  try {
    const res = await authFetch(
      `${API_URL}/search?q=${encodeURIComponent(valor)}`
    );
    const data = await res.json();
    renderMembresias(tablaBody, data);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}
