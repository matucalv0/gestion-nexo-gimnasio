import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderMasterTable, createStatusBadge, ICONS } from "../ui/tabla.js";
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
    renderProductosTable(tablaBody, productos);
  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar productos");
  }
}

function renderProductosTable(tablaBody, productos) {
  const emptyState = document.getElementById("emptyStateProductos");

  renderMasterTable({
    tbody: tablaBody,
    emptyElement: emptyState,
    data: productos,
    columns: [
      {
        field: "idProducto",
        format: (id) => `<span class="text-gray-500 font-mono text-xs">#${String(id).padStart(4, "0")}</span>`
      },
      {
        field: "nombre",
        className: "font-semibold text-white group-hover:text-[var(--orange)] transition-colors"
      },
      {
        field: "precioSugerido",
        className: "font-mono font-bold text-gray-200 tabular-nums",
        format: (p) => `$ ${Number(p || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
      },
      {
        render: (prod) => {
          const stock = prod.stock ?? 0;
          if (stock <= 5) {
            return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/20"><span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>${stock} unid.</span>`;
          } else if (stock <= 10) {
            return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>${stock} unid.</span>`;
          }
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-green-500/10 text-green-400 border-green-500/20"><span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>${stock} unid.</span>`;
        }
      }
    ],
    actions: [
      {
        icon: "edit",
        type: "primary",
        title: "Editar Producto",
        onClick: (prod) => editarProducto(prod.idProducto)
      }
    ]
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
    renderProductosTable(tablaBody, productos);
  } catch (err) {
    console.error("Error en búsqueda", err);
  }
}

function editarProducto(id) {
  navigateTo("editar-producto", { id: id });
}
