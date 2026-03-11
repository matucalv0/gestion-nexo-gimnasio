import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

const API_URL = "/productos";

export function init() {
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
  if (btnNuevoProducto)
    btnNuevoProducto.addEventListener("click", () =>
      navigateTo("registrar-producto"),
    );

  if (btnBuscar && busquedaInput) {
    btnBuscar.addEventListener("click", () =>
      buscarProductos(tablaBody, busquedaInput.value),
    );
    busquedaInput.addEventListener("input", () =>
      buscarProductos(tablaBody, busquedaInput.value),
    );
  }
}

export function destroy() {
  // Cleanup
}

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
  const emptyState = document.getElementById("emptyStateProductos");

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll("tr:not(#emptyStateProductos)");
  rows.forEach((row) => row.remove());

  if (!Array.isArray(productos) || productos.length === 0) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add("hidden");

  productos.forEach((producto) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#161616] transition-colors group";

    const isLowStock = producto.stock <= 5;
    const isMediumStock = producto.stock > 5 && producto.stock <= 10;

    let stockClass = "text-gray-300";
    let stockBg = "";
    let stockDot = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";

    if (isLowStock) {
      stockClass = "text-red-400 font-bold";
      stockBg = "bg-red-500/10 border-red-500/20";
      stockDot = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    } else if (isMediumStock) {
      stockClass = "text-yellow-400 font-bold";
      stockBg = "bg-yellow-500/10 border-yellow-500/20";
      stockDot = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]";
    }

    const precioFmt = `<span class="text-gray-500 mr-1">$</span><span class="text-gray-200 font-bold tracking-tight">${Number(producto.precioSugerido).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>`;

    tr.innerHTML = `
      <td class="py-4 px-6 text-gray-500 font-mono text-xs">#${String(producto.idProducto).padStart(4, "0")}</td>
      <td class="py-4 px-6 font-bold text-white tracking-tight group-hover:text-[var(--orange)] transition-colors">${producto.nombre}</td>
      <td class="py-4 px-6 text-lg tabular-nums">${precioFmt}</td>
      <td class="py-4 px-6">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-sm border ${stockBg || "border-transparent"}">
              <span class="w-1.5 h-1.5 rounded-full ${stockDot}"></span>
              <span class="${stockClass}">${producto.stock ?? 0} <span class="text-[10px] font-bold tracking-wider uppercase text-gray-500 opacity-70 ml-1">unidades</span></span>
          </div>
      </td>
      <td class="py-4 px-6">
        <div class="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button class="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] border border-[#333] flex items-center justify-center text-gray-400 hover:text-white transition-colors" title="Editar Producto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
        </div>
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
    const res = await authFetch(
      `${API_URL}/search?q=${encodeURIComponent(texto)}`,
    );
    const productos = await res.json();
    renderProductos(tablaBody, productos);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}

function editarProducto(id) {
  navigateTo("editar-producto", { id: id });
}
