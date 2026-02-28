import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderTabla } from "../ui/tabla.js";

checkAuth();

/* ================== STATE ================== */
let detalles = [];
let productosCache = [];
let membresiasCache = [];
let descuentosCache = [];
let socioSeleccionado = null;
let vencimientoInfo = null; // { ultimoVencimiento, vigente }

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", async () => {

  // Cargar datos en paralelo para mayor velocidad
  await Promise.all([
    cargarMediosPago(),
    cargarMembresias(),
    cargarProductos(),
    cargarEmpleados(),
    cargarDescuentos()
  ]);

  const params = new URLSearchParams(window.location.search);
  const dniFromFicha = params.get("dni");


  tipoDetalle.addEventListener("change", onTipoDetalleChange);
  producto.addEventListener("change", cargarPrecioProducto);
  membresia.addEventListener("change", cargarPrecioMembresia);
  btnAgregarDetalle.addEventListener("click", agregarDetalle);

  const descuentoSelect = document.getElementById("descuento");
  if (descuentoSelect) {
    descuentoSelect.addEventListener("change", actualizarPrecioMembresiaPorDescuento);
  }
  pagoForm.addEventListener("submit", registrarPago);

  const radiosFechaInicio = document.querySelectorAll('input[name="fechaInicio"]');
  radiosFechaInicio.forEach(radio => {
    radio.addEventListener('change', () => {
      const customContainer = document.getElementById('fechaCustomContainer');
      if (customContainer) {
        customContainer.classList.toggle('hidden', radio.value !== 'otro');
      }
    });
  });

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

  document.getElementById("btnHome")?.addEventListener("click", () => history.back());
  document.getElementById("btnLogout")?.addEventListener("click", logout);


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
  await consultarUltimoVencimiento(dni);
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

async function cargarDescuentos() {
  const descuentoSelect = document.getElementById("descuento");
  if (!descuentoSelect) return;

  try {
    const res = await authFetch("/descuentos/activos");
    if (res.ok) {
      descuentosCache = await res.json();
      descuentoSelect.innerHTML = `<option value="">Ninguno</option>`;
      descuentosCache.forEach(d => {
        descuentoSelect.innerHTML += `<option value="${d.idDescuento}">${d.nombre} (${d.porcentaje}%)</option>`;
      });
    }
  } catch (e) {
    console.error("Error al cargar descuentos", e);
  }
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
      consultarUltimoVencimiento(s.dni);
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

  // Mostrar/ocultar selector de fecha inicio según tipo
  actualizarVisibilidadFechaInicio();

  // Bloquear descuento si es producto
  const descuentoSelect = document.getElementById("descuento");
  if (descuentoSelect) {
    descuentoSelect.disabled = tipoDetalle.value === "PRODUCTO";
  }
}

/* ================== PRECIOS ================== */
function cargarPrecioProducto() {
  const p = productosCache.find(p => p.idProducto == producto.value);
  precio.value = p ? p.precio ?? p.precioSugerido ?? 0 : 0;
}

function cargarPrecioMembresia() {
  const m = membresiasCache.find(m => m.idMembresia == membresia.value);
  // Siempre usamos el precio BASE original
  let precioBase = m ? Number(m.precio ?? m.precioSugerido ?? 0) : 0;

  // Asignamos el precio base al input (SIN DESCUENTO)
  precioMembresia.value = precioBase;

  // Solo calculamos el descuento para mostrarlo visualmente en el texto
  actualizarInfoVisualDescuento(precioBase);
}

// Actualizar el input con el precio final
precioMembresia.value = precioFinal;

// Mostrar info del descuento
const spanInfo = document.getElementById("infoDescuentoMembresia");
if (spanInfo) {
  if (descuentoSelect && descuentoSelect.value && precioBase > 0) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find(d => d.idDescuento === descId);
    if (descObj) {
      const montoDesc = (precioBase * descObj.porcentaje) / 100;
      spanInfo.textContent = `Descuento aplicado: -$${montoDesc.toFixed(2)} (${descObj.porcentaje}%)`;
    } else {
      spanInfo.textContent = "";
    }
  } else {
    spanInfo.textContent = "";
  }
}


