import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

/* ================== STATE ================== */

let detalles = [];
let productosCache = [];
let membresiasCache = [];

/* ================== INIT ================== */

document.addEventListener("DOMContentLoaded", async () => {

  await cargarMediosPago();
  await cargarProductos();
  await cargarMembresias();

  tipoDetalle.addEventListener("change", onTipoDetalleChange);
  producto.addEventListener("change", cargarPrecioProducto);
  socioMembresia.addEventListener("change", cargarPrecioMembresia);

  btnAgregarDetalle.addEventListener("click", agregarDetalle);
  pagoForm.addEventListener("submit", registrarPago);

  onTipoDetalleChange(); // estado inicial
});

/* ================== CARGAS ================== */

async function cargarMediosPago() {
  const res = await authFetch("/mediosdepago");
  const data = await res.json();

  medioPago.innerHTML = `<option value="">Seleccione...</option>`;

  data.forEach(mp => {
    medioPago.innerHTML += `
      <option value="${mp.id_medioPago}">
        ${mp.nombre}
      </option>`;
  });
}

async function cargarProductos() {
  const res = await authFetch("/productos");
  productosCache = await res.json();

  producto.innerHTML = `<option value="">Seleccione...</option>`;

  productosCache.forEach(p => {
    producto.innerHTML += `
      <option value="${p.id_producto}">
        ${p.nombre}
      </option>`;
  });
}

async function cargarMembresias() {
  const res = await authFetch("/membresias");
  membresiasCache = await res.json();

  socioMembresia.innerHTML = `<option value="">Seleccione...</option>`;

  membresiasCache.forEach(m => {
    socioMembresia.innerHTML += `
      <option value="${m.id_membresia}">
        ${m.nombre}
      </option>`;
  });
}

/* ================== TIPO DETALLE ================== */

function onTipoDetalleChange() {
  const tipo = tipoDetalle.value;

  productoGroup.style.display = tipo === "PRODUCTO" ? "block" : "none";
  membresiaGroup.style.display = tipo === "MEMBRESIA" ? "block" : "none";

  if (tipo === "MEMBRESIA") {
    cantidad.value = 1;
    cantidad.disabled = true;
  } else {
    cantidad.disabled = false;
  }

  precio.value = "";
}

/* ================== PRECIOS ================== */

function cargarPrecioProducto() {
  const id = Number(producto.value);
  if (!id) return;

  const p = productosCache.find(p => p.id_producto === id);
  if (!p) return;

  precio.value = p.precio ?? p.precio_sugerido ?? "";
}

function cargarPrecioMembresia() {
  const id = Number(socioMembresia.value);
  if (!id) return;

  const m = membresiasCache.find(m => m.id_membresia === id);
  if (!m) return;

  precio.value = m.precio_sugerido;
}

/* ================== DETALLES ================== */

function agregarDetalle() {
  const tipo = tipoDetalle.value;
  const precioUnitario = Number(precio.value);

  if (!precioUnitario || precioUnitario <= 0) {
    alert("Seleccione un ítem válido");
    return;
  }

  let detalle;

  if (tipo === "PRODUCTO") {
    if (!producto.value) {
      alert("Seleccione un producto");
      return;
    }

    detalle = {
      id_producto: Number(producto.value),
      cantidad: Number(cantidad.value),
      precio_unitario: precioUnitario
    };
  } else {
    if (!socioMembresia.value) {
      alert("Seleccione una membresía");
      return;
    }

    detalle = {
      id_sm: Number(socioMembresia.value),
      cantidad: 1,
      precio_unitario: precioUnitario
    };
  }

  detalles.push(detalle);
  renderDetalles();
}

/* ================== RENDER ================== */

function renderDetalles() {
  detallesBody.innerHTML = "";

  detalles.forEach((d, index) => {
    detallesBody.innerHTML += `
      <tr>
        <td>${d.id_producto ? "Producto" : "Membresía"}</td>
        <td>${d.id_producto ?? d.id_sm}</td>
        <td>${d.cantidad}</td>
        <td>$${d.precio_unitario}</td>
        <td>
          <button type="button" class="btn-icon" onclick="eliminarDetalle(${index})">
            ❌
          </button>
        </td>
      </tr>`;
  });
}

window.eliminarDetalle = index => {
  detalles.splice(index, 1);
  renderDetalles();
};

/* ================== SUBMIT ================== */

async function registrarPago(e) {
  e.preventDefault();

  if (detalles.length === 0) {
    alert("El pago debe tener al menos un detalle");
    return;
  }

  if (!medioPago.value) {
    alert("Seleccione un medio de pago");
    return;
  }

  const data = {
    estado: "PAGADO",
    dni_socio: dniSocio.value.trim() || null,
    id_medioPago: Number(medioPago.value),
    detalles
  };

  const res = await authFetch("/pagos", {
    method: "POST",
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  alert("✔ Pago registrado correctamente");

  detalles = [];
  renderDetalles();
  pagoForm.reset();
  onTipoDetalleChange();
}



