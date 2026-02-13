import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/productos";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaProductosBody");
  const busquedaInput = document.getElementById("inputBusqueda");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnNuevoProducto = document.getElementById("btnNuevoProducto");

  if (!tablaBody) {
    console.error("No se encontró la tabla de productos");
    return;
  }

  cargarProductos(tablaBody);

  if (btnHome) btnHome.addEventListener("click", () => history.back());
  if (btnLogout) btnLogout.addEventListener("click", logout);
  if (btnNuevoProducto) btnNuevoProducto.addEventListener("click", () => window.location.href = "registrar-producto.html");

  if (btnBuscar && busquedaInput) {
    btnBuscar.addEventListener("click", () => buscarProductos(tablaBody, busquedaInput.value));
    busquedaInput.addEventListener("input", () => buscarProductos(tablaBody, busquedaInput.value));
  }
});

async function cargarProductos(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const productos = await res.json();
    renderProductos(tablaBody, productos);
  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar productos");
  }
}

function renderProductos(tablaBody, productos) {
  const emptyState = document.getElementById('emptyStateProductos');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStateProductos)');
  rows.forEach(row => row.remove());

  if (!Array.isArray(productos) || productos.length === 0) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

  productos.forEach(producto => {
    const tr = document.createElement("tr");

    const stockClass = producto.stock <= 5 ? 'text-red-400' : producto.stock <= 10 ? 'text-yellow-400' : '';

    tr.innerHTML = `
      <td class="font-mono text-xs text-gray-400">${producto.idProducto}</td>
      <td class="font-medium">${producto.nombre}</td>
      <td class="font-semibold">$${producto.precioSugerido?.toFixed(2) ?? "-"}</td>
      <td><span class="${stockClass}">${producto.stock ?? 0}</span></td>
      <td>
        <button class="table-action-btn" title="Editar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () => {
      editarProducto(producto.idProducto);
    });

    tablaBody.appendChild(tr);
  });

}

async function buscarProductos(tablaBody, valor) {
  const texto = valor.trim();

  if (texto.length < 2) {
    cargarProductos(tablaBody);
    return;
  }

  try {
    const res = await authFetch(`${API_URL}/search?q=${encodeURIComponent(texto)}`);
    const productos = await res.json();
    renderProductos(tablaBody, productos);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}

function editarProducto(id) {
  window.location.href = `editar-producto.html?id=${id}`;
}