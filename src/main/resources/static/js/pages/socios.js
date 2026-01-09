import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.querySelector("#tablaSocios tbody");
  const busquedaInput = document.getElementById("inputBusqueda");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnNuevoSocio = document.getElementById("btnNuevoSocio");

  if (!tablaBody) {
    console.error("No se encontró la tabla de socios");
    return;
  }

  cargarSocios(tablaBody);

  if (btnHome) {
    btnHome.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", logout);
  }

  if (btnNuevoSocio) {
    btnNuevoSocio.addEventListener("click", () => {
      window.location.href = "registrar-socio.html";
    });
  }

  if (btnBuscar && busquedaInput) {
    btnBuscar.addEventListener("click", () => {
      buscarSocios(tablaBody, busquedaInput.value);
    });

    busquedaInput.addEventListener("input", () => {
      buscarSocios(tablaBody, busquedaInput.value);
    });
  }
});

async function cargarSocios(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const socios = await res.json();
    renderSocios(tablaBody, socios);
  } catch (err) {
    console.error(err);
    alert("Error al cargar socios");
  }
}

function renderSocios(tablaBody, socios) {
  tablaBody.innerHTML = "";

  if (!Array.isArray(socios) || socios.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6">No hay socios</td>
      </tr>
    `;
    return;
  }

  socios.forEach(socio => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${socio.dni}</td>
      <td>${socio.nombre}</td>
      <td>${socio.telefono}</td>
      <td>${socio.email}</td>
      <td class="${socio.activo ? "estado-activo" : "estado-inactivo"}">
        ${socio.activo ? "Activo" : "Inactivo"}
      </td>
      <td>
        <button class="btn-ver">Ver</button>
      </td>
    `;

    tr.querySelector(".btn-ver").addEventListener("click", () => {
      verDetalle(socio.dni);
    });

    tablaBody.appendChild(tr);
  });
}

async function buscarSocios(tablaBody, valor) {
  const texto = valor.trim();

  if (texto.length < 2) {
    cargarSocios(tablaBody);
    return;
  }

  try {
    const res = await authFetch(
      `${API_URL}/search?q=${encodeURIComponent(texto)}`
    );
    const socios = await res.json();
    renderSocios(tablaBody, socios);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}

function verDetalle(dni) {
  window.location.href = `socio-detalle.html?dni=${dni}`;
}




