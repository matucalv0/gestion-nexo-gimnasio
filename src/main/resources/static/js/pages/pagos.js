import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/pagos";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaPagosBody");

  document.getElementById("btnHome")
    .addEventListener("click", () => window.location.href = "home.html");

  document.getElementById("btnNuevoPago")
    .addEventListener("click", () => window.location.href = "registrar-pago.html");

  cargarPagos(tablaBody);
});

async function cargarPagos(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const data = await res.json();
    renderPagos(tablaBody, data);
  } catch (err) {
    console.error(err);
    alert("Error al cargar pagos");
  }
}
function renderPagos(tablaBody, pagos) {
  tablaBody.innerHTML = "";

  if (!pagos.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          No hay pagos registrados
        </td>
      </tr>`;
    return;
  }

  pagos.forEach(p => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-gray-200 hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-6 py-4">${p.fecha}</td>
      <td class="px-6 py-4">${p.estado}</td>
      <td class="px-6 py-4">$ ${p.monto}</td>
    `;

    tablaBody.appendChild(tr);
  });
}


