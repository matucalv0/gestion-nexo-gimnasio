import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderTabla } from "../ui/tabla.js";

checkAuth();

/* ================== STATE ================== */
let detalles = [];
let productosCache = [];
let membresiasCache = [];
let socioSeleccionado = null;

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", async () => {

  // Cargar datos en paralelo para mayor velocidad
  await Promise.all([
    cargarMediosPago(),
    cargarMembresias(),
    cargarProductos(),
    cargarEmpleados()
  ]);

  const params = new URLSearchParams(window.location.search);
  const dniFromFicha = params.get("dni");


  tipoDetalle.addEventListener("change", onTipoDetalleChange);
  producto.addEventListener("change", cargarPrecioProducto);
  membresia.addEventListener("change", cargarPrecioMembresia);
  btnAgregarDetalle.addEventListener("click", agregarDetalle);
  pagoForm.addEventListener("submit", registrarPago);

  buscarSocio.addEventListener("input", buscarSocioHandler);

  // Enter en búsqueda de socio selecciona el primero
  buscarSocio.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const items = resultadosSocio.querySelectorAll("li");
      if (items.length > 0) {
        items[0].click();
      }
    }
  });

  btnHome.addEventListener("click", () => history.back());
  btnLogout.addEventListener("click", logout);


  // Atajos de teclado
  document.addEventListener("keydown", (e) => {
    // Ctrl+Enter = Registrar pago
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      pagoForm.dispatchEvent(new Event("submit"));
    }
  });

  onTipoDetalleChange();

  // Foco inicial en búsqueda de socio
  buscarSocio?.focus();

  /* ===== PRESELECCIONAR SOCIO DESDE FICHA ===== */
  if (dniFromFicha) {
    await preseleccionarSocioDesdeFicha(dniFromFicha);
  }

});

async function preseleccionarSocioDesdeFicha(dni) {
  const res = await authFetch(`/socios/${dni}`);
  if (!res.ok) return;

  socioSeleccionado = await res.json();
  buscarSocio.value = `${socioSeleccionado.nombre} (${socioSeleccionado.dni})`;
  buscarSocio.disabled = true;
}



/* ================== CARGAS ================== */
async function cargarMediosPago() {
  const res = await authFetch("/mediosdepago");
  const data = await res.json();
  medioPago.innerHTML = `<option value="">Seleccione...</option>`;
  data.forEach((mp, index) => {
    const selected = index === 0 ? 'selected' : ''; // Seleccionar el primero (generalmente Efectivo)
    medioPago.innerHTML += `<option value="${mp.idMedioPago}" ${selected}>${mp.nombre}</option>`;
  });
}

async function cargarProductos() {
  const res = await authFetch("/productos");
  productosCache = await res.json();
  producto.innerHTML = `<option value="">Seleccione...</option>`;
  productosCache.forEach(p =>
    producto.innerHTML += `<option value="${p.idProducto}">${p.nombre}</option>`
  );
}

async function cargarMembresias() {
  const res = await authFetch("/membresias");
  membresiasCache = await res.json();
  membresia.innerHTML = `<option value="">Seleccione...</option>`;
  membresiasCache.forEach(m =>
    membresia.innerHTML += `<option value="${m.idMembresia}">${m.nombre}</option>`
  );
}

async function cargarEmpleados() {
  const res = await authFetch("/empleados");
  const data = await res.json();
  empleado.innerHTML = `<option value="">Seleccione...</option>`;
  let primeroSeleccionado = false;
  data.forEach(e => {
    if (e.activo) {
      const selected = !primeroSeleccionado ? 'selected' : '';
      primeroSeleccionado = true;
      empleado.innerHTML += `<option value="${e.dni}" ${selected}>${e.nombre}</option>`;
    }
  });
}

/* ================== BUSCAR SOCIO ================== */
async function buscarSocioHandler() {
  const q = buscarSocio.value.trim();

  socioSeleccionado = null;

  if (q.length < 2) {
    resultadosSocio.classList.add("hidden");
    resultadosSocio.innerHTML = "";
    return;
  }

  const res = await authFetch(`/socios/search?q=${encodeURIComponent(q)}`);
  const socios = await res.json();

  resultadosSocio.innerHTML = "";

  socios.forEach(s => {
    const li = document.createElement("li");
    li.className =
      "px-4 py-2 cursor-pointer hover:bg-gray-700 text-[var(--beige)]";
    li.textContent = `${s.nombre} (${s.dni})`;

    li.addEventListener("click", () => {
      socioSeleccionado = s;
      buscarSocio.value = `${s.nombre} (${s.dni})`;
      resultadosSocio.classList.add("hidden");
    });

    resultadosSocio.appendChild(li);
  });

  resultadosSocio.classList.toggle("hidden", socios.length === 0);
}

/* ================== TIPO DETALLE ================== */
function onTipoDetalleChange() {
  productoGroup.style.display =
    tipoDetalle.value === "PRODUCTO" ? "block" : "none";
  membresiaGroup.style.display =
    tipoDetalle.value === "MEMBRESIA" ? "block" : "none";

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

  // Auto-agregar membresía cuando se selecciona (si hay socio seleccionado)
  if (m && socioSeleccionado) {
    // Verificar que no haya ya una membresía en los detalles
    const yaTieneMembresia = detalles.some(d => d.idMembresia != null);
    if (!yaTieneMembresia) {
      agregarDetalleSilencioso();
      Alerta.success(`Agregado: ${m.nombre}`);
    }
  }
}

