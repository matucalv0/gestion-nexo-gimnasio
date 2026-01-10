import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/pagos";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.querySelector("#tablaPagos tbody");

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
        <td colspan="4">No hay pagos registrados</td>
      </tr>`;
    return;
  }

  pagos.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.idPago}</td>
      <td>${p.fecha}</td>
      <td>${p.estado}</td>
      <td>$ ${p.monto}</td>
    `;
    tablaBody.appendChild(tr);
  });
}
