import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/asistencias";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.querySelector("#tablaAsistencias tbody");
  const busquedaInput = document.getElementById("inputBusqueda");

  const btnHome = document.getElementById("btnHome");
  const btnRegistrar = document.getElementById("btnRegistrar");
  const btnBuscar = document.getElementById("btnBuscar");

  if (!tablaBody) {
    console.error("No se encontró la tabla de asistencias");
    return;
  }

  cargarAsistencias(tablaBody);

  if (btnHome) {
    btnHome.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", () => {
      window.location.href = "asistencia.html";
    });
  }

  if (btnBuscar && busquedaInput) {
    btnBuscar.addEventListener("click", () => {
      buscarAsistencias(tablaBody, busquedaInput.value);
    });

    busquedaInput.addEventListener("input", () => {
      buscarAsistencias(tablaBody, busquedaInput.value);
    });
  }
});

async function cargarAsistencias(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const asistencias = await res.json();
    renderAsistencias(tablaBody, asistencias);
  } catch (err) {
    console.error(err);
    alert("Error al cargar asistencias");
  }
}

function renderAsistencias(tablaBody, asistencias) {
  tablaBody.innerHTML = "";

  if (!Array.isArray(asistencias) || asistencias.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;">
          No se encontraron asistencias
        </td>
      </tr>
    `;
    return;
  }

  asistencias.forEach(a => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>${a.dni}</td>
      <td>${a.fecha_hora}</td>
    `;

    tablaBody.appendChild(tr);
  });
}

async function buscarAsistencias(tablaBody, valor) {
  const texto = valor.trim();

  if (texto.length < 2) {
    cargarAsistencias(tablaBody);
    return;
  }

  try {
    const res = await authFetch(
      `${API_URL}/search?q=${encodeURIComponent(texto)}`
    );
    const asistencias = await res.json();
    renderAsistencias(tablaBody, asistencias);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}