function actualizarInfoVisualDescuento(precioBase) {
  const descuentoSelect = document.getElementById("descuento");
  const spanInfo = document.getElementById("infoDescuentoMembresia");

  if (!spanInfo) return;

  // Limpiar mensaje si no hay datos
  spanInfo.textContent = "";

  if (descuentoSelect && descuentoSelect.value && precioBase > 0) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find(d => d.idDescuento === descId);

    if (descObj) {
      const montoDesc = (precioBase * descObj.porcentaje) / 100;
      const precioFinalEstimado = precioBase - montoDesc;

      // Mostramos cuánto se descontará, pero NO tocamos el input precioMembresia
      spanInfo.innerHTML = `
        <span class="text-green-400">-${descObj.porcentaje}% ($${montoDesc.toFixed(2)})</span> 
        <span class="text-gray-400 text-sm">Final: $${precioFinalEstimado.toFixed(2)}</span>
      `;
    }
  }
}

// Tambien debemos actualizar el precio al cambiar el descuento
function actualizarPrecioMembresiaPorDescuento() {
  // 1. Actualizar la info visual del input de membresía (si hay una seleccionada)
  if (tipoDetalle.value === "MEMBRESIA" && precioMembresia.value) {
    const precioActual = Number(precioMembresia.value);
    actualizarInfoVisualDescuento(precioActual);
  } else {
    const spanInfo = document.getElementById("infoDescuentoMembresia");
    if (spanInfo) spanInfo.textContent = "";
  }

  // 2. Recalcular los totales del carrito (Subtotal - Descuento Global)
  calcularTotales();
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

  // Limpiar los inputs después de agregar el detalle
  producto.value = "";
  membresia.value = "";
  cantidad.value = tipo === "MEMBRESIA" ? 1 : "";
  precio.value = "";
  precioMembresia.value = "";
}

/* Ocultar tabla si no hay detalles */
function renderDetalles() {
  const tableContainer = document.querySelector(".table-container");
  if (detalles.length === 0) {
    if (tableContainer) tableContainer.classList.add("hidden");
  } else {
    if (tableContainer) tableContainer.classList.remove("hidden");

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
  calcularTotales();
}

function calcularTotales() {
  const descuentoSelect = document.getElementById("descuento");
  const lblSubtotal = document.getElementById("lblSubtotal");
  const lblDescuento = document.getElementById("lblDescuento");
  const lblTotal = document.getElementById("lblTotal");

  // 1. Calcular Subtotal
  const subtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);

  // 2. Calcular Descuento (Solo sobre membresías)
  let descuentoMonto = 0;

  if (descuentoSelect && descuentoSelect.value) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find(d => d.idDescuento === descId);

    if (descObj) {
      // Filtrar solo ítems de tipo Membresía
      // En el frontend, d.idProducto existe para productos, y d.idMembresia para membresías.
      const montoMembresias = detalles
        .filter(d => d.idMembresia != null)
        .reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);

      const porcentaje = descObj.porcentaje;

      if (montoMembresias > 0) {
        descuentoMonto = (montoMembresias * porcentaje) / 100;
      }
    }
  }

  const total = subtotal - descuentoMonto;

  // 3. Render
  if (lblSubtotal) lblSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (lblDescuento) lblDescuento.textContent = `-$${descuentoMonto.toFixed(2)}`;
  if (lblTotal) lblTotal.textContent = `$${total.toFixed(2)}`;
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

  // Validate custom date if 'otro' is selected
  const grupoFecha = document.getElementById("fechaInicioGroup");
  if (grupoFecha && !grupoFecha.classList.contains("hidden")) {
    const seleccionFecha = document.querySelector('input[name="fechaInicio"]:checked')?.value;
    if (seleccionFecha === "otro") {
      const customDate = document.getElementById("fechaCustom")?.value;
      if (!customDate) {
        return Alerta.warning("Seleccione una fecha de inicio personalizada");
      }
    }
  }

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
    idDescuento: document.getElementById("descuento").value ? Number(document.getElementById("descuento").value) : null,
    fechaInicioMembresia: obtenerFechaInicioSeleccionada(),
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
    vencimientoInfo = null;
    buscarSocio.value = "";
    buscarSocio.disabled = false;
    resultadosSocio.innerHTML = "";
    resultadosSocio.classList.add("hidden");
    document.getElementById("fechaInicioGroup").classList.add("hidden");

    renderDetalles();
    pagoForm.reset();
    document.getElementById("descuento").value = "";
    document.getElementById("infoDescuentoMembresia").textContent = ""; // Limpiar info descuento
    calcularTotales();
    onTipoDetalleChange();

  } catch {
    Alerta.error("No se pudo conectar con el servidor");
  }
}

