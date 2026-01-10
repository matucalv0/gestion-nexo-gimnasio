import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

let detalles = [];
let productosCache = [];
let membresiasCache = [];

document.addEventListener("DOMContentLoaded", async () => {

  // Cargas iniciales
  await cargarMediosPago();
  await cargarProductos();
  await cargarMembresias();
  await cargarEmpleados();

  // Eventos
  tipoDetalle.addEventListener("change", onTipoDetalleChange);
  producto.addEventListener("change", cargarPrecioProducto);
  membresia.addEventListener("change", cargarPrecioMembresia);
  btnAgregarDetalle.addEventListener("click", agregarDetalle);
  pagoForm.addEventListener("submit", registrarPago);

  btnHome.addEventListener("click", () => window.location.href = "home.html");
  btnLogout.addEventListener("click", logout);

  onTipoDetalleChange();
});

/* ================== CARGAS ================== */
async function cargarMediosPago() {
  const res = await authFetch("/mediosdepago");
  const data = await res.json();
  medioPago.innerHTML = `<option value="">Seleccione...</option>`;
  data.forEach(mp => medioPago.innerHTML += `<option value="${mp.idMedioPago}">${mp.nombre}</option>`);
}

async function cargarProductos() {
  const res = await authFetch("/productos");
  productosCache = await res.json();
  producto.innerHTML = `<option value="">Seleccione...</option>`;
  productosCache.forEach(p => producto.innerHTML += `<option value="${p.idProducto}">${p.nombre}</option>`);
}

async function cargarMembresias() {
  const res = await authFetch("/membresias");
  membresiasCache = await res.json();
  membresia.innerHTML = `<option value="">Seleccione...</option>`;
  membresiasCache.forEach(m => membresia.innerHTML += `<option value="${m.idMembresia}">${m.nombre}</option>`);
}

async function cargarEmpleados() {
  const res = await authFetch("/empleados");
  const data = await res.json();
  empleado.innerHTML = `<option value="">Seleccione...</option>`;
  data.forEach(e => {
    if (e.activo) empleado.innerHTML += `<option value="${e.dni}">${e.nombre}</option>`;
  });
}

/* ================== TIPO DETALLE ================== */
function onTipoDetalleChange() {
  productoGroup.style.display = tipoDetalle.value === "PRODUCTO" ? "block" : "none";
  membresiaGroup.style.display = tipoDetalle.value === "MEMBRESIA" ? "block" : "none";

  cantidad.value = tipoDetalle.value === "MEMBRESIA" ? 1 : cantidad.value;
  cantidad.disabled = tipoDetalle.value === "MEMBRESIA";
  precio.value = "";
}

/* ================== PRECIOS ================== */
function cargarPrecioProducto() {
  const p = productosCache.find(p => p.idProducto == producto.value);
  if (!p) return;
  precio.value = p.precio ?? p.precioSugerido ?? "";
}

function cargarPrecioMembresia() {
  const m = membresiasCache.find(m => m.idMembresia == membresia.value);
  if (!m) return;
  precio.value = m.precioSugerido;
}

/* ================== DETALLES ================== */
function agregarDetalle() {
  const tipo = tipoDetalle.value;
  const precioUnitario = Number(precio.value);
  if (!precioUnitario || precioUnitario <= 0) return mostrarAlerta({ mensaje: "Seleccione un ítem válido", tipo: "danger" });

  let detalle;
  if (tipo === "PRODUCTO") {
    if (!producto.value) return mostrarAlerta({ mensaje: "Seleccione un producto", tipo: "danger" });
    detalle = { idProducto: Number(producto.value), cantidad: Number(cantidad.value), precioUnitario };
  } else {
    if (!membresia.value) return mostrarAlerta({ mensaje: "Seleccione una membresía", tipo: "danger" });
    detalle = { idSocio: dniSocio.value ? Number(dniSocio.value) : null, idMembresia: Number(membresia.value), cantidad: 1, precioUnitario };
  }

  detalles.push(detalle);
  renderDetalles();
}

function renderDetalles() {
  detallesBody.innerHTML = "";

  detalles.forEach((d, i) => {
    const tipo = d.idProducto ? "Producto" : "Membresía";
    const desc = d.idProducto
      ? productosCache.find(p => p.idProducto === d.idProducto)?.nombre ?? "Desconocido"
      : membresiasCache.find(m => m.idMembresia === d.idMembresia)?.nombre ?? "Desconocido";

    const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";

    detallesBody.innerHTML += `
      <tr class="${rowBg} border-b border-gray-200 hover:bg-gray-100">
        <th scope="row" class="px-6 py-4 font-medium whitespace-nowrap text-gray-900">${tipo}</th>
        <td class="px-6 py-4 text-gray-800">${desc}</td>
        <td class="px-6 py-4 text-gray-800">${d.cantidad}</td>
        <td class="px-6 py-4 text-gray-800">$${d.precioUnitario}</td>
        <td class="px-6 py-4">
          <button type="button" class="text-orange-600 font-medium hover:underline" onclick="eliminarDetalle(${i})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

window.eliminarDetalle = i => { detalles.splice(i, 1); renderDetalles(); };

/* ================== SUBMIT ================== */
async function registrarPago(e) {
  e.preventDefault();
  limpiarAlertas();

  if (detalles.length === 0) return mostrarAlerta({ mensaje: "El pago debe tener al menos un detalle", tipo: "danger" });
  if (!medioPago.value) return mostrarAlerta({ mensaje: "Seleccione un medio de pago", tipo: "danger" });

  const data = {
    estado: "PAGADO",
    dniSocio: dniSocio.value.trim() || null,
    idMedioPago: Number(medioPago.value),
    dniEmpleado: empleado.value,
    detalles
  };

  try {
    const res = await authFetch("/pagos", { method: "POST", body: JSON.stringify(data) });
    if (!res.ok) {
      const body = await res.text();
      return mostrarAlerta({ mensaje: body || "Error al registrar pago", tipo: "danger" });
    }

    mostrarAlerta({ mensaje: "Pago registrado correctamente", tipo: "success" });
    detalles = [];
    renderDetalles();
    pagoForm.reset();
    onTipoDetalleChange();

  } catch {
    mostrarAlerta({ mensaje: "No se pudo conectar con el servidor", tipo: "danger" });
  }
}





