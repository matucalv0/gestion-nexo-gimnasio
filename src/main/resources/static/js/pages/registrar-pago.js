import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderTabla } from "../ui/tabla.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

/* ================== STATE ================== */
let detalles = [];
let productosCache = [];
let membresiasCache = [];
let descuentosCache = [];
let socioSeleccionado = null;
let vencimientoInfo = null; // { ultimoVencimiento, vigente }

/* ================== INIT ================== */
export async function init() {
  // Cargar datos en paralelo para mayor velocidad
  await Promise.all([
    cargarMediosPago(),
    cargarMembresias(),
    cargarProductos(),
    cargarEmpleados(),
    cargarDescuentos(),
  ]);
  const btnLogout = document.getElementById("btnLogout");

  const params = getRouteParams();
  const dniFromFicha = params.get("dni");

  tipoDetalle.addEventListener("change", onTipoDetalleChange);
  producto.addEventListener("change", () => { cargarPrecioProducto(); calcularTotalesConPreview(); });
  membresia.addEventListener("change", () => { cargarPrecioMembresia(); calcularTotalesConPreview(); });
  cantidad.addEventListener("input", calcularTotalesConPreview);
  btnAgregarDetalle.addEventListener("click", agregarDetalle);
  document.getElementById("btnAgregarDetalleM")?.addEventListener("click", agregarDetalle);

  const descuentoSelect = document.getElementById("descuento");
  if (descuentoSelect) {
    descuentoSelect.addEventListener(
      "change",
      actualizarPrecioMembresiaPorDescuento,
    );
  }
  pagoForm.addEventListener("submit", registrarPago);

  const radiosFechaInicio = document.querySelectorAll(
    'input[name="fechaInicio"]',
  );
  radiosFechaInicio.forEach((radio) => {
    radio.addEventListener("change", () => {
      const customContainer = document.getElementById("fechaCustomContainer");
      if (customContainer) {
        customContainer.classList.toggle("hidden", radio.value !== "otro");
      }
      evaluarWarningAsistencias();
    });
  });

  const inputFechaCustom = document.getElementById("fechaCustom");
  if (inputFechaCustom) {
    inputFechaCustom.addEventListener("change", evaluarWarningAsistencias);
  }

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

  document
    .getElementById("btnHome")
    ?.addEventListener("click", () => history.back());
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
}

export function destroy() {
  // Limpiar timers o cache visual si fuera necesario
}

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
    const selected = index === 0 ? "selected" : ""; // Seleccionar el primero (generalmente Efectivo)
    medioPago.innerHTML += `<option value="${mp.idMedioPago}" ${selected}>${mp.nombre}</option>`;
  });
}

async function cargarProductos() {
  const res = await authFetch("/productos");
  productosCache = await res.json();
  producto.innerHTML = `<option value="">Seleccione...</option>`;
  productosCache.forEach(
    (p) =>
      (producto.innerHTML += `<option value="${p.idProducto}">${p.nombre}</option>`),
  );
}

async function cargarMembresias() {
  const res = await authFetch("/membresias");
  membresiasCache = await res.json();
  membresia.innerHTML = `<option value="">Seleccione...</option>`;
  membresiasCache.forEach(
    (m) =>
      (membresia.innerHTML += `<option value="${m.idMembresia}">${m.nombre}</option>`),
  );
}

