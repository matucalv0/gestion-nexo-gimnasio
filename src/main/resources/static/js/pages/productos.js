import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

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

  if (btnHome) btnHome.addEventListener("click", () => window.location.href = "home.html");
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
    alert("Error al cargar productos");
  }
}

function renderProductos(tablaBody, productos) {
  tablaBody.innerHTML = "";

  if (!Array.isArray(productos) || productos.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          No hay productos
        </td>
      </tr>
    `;
    return;
  }

  productos.forEach(producto => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-100";

    tr.innerHTML = `
      <td class="px-6 py-4">${producto.idProducto}</td>
      <td class="px-6 py-4">${producto.nombre}</td>
      <td class="px-6 py-4">$${producto.precioSugerido?.toFixed(2) ?? "-"}</td>
      <td class="px-6 py-4">${producto.stock ?? 0}</td>
      <td class="px-6 py-4">
        <button class="text-orange-600 font-medium hover:underline">Editar</button>
      </td>
    `;

    console.log(producto);

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