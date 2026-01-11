import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";
import { renderTabla } from "../ui/tabla.js";

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

  // Reset precios y cantidades según tipo
  cantidad.value = tipoDetalle.value === "MEMBRESIA" ? 1 : cantidad.value;
  cantidad.disabled = tipoDetalle.value === "MEMBRESIA";

  precio.value = "";
  precioMembresia.value = "";
}

/* ================== PRECIOS ================== */
function cargarPrecioProducto() {
  const p = productosCache.find(p => p.idProducto == producto.value);
  precio.value = p ? p.precio ?? p.precioSugerido ?? 0 : 0;
}

function cargarPrecioMembresia() {
  const m = membresiasCache.find(m => m.idMembresia == membresia.value);
  precioMembresia.value = m ? m.precio ?? m.precioSugerido ?? 0 : 0;
}

/* ================== DETALLES ================== */
function agregarDetalle() {
  const tipo = tipoDetalle.value;

  let precioUnitario;
  if (tipo === "PRODUCTO") {
    if (!producto.value) return mostrarAlerta({ mensaje: "Seleccione un producto", tipo: "danger" });
    precioUnitario = Number(precio.value);
  } else {
    if (!membresia.value) return mostrarAlerta({ mensaje: "Seleccione una membresía", tipo: "danger" });
    precioUnitario = Number(precioMembresia.value);
  }

  if (!precioUnitario || precioUnitario <= 0)
    return mostrarAlerta({ mensaje: "El ítem seleccionado no tiene precio", tipo: "danger" });

  let detalle;
  if (tipo === "PRODUCTO") {
    detalle = { idProducto: Number(producto.value), cantidad: Number(cantidad.value), precioUnitario };
  } else {
    detalle = { idSocio: dniSocio.value ? Number(dniSocio.value) : null, idMembresia: Number(membresia.value), cantidad: 1, precioUnitario };
  }

  detalles.push(detalle);
  renderDetalles();
}

function renderDetalles() {
  renderTabla(
    detallesBody,
    detalles,
    [
      d => d.idProducto ? "Producto" : "Membresía",
      d => d.idProducto
            ? productosCache.find(p => p.idProducto === d.idProducto)?.nombre ?? "Desconocido"
            : membresiasCache.find(m => m.idMembresia === d.idMembresia)?.nombre ?? "Desconocido",
      d => d.cantidad,
      d => `$${d.precioUnitario}`
    ],
    (d, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "text-orange-600 font-medium hover:underline";
      btn.textContent = "Eliminar";
      btn.addEventListener("click", () => { detalles.splice(i,1); renderDetalles(); });
      return btn;
    }
  );
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