async function cargarEmpleados() {
  const res = await authFetch("/empleados");
  const data = await res.json();
  empleado.innerHTML = `<option value="">Seleccione...</option>`;
  let primeroSeleccionado = false;
  data.forEach((e) => {
    if (e.activo) {
      const selected = !primeroSeleccionado ? "selected" : "";
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
      descuentosCache.forEach((d) => {
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

  socios.forEach((s) => {
    const li = document.createElement("li");
    li.className =
      "px-4 py-2 cursor-pointer hover:bg-gray-700 text-[var(--beige)] transition-colors duration-150 ease-in-out";
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
  productoGroup.classList.toggle("hidden", tipoDetalle.value !== "PRODUCTO");
  membresiaGroup.classList.toggle("hidden", tipoDetalle.value !== "MEMBRESIA");

  cantidad.value = tipoDetalle.value === "MEMBRESIA" ? 1 : cantidad.value;
  cantidad.disabled = tipoDetalle.value === "MEMBRESIA";

  precio.value = "";
  precioMembresia.value = "";

  // Limpiar info de descuento visual al cambiar tipo
  const spanInfo = document.getElementById("infoDescuentoMembresia");
  if (spanInfo) spanInfo.textContent = "";

  // Mostrar/ocultar selector de fecha inicio según tipo
  actualizarVisibilidadFechaInicio();

  // Bloquear descuento si es producto
  const descuentoSelect = document.getElementById("descuento");
  if (descuentoSelect) {
    descuentoSelect.disabled = tipoDetalle.value === "PRODUCTO";
    // Si cambia a Producto, resetear el descuento seleccionado
    if (tipoDetalle.value === "PRODUCTO") {
      descuentoSelect.value = "";
    }
  }

  // Actualizar HUD con los items ya en el carrito (sin preview ya que se limpiaron los precios)
  calcularTotalesConPreview();
}

/* ================== PRECIOS ================== */
function cargarPrecioProducto() {
  const p = productosCache.find((p) => p.idProducto == producto.value);
  precio.value = p ? (p.precio ?? p.precioSugerido ?? 0) : 0;
}

function cargarPrecioMembresia() {
  const m = membresiasCache.find((m) => m.idMembresia == membresia.value);
  // Siempre usamos el precio BASE original
  let precioBase = m ? Number(m.precio ?? m.precioSugerido ?? 0) : 0;

  // Asignamos el precio base al input (SIN DESCUENTO)
  precioMembresia.value = precioBase;

  // Solo calculamos el descuento para mostrarlo visualmente en el texto
  actualizarInfoVisualDescuento(precioBase);
}

function actualizarInfoVisualDescuento(precioBase) {
  const descuentoSelect = document.getElementById("descuento");
  const spanInfo = document.getElementById("infoDescuentoMembresia");

  if (!spanInfo) return;

  spanInfo.textContent = "";

  if (descuentoSelect && descuentoSelect.value && precioBase > 0) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find((d) => d.idDescuento === descId);

    if (descObj) {
      const montoDesc = (precioBase * descObj.porcentaje) / 100;
      const precioFinalEstimado = precioBase - montoDesc;
      spanInfo.innerHTML = `<span class="text-green-400">-${descObj.porcentaje}% ($${montoDesc.toFixed(2)})</span> <span class="text-gray-400">→ Final: $${precioFinalEstimado.toFixed(2)}</span>`;
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

  // 2. Recalcular totales con preview (incluye el item seleccionado aunque no se haya agregado)
  calcularTotalesConPreview();
}

/* ================== DETALLES ================== */
function agregarDetalle() {
  const tipo = tipoDetalle.value;
  let precioUnitario;

  if (tipo === "PRODUCTO") {
    if (!producto.value) return Alerta.warning("Seleccione un producto");
    precioUnitario = Number(precio.value);
  } else {
    if (!membresia.value) return Alerta.warning("Seleccione una membresía");
    precioUnitario = Number(precioMembresia.value);
  }

  if (!precioUnitario || precioUnitario <= 0)
    return Alerta.error("El ítem seleccionado no tiene precio");

  let detalle;
  if (tipo === "PRODUCTO") {
    detalle = {
      idProducto: Number(producto.value),
      cantidad: Number(cantidad.value),
      precioUnitario,
    };
  } else {
    detalle = {
      idSocio: socioSeleccionado ? socioSeleccionado.dni : null,
      idMembresia: Number(membresia.value),
      cantidad: 1,
      precioUnitario,
    };
  }

  detalles.push(detalle);
  renderDetalles();

  // Limpiar los inputs después de agregar el detalle
  producto.value = "";
  membresia.value = "";
  cantidad.value = 1;
  precio.value = "";
  precioMembresia.value = "";
}

/* Ocultar tabla si no hay detalles */
function renderDetalles() {
  const tableContainer = document.getElementById("tableContainer");
  if (detalles.length === 0) {
    if (tableContainer) tableContainer.classList.add("hidden");
  } else {
    if (tableContainer) tableContainer.classList.remove("hidden");

    renderTabla(
      detallesBody,
      detalles,
      [
        (d) => (d.idProducto ? "Producto" : "Membresía"),
        (d) =>
          d.idProducto
            ? (productosCache.find((p) => p.idProducto === d.idProducto)
                ?.nombre ?? "Desconocido")
            : (membresiasCache.find((m) => m.idMembresia === d.idMembresia)
                ?.nombre ?? "Desconocido"),
        (d) => d.cantidad,
        (d) => `$${d.precioUnitario}`,
      ],
      (d, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "text-[var(--orange)] font-medium hover:text-white transition-colors bg-[var(--orange)]/10 hover:bg-[var(--orange)] rounded-lg px-3 py-1";
        btn.textContent = "Eliminar";
        btn.addEventListener("click", () => {
          detalles.splice(i, 1);
          renderDetalles();
        });
        return btn;
      },
    );

    // FIX: Override `renderTabla` hardcoded bg-gray classes so it looks like a modern glass-card edge-to-edge table
    const rows = detallesBody.querySelectorAll("tr");
    rows.forEach((row, i) => {
      row.className = "hover:bg-white/5 transition-colors duration-150";
      const cells = row.querySelectorAll("td");
      cells.forEach((td, index) => {
        td.className = "py-3 px-4 text-[var(--beige)]";
        if (index === 2 || index === 4) td.classList.add("text-center");
        if (index === 3) td.classList.add("text-right");
      });
    });
  }
  calcularTotalesConPreview();
}

function calcularTotales() {
  const descuentoSelect = document.getElementById("descuento");
  const lblSubtotal = document.getElementById("lblSubtotal");
  const lblDescuento = document.getElementById("lblDescuento");
  const lblTotal = document.getElementById("lblTotal");

  // 1. Calcular Subtotal
  const subtotal = detalles.reduce(
    (acc, d) => acc + d.cantidad * d.precioUnitario,
    0,
  );

  // 2. Calcular Descuento (Solo sobre membresías)
  let descuentoMonto = 0;

  if (descuentoSelect && descuentoSelect.value) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find((d) => d.idDescuento === descId);

    if (descObj) {
      // Filtrar solo ítems de tipo Membresía
      // En el frontend, d.idProducto existe para productos, y d.idMembresia para membresías.
      const montoMembresias = detalles
        .filter((d) => d.idMembresia != null)
        .reduce((acc, d) => acc + d.cantidad * d.precioUnitario, 0);

      const porcentaje = descObj.porcentaje;

      if (montoMembresias > 0) {
        descuentoMonto = (montoMembresias * porcentaje) / 100;
      }
    }
  }

  const total = subtotal - descuentoMonto;

  // 3. Render
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  });
  if (lblSubtotal) lblSubtotal.textContent = formatter.format(subtotal);
  if (lblDescuento)
    lblDescuento.textContent = "-" + formatter.format(descuentoMonto);
  if (lblTotal) lblTotal.textContent = formatter.format(total);
}

/**
 * Calculates a LIVE preview of the totals (cart + currently selected item).
 * This runs on every item/quantity/discount change so the user sees the
 * running total without needing to click "Añadir".
 */
function calcularTotalesConPreview() {
  const tipo = tipoDetalle?.value;
  let precioPreview = 0;
  let cantidadPreview = 1;

  if (tipo === "PRODUCTO" && producto?.value) {
    precioPreview = Number(precio?.value ?? 0);
    cantidadPreview = Number(cantidad?.value ?? 1);
  } else if (tipo === "MEMBRESIA" && membresia?.value) {
    precioPreview = Number(precioMembresia?.value ?? 0);
    cantidadPreview = 1;
  }

  // Build a virtual combined list: committed cart + preview item
  const todoDetalles = [
    ...detalles,
    ...(precioPreview > 0
      ? [{ cantidad: cantidadPreview, precioUnitario: precioPreview, idMembresia: tipo === "MEMBRESIA" ? 1 : undefined, idProducto: tipo === "PRODUCTO" ? 1 : undefined }]
      : []),
  ];

  const descuentoSelect = document.getElementById("descuento");
  const lblSubtotal = document.getElementById("lblSubtotal");
  const lblDescuento = document.getElementById("lblDescuento");
  const lblTotal = document.getElementById("lblTotal");

  const subtotalPreview = todoDetalles.reduce(
    (acc, d) => acc + d.cantidad * d.precioUnitario,
    0,
  );

  let descuentoMontoPreview = 0;
  if (descuentoSelect && descuentoSelect.value) {
    const descId = Number(descuentoSelect.value);
    const descObj = descuentosCache.find((d) => d.idDescuento === descId);
    if (descObj) {
      const montoMembresias = todoDetalles
        .filter((d) => d.idMembresia != null)
        .reduce((acc, d) => acc + d.cantidad * d.precioUnitario, 0);
      if (montoMembresias > 0) {
        descuentoMontoPreview = (montoMembresias * descObj.porcentaje) / 100;
      }
    }
  }

  const totalPreview = subtotalPreview - descuentoMontoPreview;

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  });
  if (lblSubtotal) lblSubtotal.textContent = formatter.format(subtotalPreview);
  if (lblDescuento) lblDescuento.textContent = "-" + formatter.format(descuentoMontoPreview);
  if (lblTotal) lblTotal.textContent = formatter.format(totalPreview);
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
    if (!socioSeleccionado) {
      Alerta.warning("Seleccioná un socio para registrar el pago de membresía");
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
      precioUnitario,
    };
  } else {
    detalle = {
      idSocio: socioSeleccionado ? socioSeleccionado.dni : null,
      idMembresia: Number(membresia.value),
      cantidad: 1,
      precioUnitario,
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
    const seleccionFecha = document.querySelector(
      'input[name="fechaInicio"]:checked',
    )?.value;
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

  // Validar que si hay membresías en el pago, se haya seleccionado un socio
  const tieneMembresia = detalles.some((d) => d.idMembresia != null);
  if (tieneMembresia && !socioSeleccionado) {
    return Alerta.warning("Seleccioná un socio antes de registrar un pago de membresía");
  }

  if (!medioPago.value) return Alerta.warning("Seleccione un medio de pago");

  const data = {
    estado: "PAGADO",
    dniSocio: socioSeleccionado ? socioSeleccionado.dni : null,
    idMedioPago: Number(medioPago.value),
    dniEmpleado: empleado.value,
    idDescuento: document.getElementById("descuento").value
      ? Number(document.getElementById("descuento").value)
      : null,
    fechaInicioMembresia: obtenerFechaInicioSeleccionada(),
    detalles,
  };

  try {
    const res = await authFetch("/pagos", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let mensaje = "Error al registrar pago";
      try {
        const error = await res.json();
        mensaje = error.message || mensaje;
      } catch {}
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

  // Mostrar solo si: tipo MEMBRESIA + socio seleccionado + (membresía vencida o socio nuevo sin membresías)
  const esVencida =
    vencimientoInfo &&
    !vencimientoInfo.vigente &&
    vencimientoInfo.ultimoVencimiento;
  const esNuevo =
    vencimientoInfo &&
    !vencimientoInfo.vigente &&
    !vencimientoInfo.ultimoVencimiento;

  const mostrar =
    tipoDetalle.value === "MEMBRESIA" &&
    socioSeleccionado &&
    (esVencida || esNuevo);

  if (mostrar) {
    const radioVencimiento = document.querySelector(
      'input[name="fechaInicio"][value="vencimiento"]',
    );
    const radioHoy = document.querySelector(
      'input[name="fechaInicio"][value="hoy"]',
    );
    const labelVencimiento = radioVencimiento?.closest("label");
    const customContainer = document.getElementById("fechaCustomContainer");
    const inputCustom = document.getElementById("fechaCustom");

    const hoy = new Date();
    document.getElementById("lblFechaHoy").textContent = formatearFecha(hoy);

    if (esVencida) {
      // Socio con membresía vencida: mostrar las 3 opciones
      const fechaVenc = new Date(
        vencimientoInfo.ultimoVencimiento + "T00:00:00",
      );
      const fechaInicioDesdeVenc = new Date(fechaVenc);
      fechaInicioDesdeVenc.setDate(fechaInicioDesdeVenc.getDate() + 1);

      document.getElementById("lblFechaVencimiento").textContent =
        formatearFecha(fechaInicioDesdeVenc);
      if (labelVencimiento) labelVencimiento.classList.remove("hidden");
      if (radioVencimiento) radioVencimiento.checked = true;
    } else {
      // Socio nuevo: ocultar opción de vencimiento y seleccionar 'hoy' por defecto
      if (labelVencimiento) labelVencimiento.classList.add("hidden");
      if (radioHoy) radioHoy.checked = true;
    }

    // Reset UI for 'otro' option
    if (customContainer) customContainer.classList.add("hidden");
    if (inputCustom) inputCustom.value = "";

    grupo.classList.remove("hidden");
    evaluarWarningAsistencias();
  } else {
    grupo.classList.add("hidden");
    ocultarWarningAsistencias();
  }
}

function obtenerFechaInicioSeleccionada() {
  const grupo = document.getElementById("fechaInicioGroup");
  if (!grupo || grupo.classList.contains("hidden")) return null;

  const seleccion = document.querySelector(
    'input[name="fechaInicio"]:checked',
  )?.value;
  if (!seleccion) return null;

  if (seleccion === "vencimiento" && vencimientoInfo?.ultimoVencimiento) {
    // Día siguiente al último vencimiento
    const fechaVenc = new Date(vencimientoInfo.ultimoVencimiento + "T00:00:00");
    fechaVenc.setDate(fechaVenc.getDate() + 1);
    return fechaVenc.toISOString().split("T")[0]; // yyyy-mm-dd
  } else if (
    seleccion === "hoy" ||
    (seleccion === "vencimiento" && !vencimientoInfo?.ultimoVencimiento)
  ) {
    // Fallback de seguridad si seleccionó vencimiento pero no tiene uno (socios nuevos)
    return new Date().toISOString().split("T")[0];
  } else if (seleccion === "otro") {
    const custom = document.getElementById("fechaCustom")?.value;
    return custom ? custom : null;
  }
  return null;
}

/* ================== WARNING ASISTENCIAS PENDIENTES ================== */
function evaluarWarningAsistencias() {
  const warningDiv = document.getElementById("warningAsistenciasPendientes");
  const warningTexto = document.getElementById(
    "warningAsistenciasPendientesTexto",
  );
  if (!warningDiv || !warningTexto) return;

  // Solo evaluar si hay asistencias pendientes
  if (
    !vencimientoInfo ||
    !vencimientoInfo.asistenciasPendientes ||
    vencimientoInfo.asistenciasPendientes === 0
  ) {
    warningDiv.classList.add("hidden");
    return;
  }

  const fechaInicioElegida = obtenerFechaInicioSeleccionada();
  if (!fechaInicioElegida) {
    warningDiv.classList.add("hidden");
    return;
  }

  const primeraAsistencia = vencimientoInfo.primeraAsistenciaPendiente;
  if (!primeraAsistencia) {
    warningDiv.classList.add("hidden");
    return;
  }

  // Comparar: si la fecha de inicio elegida es posterior a la primera asistencia pendiente
  if (fechaInicioElegida > primeraAsistencia) {
    const fechaPendiente = new Date(primeraAsistencia + "T00:00:00");
    const cantPendientes = vencimientoInfo.asistenciasPendientes;
    warningTexto.textContent = `Hay ${cantPendientes} asistencia${cantPendientes > 1 ? "s" : ""} pendiente${cantPendientes > 1 ? "s" : ""} (la más antigua del ${formatearFecha(fechaPendiente)}) que no serán cubiertas con esta fecha de inicio.`;
    warningDiv.classList.remove("hidden");
  } else {
    warningDiv.classList.add("hidden");
  }
}

function ocultarWarningAsistencias() {
  const warningDiv = document.getElementById("warningAsistenciasPendientes");
  if (warningDiv) warningDiv.classList.add("hidden");
}

function formatearFecha(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
