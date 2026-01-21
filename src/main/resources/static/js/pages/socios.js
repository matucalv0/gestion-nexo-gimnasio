import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaSociosBody");
  const inputBusqueda = document.getElementById("inputBusqueda");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnNuevoSocio = document.getElementById("btnNuevoSocio");
  const btnBuscar = document.getElementById("btnBuscar");

  btnHome.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  btnLogout.addEventListener("click", logout);

  btnNuevoSocio.addEventListener("click", () => {
    window.location.href = "registrar-socio.html";
  });

  btnBuscar.addEventListener("click", () => {
    buscarSocios(tablaBody, inputBusqueda.value);
  });

  inputBusqueda.addEventListener("input", () => {
    buscarSocios(tablaBody, inputBusqueda.value);
  });

  cargarSocios(tablaBody);
});



async function cargarSocios(tablaBody) {
  const res = await authFetch(API_URL);
  const socios = await res.json();
  renderSocios(tablaBody, socios);
}

async function renderSocios(tablaBody, socios) {
  tablaBody.innerHTML = "";

  if (!socios.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          No hay socios
        </td>
      </tr>
    `;
    return;
  }

  // Hacer un POST con todos los DNIs
  const dnis = socios.map(s => s.dni);
  const res = await authFetch(`${API_URL}/activo-mes-listado`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dnis),
  });

  const activos = await res.json(); 

  socios.forEach(s => {
    const tr = document.createElement("tr");
    const isActivo = activos[s.dni];

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




async function buscarSocios(tablaBody, texto) {
  const q = texto.trim();

  if (q.length < 2) {
    cargarSocios(tablaBody);
    return;
  }

  const res = await authFetch(
    `${API_URL}/search?q=${encodeURIComponent(q)}`
  );

  const socios = await res.json();
  renderSocios(tablaBody, socios);
}