/* ================== DETALLES ================== */
function agregarDetalle() {
  const tipo = tipoDetalle.value;
  let precioUnitario;

  if (tipo === "PRODUCTO") {
    if (!producto.value)
      return Alerta.warning("Seleccione un producto");
    precioUnitario = Number(precio.value);
  } else {
    if (!membresia.value)
      return Alerta.warning("Seleccione una membresía");
    precioUnitario = Number(precioMembresia.value);
  }

  if (!precioUnitario || precioUnitario <= 0)
    return Alerta.error("El ítem seleccionado no tiene precio");

  let detalle;
  if (tipo === "PRODUCTO") {
    detalle = {
      idProducto: Number(producto.value),
      cantidad: Number(cantidad.value),
      precioUnitario
    };
  } else {
    detalle = {
      idSocio: socioSeleccionado ? socioSeleccionado.dni : null,
      idMembresia: Number(membresia.value),
      cantidad: 1,
      precioUnitario
    };
  }

  detalles.push(detalle);
  renderDetalles();
}

function renderDetalles() {
  renderTabla(
    detallesBody,
    detalles,
    [
      d => (d.idProducto ? "Producto" : "Membresía"),
      d =>
        d.idProducto
          ? productosCache.find(p => p.idProducto === d.idProducto)?.nombre ??
          "Desconocido"
          : membresiasCache.find(m => m.idMembresia === d.idMembresia)?.nombre ??
          "Desconocido",
      d => d.cantidad,
      d => `$${d.precioUnitario}`
    ],
    (d, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "text-orange-600 font-medium hover:underline";
      btn.textContent = "Eliminar";
      btn.addEventListener("click", () => {
        detalles.splice(i, 1);
        renderDetalles();
      });
      return btn;
    }
  );
}

/* Versión silenciosa de agregarDetalle que retorna true/false */
function agregarDetalleSilencioso() {
  const tipo = tipoDetalle.value;
  let precioUnitario;

  if (tipo === "PRODUCTO") {
    if (!producto.value) {
      Alerta.warning("Seleccione un producto");
      return false;
    }
    precioUnitario = Number(precio.value);
  } else {
    if (!membresia.value) {
      Alerta.warning("Seleccione una membresía");
      return false;
    }
    precioUnitario = Number(precioMembresia.value);
  }

  if (!precioUnitario || precioUnitario <= 0) {
    Alerta.error("El ítem seleccionado no tiene precio");
    return false;
  }

  let detalle;
  if (tipo === "PRODUCTO") {
    detalle = {
      idProducto: Number(producto.value),
      cantidad: Number(cantidad.value),
      precioUnitario
    };
  } else {
    detalle = {
      idSocio: socioSeleccionado ? socioSeleccionado.dni : null,
      idMembresia: Number(membresia.value),
      cantidad: 1,
      precioUnitario
    };
  }

  detalles.push(detalle);
  renderDetalles();

  // Limpiar selección del detalle para evitar duplicados
  producto.value = "";
  membresia.value = "";
  precio.value = "";
  precioMembresia.value = "";

  return true;
}

/* ================== SUBMIT ================== */
async function registrarPago(e) {
  e.preventDefault();

  // Auto-agregar detalle pendiente del formulario si hay algo seleccionado
  const tipo = tipoDetalle.value;
  let tieneDetallePendiente = false;

  if (tipo === "PRODUCTO" && producto.value) {
    tieneDetallePendiente = true;
  } else if (tipo === "MEMBRESIA" && membresia.value) {
    tieneDetallePendiente = true;
  }

  if (tieneDetallePendiente) {
    // Intentar agregar el detalle pendiente silenciosamente
    const detalleAgregado = agregarDetalleSilencioso();
    if (!detalleAgregado) {
      // Si falla la validación del detalle, no continuar
      return;
    }
  }

  if (detalles.length === 0)
    return Alerta.warning("El pago debe tener al menos un detalle");

  if (!medioPago.value)
    return Alerta.warning("Seleccione un medio de pago");

  const data = {
    estado: "PAGADO",
    dniSocio: socioSeleccionado ? socioSeleccionado.dni : null,
    idMedioPago: Number(medioPago.value),
    dniEmpleado: empleado.value,
    detalles
  };

  try {
    const res = await authFetch("/pagos", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      let mensaje = "Error al registrar pago";
      try {
        const error = await res.json();
        mensaje = error.message || mensaje;
      } catch { }
      return Alerta.error(mensaje);
    }

    Alerta.success("Pago registrado correctamente");

    detalles = [];
    socioSeleccionado = null;
    buscarSocio.value = "";
    buscarSocio.disabled = false;
    resultadosSocio.innerHTML = "";
    resultadosSocio.classList.add("hidden");

    renderDetalles();
    pagoForm.reset();
    onTipoDetalleChange();

  } catch {
    Alerta.error("No se pudo conectar con el servidor");
  }
}