/* ================== FECHA INICIO MEMBRESÍA ================== */
async function consultarUltimoVencimiento(dni) {
  try {
    const res = await authFetch(`/socios/${dni}/ultimo-vencimiento`);
    if (!res.ok) {
      vencimientoInfo = null;
      actualizarVisibilidadFechaInicio();
      return;
    }
    vencimientoInfo = await res.json();
    actualizarVisibilidadFechaInicio();
  } catch {
    vencimientoInfo = null;
    actualizarVisibilidadFechaInicio();
  }
}

function actualizarVisibilidadFechaInicio() {
  const grupo = document.getElementById("fechaInicioGroup");
  if (!grupo) return;

  // Mostrar solo si: tipo MEMBRESIA + socio seleccionado + membresía vencida + tiene ultimo vencimiento
  const mostrar = tipoDetalle.value === "MEMBRESIA"
    && socioSeleccionado
    && vencimientoInfo
    && !vencimientoInfo.vigente
    && vencimientoInfo.ultimoVencimiento;

  if (mostrar) {
    const fechaVenc = new Date(vencimientoInfo.ultimoVencimiento + "T00:00:00");
    const fechaInicioDesdeVenc = new Date(fechaVenc);
    fechaInicioDesdeVenc.setDate(fechaInicioDesdeVenc.getDate() + 1);

    const hoy = new Date();

    document.getElementById("lblFechaVencimiento").textContent = formatearFecha(fechaInicioDesdeVenc);
    document.getElementById("lblFechaHoy").textContent = formatearFecha(hoy);

    // Reset UI for 'otro' option
    const customContainer = document.getElementById("fechaCustomContainer");
    if (customContainer) customContainer.classList.add("hidden");
    const radioVencimiento = document.querySelector('input[name="fechaInicio"][value="vencimiento"]');
    if (radioVencimiento) radioVencimiento.checked = true;
    const inputCustom = document.getElementById("fechaCustom");
    if (inputCustom) inputCustom.value = "";

    grupo.classList.remove("hidden");
  } else {
    grupo.classList.add("hidden");
  }
}

function obtenerFechaInicioSeleccionada() {
  const grupo = document.getElementById("fechaInicioGroup");
  if (!grupo || grupo.classList.contains("hidden")) return null;

  const seleccion = document.querySelector('input[name="fechaInicio"]:checked')?.value;
  if (!seleccion || !vencimientoInfo?.ultimoVencimiento) return null;

  if (seleccion === "vencimiento") {
    // Día siguiente al último vencimiento
    const fechaVenc = new Date(vencimientoInfo.ultimoVencimiento + "T00:00:00");
    fechaVenc.setDate(fechaVenc.getDate() + 1);
    return fechaVenc.toISOString().split("T")[0]; // yyyy-mm-dd
  } else if (seleccion === "hoy") {
    return new Date().toISOString().split("T")[0];
  } else if (seleccion === "otro") {
    const custom = document.getElementById("fechaCustom")?.value;
    return custom ? custom : null;
  }
  return null;
}

function formatearFecha(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
