import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { formatDate, formatDateTime } from "../utils/date-utils.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();
const API_URL = "/socios";

// Estado global
let socioActual = null;
let membresiaActual = null;
let membresiasDisponibles = [];
let pagoAAnular = null;

let cacheSocioFetch = null;
let cacheMembresiaFetch = null;
let cacheDni = null;

function getSocioFetch(dni) {
  if (cacheDni !== dni) {
    cacheSocioFetch = null;
    cacheMembresiaFetch = null;
    cacheDni = dni;
  }
  if (!cacheSocioFetch) cacheSocioFetch = authFetch(`${API_URL}/${dni}`);
  return cacheSocioFetch.then((res) => res.clone());
}

function getMembresiaFetch(dni) {
  if (cacheDni !== dni) {
    cacheSocioFetch = null;
    cacheMembresiaFetch = null;
    cacheDni = dni;
  }
  if (!cacheMembresiaFetch)
    cacheMembresiaFetch = authFetch(`${API_URL}/${dni}/membresia-vigente`);
  return cacheMembresiaFetch.then((res) => res.clone());
}

function invalidarCaches() {
  cacheSocioFetch = null;
  cacheMembresiaFetch = null;
}

let _currentDni = null;

export async function init() {
  const params = getRouteParams();
  const dni = params.get("dni");
  _currentDni = dni;

  if (!dni) {
    Alerta.error("Socio inválido");
    return;
  }

  // Cargar membresías disponibles y datos del socio en paralelo
  await Promise.all([
    cargarMembresiasDisponibles(),
    cargarKPIs(dni),
    cargarSocio(dni),
    cargarMembresiaVigente(dni),
    cargarRutinaActiva(dni),
    cargarHistorialPagos(dni),
  ]).catch((err) => console.error("Error en carga inicial de socio", err));

  // Botones
  document
    .getElementById("btnVolver")
    ?.addEventListener("click", () => history.back());
  document
    .getElementById("btnEditar")
    ?.addEventListener("click", () => navigateTo("editar-socio", { dni }));
  document
    .getElementById("btnRegistrarPago")
    ?.addEventListener("click", () => navigateTo("registrar-pago", { dni }));
  document
    .getElementById("btnRenovarMembresia")
    ?.addEventListener("click", () => renovarMembresia(dni));

  // Modal de anulación
  document
    .getElementById("btnCancelarAnular")
    ?.addEventListener("click", cerrarModalAnular);
  document
    .getElementById("btnConfirmarAnular")
    ?.addEventListener("click", () => confirmarAnularPago(dni));
  document
    .getElementById("modalAnularPago")
    ?.querySelector(".modal-backdrop")
    ?.addEventListener("click", cerrarModalAnular);
}

export function destroy() {
  // Cleanup
}

async function cargarMembresiasDisponibles() {
  try {
    const res = await authFetch("/membresias");
    membresiasDisponibles = await res.json();
  } catch (err) {
    console.error("Error cargando membresías:", err);
  }
}

async function renovarMembresia(dni) {
  if (!membresiaActual) {
    Alerta.error("No se pudo obtener la membresía actual");
    return;
  }

  const btn = document.getElementById("btnRenovarMembresia");
  const textoOriginal = btn.querySelector("#btnRenovarTexto").textContent;

  try {
    btn.disabled = true;
    btn.querySelector("#btnRenovarTexto").textContent = "Procesando...";

    // Buscar la membresía en el catálogo
    const membresia = membresiasDisponibles.find(
      (m) => m.nombre === membresiaActual.tipo,
    );
    if (!membresia) {
      Alerta.error("No se encontró el plan en el catálogo");
      return;
    }

    // Obtener primer empleado activo
    const resEmpleados = await authFetch("/empleados");
    const empleados = await resEmpleados.json();
    const empleadoActivo = empleados.find((e) => e.activo);
    if (!empleadoActivo) {
      Alerta.error("No hay empleados activos para registrar el pago");
      return;
    }

    // Obtener primer medio de pago
    const resMedios = await authFetch("/mediosdepago");
    const mediosPago = await resMedios.json();
    if (mediosPago.length === 0) {
      Alerta.error("No hay medios de pago configurados");
      return;
    }

    // Crear el pago
    const pagoData = {
      estado: "PAGADO",
      dniSocio: dni,
      idMedioPago: mediosPago[0].idMedioPago,
      dniEmpleado: empleadoActivo.dni,
      detalles: [
        {
          idMembresia: membresia.idMembresia,
          cantidad: 1,
          precioUnitario: membresia.precioSugerido,
        },
      ],
    };

    const res = await authFetch("/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al registrar el pago");
    }

    Alerta.success(
      `✓ Membresía renovada: ${membresia.nombre} - $${membresia.precioSugerido}`,
    );

    // Recargar datos (sin reload en SPA)
    invalidarCaches();
    setTimeout(async () => {
      await Promise.all([
        cargarKPIs(_currentDni),
        cargarMembresiaVigente(_currentDni),
        cargarHistorialPagos(_currentDni),
      ]);
    }, 1500);
  } catch (err) {
    console.error("Error renovando membresía:", err);
    Alerta.error(err.message || "Error al renovar la membresía");
  } finally {
    btn.disabled = false;
    btn.querySelector("#btnRenovarTexto").textContent = textoOriginal;
  }
}

async function cargarKPIs(dni) {
  try {
    const resSocio = await getSocioFetch(dni);
    const socio = await resSocio.json();

    const activo = socio.activo === true;

    // Actualizar KPI Estado
    const kpiEstadoCard = document.getElementById("kpiEstado");
    const estadoEl = kpiEstadoCard.querySelector("p:last-child");
    estadoEl.textContent = activo ? "Activo" : "Inactivo";
    estadoEl.className = `kpi-value ${activo ? "text-green-400" : "text-red-400"}`;

    // Actualizar Status Badge en Hero
    const statusBadge = document.getElementById("statusBadge");
    const statusText = document.getElementById("statusText");
    if (activo) {
      statusBadge.className = "status-badge status-badge-success";
    } else {
      statusBadge.className = "status-badge status-badge-danger";
    }
    statusText.textContent = activo ? "ACTIVO" : "INACTIVO";

    // Visitas de la semana
    const resVisitas = await authFetch(
      `/asistencias/estadisticas/semana-actual?q=${dni}`,
    );
    const visitas = await resVisitas.json();
    document
      .getElementById("kpiVisitas")
      .querySelector("p:last-child").textContent = visitas ?? 0;

    // Membresía y vencimiento
    try {
      const resMembresia = await getMembresiaFetch(dni);
      if (resMembresia.status === 409) throw { status: 409 };
      const m = await resMembresia.json();

      document
        .getElementById("kpiMembresia")
        .querySelector("p:last-child").textContent = m.tipo;

      const resVencimiento = await authFetch(
        `${API_URL}/dias-para-vencer-membresiavigente?q=${dni}`,
      );
      const dias = await resVencimiento.json();

      // KPI Vencimiento
      const kpiVencEl = document.getElementById("kpiVencimiento");
      const kpiVencValue = kpiVencEl.querySelector("p:last-child");
      kpiVencValue.textContent = dias + " días";
      kpiVencEl.style.display = "block";

      // Colorear según urgencia
      if (dias <= 3) {
        kpiVencValue.className = "text-2xl font-bold text-red-400";
      } else if (dias <= 7) {
        kpiVencValue.className = "text-2xl font-bold text-yellow-400";
      } else {
        kpiVencValue.className = "text-2xl font-bold text-[var(--beige)]";
      }

      // Actualizar info de vencimiento en el hero
      const expiryInfo = document.getElementById("expiryInfo");
      const expiryDate = document.getElementById("expiryDate");
      const expiryDays = document.getElementById("expiryDays");

      expiryInfo.style.display = "block";
      expiryDate.textContent = m.vencimiento || "--/--/----";
      expiryDays.textContent = dias + " días";
      if (dias <= 3) {
        expiryDays.className = "text-xs text-red-400 font-medium";
      } else if (dias <= 7) {
        expiryDays.className = "text-xs text-yellow-400 font-medium";
      } else {
        expiryDays.className = "text-xs text-gray-400";
      }
    } catch (err) {
      if (err.status === 409) {
        document
          .getElementById("kpiMembresia")
          .querySelector("p:last-child").textContent = "Vencida";
        document
          .getElementById("kpiMembresia")
          .querySelector("p:last-child").className =
          "text-2xl font-black text-red-500 tracking-tight tabular-nums truncate";
        document.getElementById("kpiVencimiento").style.display = "none";
        document.getElementById("expiryInfo").style.display = "none";

        // Actualizar status a vencido
        const statusBadge = document.getElementById("statusBadge");
        const statusDot = document.getElementById("statusDot");
        const statusText = document.getElementById("statusText");

        statusBadge.className =
          "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-red-500/10 border border-red-500/20";
        statusDot.className =
          "w-2 h-2 rounded-full mr-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
        statusText.className = "text-red-400 tracking-wide";
        statusText.textContent = "VENCIDO";
      } else {
        console.error("Error al cargar KPIs de membresía:", err);
      }
    }
  } catch (err) {
    console.error("Error al cargar KPIs:", err);
  }
}

async function cargarMembresiaVigente(dni) {
  const container = document.getElementById("membresiaContainer");
  const btnRenovar = document.getElementById("btnRenovarMembresia");
  container.innerHTML = "";

  try {
    const res = await getMembresiaFetch(dni);
    if (res.status === 409) throw { status: 409 };
    const m = await res.json();

    // Guardar membresía actual para renovación
    membresiaActual = m;

    renderMembresiaCard(
      container,
      m.tipo,
      m.tipoMembresia,
      "Vigente",
      m.vencimiento ? m.vencimiento : "-",
    );

    // Mostrar botón de renovar con el precio
    const membresiaCatalogo = membresiasDisponibles.find(
      (mem) => mem.nombre === m.tipo,
    );
    if (membresiaCatalogo && btnRenovar) {
      btnRenovar.classList.remove("hidden");
      btnRenovar.querySelector("#btnRenovarTexto").textContent =
        `Renovar ${m.tipo} - $${membresiaCatalogo.precioSugerido}`;
    }
  } catch (err) {
    if (err.status === 409) {
      // Membresía vencida - intentar obtener la última para poder renovar
      membresiaActual = null;
      try {
        const resHistorial = await authFetch(`${API_URL}/${dni}/membresias`);
        const historial = await resHistorial.json();
        if (historial && historial.length > 0) {
          // Tomar la última membresía
          const ultima = historial[historial.length - 1];
          membresiaActual = { tipo: ultima.nombreMembresia };

          const membresiaCatalogo = membresiasDisponibles.find(
            (mem) => mem.nombre === ultima.nombreMembresia,
          );
          if (membresiaCatalogo && btnRenovar) {
            btnRenovar.classList.remove("hidden");
            btnRenovar.querySelector("#btnRenovarTexto").textContent =
              `Renovar ${ultima.nombreMembresia} - $${membresiaCatalogo.precioSugerido}`;
          }
        }
      } catch {}

      container.innerHTML = `
                <div class="col-span-full bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center lg:items-start gap-3">
                    <svg class="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div>
                        <p class="text-red-400 font-semibold">Membresía vencida</p>
                        <p class="text-gray-400 text-sm mt-1">El socio no tiene una membresía activa. Renovar para habilitar el acceso.</p>
                    </div>
                </div>
            `;
    } else {
      console.error("Error al cargar la membresía:", err);
      Alerta.error("Error al cargar la membresía");
    }
  }
}

function renderMembresiaCard(container, nombre, tipo, estado, vencimiento) {
  const campos = [
    { label: "Plan Adquirido", valor: nombre || "—" },
    { label: "Modalidad", valor: tipo || "—" },
    { label: "Estado Actual", valor: estado },
    { label: "Fecha Vencimiento", valor: vencimiento },
  ];

  campos.forEach((c, index) => {
    const card = document.createElement("div");
    card.className =
      "bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-[var(--orange)]/30 transition-colors";

    // Efecto de brillo sutil en hover
    const glow = document.createElement("div");
    glow.className =
      "absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--orange)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none";
    card.appendChild(glow);

    const content = document.createElement("div");
    content.className = "relative z-10";
    content.innerHTML = `
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">${c.label}</p>
            <p class="text-lg font-black text-gray-200 tracking-tight">${c.valor}</p>
        `;
    card.appendChild(content);

    // Animar entrada
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";
    card.style.transition = `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 100}ms`;
    container.appendChild(card);

    requestAnimationFrame(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    });
  });
}

async function cargarRutinaActiva(dni) {
  const container = document.getElementById("rutinaContainer");
  container.innerHTML = "";

  try {
    const res = await authFetch(`${API_URL}/${dni}/rutina-activa`);
    if (!res.ok) {
      container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <svg class="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <p class="text-gray-500">No hay rutina activa asignada</p>
                </div>
            `;
      return;
    }

    const rutina = await res.json();

    // Si solo retorna un mensaje, no hay rutina
    if (rutina.mensaje) {
      container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <svg class="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <p class="text-gray-500">${rutina.mensaje}</p>
                </div>
            `;
      return;
    }

    container.innerHTML = `
            <div class="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 class="text-lg font-semibold text-[var(--beige)]">${rutina.nombre || "Sin nombre"}</h3>
                    <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            ${rutina.nombreEmpleado || "Sin asignar"}
                        </span>
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            ${formatDate(rutina.fecha)}
                        </span>
                        ${rutina.descripcion ? `<span class="text-gray-500">${rutina.descripcion}</span>` : ""}
                    </div>
                </div>
                <button onclick="window.location.hash='#/ver-rutina?id=${rutina.idRutina}'" 
                    class="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white border border-indigo-500/40 px-3 py-1.5 text-sm rounded-md transition">
                    Ver rutina completa
                </button>
            </div>
        `;
  } catch (err) {
    console.error("Error al cargar la rutina activa:", err);
    container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <p class="text-red-400">Error al cargar la rutina</p>
            </div>
        `;
  }
}

/* ===== DETALLES SOCIO Y MEMBRESÍA ===== */
async function cargarSocio(dni) {
  try {
    const res = await getSocioFetch(dni);

    if (!res.ok) {
      console.error("Error en respuesta:", res.status, res.statusText);
      Alerta.error("Error al cargar los datos del socio");
      return;
    }

    const socio = await res.json();
    socioActual = socio;

    // Actualizar Hero Section
    const nombreCompleto = socio.nombre || "Sin nombre";
    document.getElementById("nombreSocio").textContent = nombreCompleto;
    document.getElementById("dniSocio").textContent = socio.dni || "--------";

    // Avatar Dinámico (Color Hash)
    const iniciales = nombreCompleto
      .split(" ")
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join("");

    const colors = [
      "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
      "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
      "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]",
      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    ];

    const glowColors = [
      "bg-rose-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];

    let hash = 0;
    for (let i = 0; i < nombreCompleto.length; i++) {
      hash = nombreCompleto.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;

    const avatarEl = document.getElementById("avatarSocio");
    avatarEl.className = `relative w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black border-2 transition-all duration-300 ${colors[colorIndex]}`;
    avatarEl.innerHTML = `<span>${iniciales || "--"}</span>`;

    // Decorative glow
    document.getElementById("avatarDecoration").className =
      `absolute -inset-2 rounded-[2rem] opacity-20 blur-xl transition-all duration-500 ${glowColors[colorIndex]}`;

    // Teléfono
    const telEl = document.getElementById("telefonoSocio");
    if (telEl) {
      if (socio.telefono) {
        telEl.querySelector("span").textContent = socio.telefono;
        telEl.style.display = "flex";
      } else {
        telEl.style.display = "none";
      }
    }

    // Email
    const emailEl = document.getElementById("emailSocio");
    if (emailEl) {
      if (socio.email) {
        emailEl.querySelector("span").textContent = socio.email;
        emailEl.style.display = "flex";
      } else {
        emailEl.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Error al cargar socio:", err);
    Alerta.error("Error al cargar los datos del socio");
  }
}

/* ===== HISTORIAL DE PAGOS ===== */
async function cargarHistorialPagos(dni) {
  const tbody = document.getElementById("tablaPagosBody");

  try {
    const res = await authFetch(`${API_URL}/${dni}/pagos`);
    if (!res.ok) throw new Error("Error cargando pagos");

    const pagos = await res.json();

    if (!pagos || pagos.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state py-8">
                            <div class="empty-state-icon">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                </svg>
                            </div>
                            <h3 class="empty-state-title">Sin pagos</h3>
                            <p class="empty-state-desc">No hay pagos registrados para este socio</p>
                        </div>
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = pagos
      .map((pago) => {
        const fecha = formatDate(pago.fecha);
        const detalles =
          pago.detalles?.map((d) => `${d.nombre} x${d.cantidad}`).join(", ") ||
          "-";
        const monto = `$${pago.monto?.toLocaleString("es-AR") || 0}`;

        // Estado con colores semánticos
        let dotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        if (pago.estado === "ANULADO")
          dotColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
        else if (pago.estado === "PENDIENTE")
          dotColor = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";

        // Solo mostrar botón anular si está PAGADO
        const btnAnular =
          pago.estado === "PAGADO"
            ? `<button data-id="${pago.idPago}" data-monto="${pago.monto}" class="btn-anular w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Anular Pago">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                   </button>`
            : '<span class="text-gray-600 text-xs w-8 inline-block text-center">—</span>';

        return `
                <tr class="hover:bg-[#161616] transition-colors group">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                            <span class="text-sm text-gray-400 font-medium group-hover:text-gray-300 transition-colors">${fecha}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 max-w-[120px] truncate text-sm text-gray-300 font-medium" title="${detalles}">${detalles}</td>
                    <td class="py-3 px-4 text-right">
                        <span class="text-sm font-bold text-gray-200">${monto}</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center">
                            ${btnAnular}
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");

    // Agregar event listeners a los botones de anular
    tbody.querySelectorAll(".btn-anular").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idPago = btn.dataset.id;
        const monto = btn.dataset.monto;
        abrirModalAnular(idPago, monto);
      });
    });
  } catch (err) {
    console.error("Error cargando pagos:", err);
    tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state py-8">
                        <p class="text-red-400 text-sm">Error al cargar los pagos</p>
                    </div>
                </td>
            </tr>
        `;
  }
}

function abrirModalAnular(idPago, monto) {
  pagoAAnular = idPago;
  const modal = document.getElementById("modalAnularPago");
  const info = document.getElementById("modalPagoInfo");

  info.textContent = `Pago #${idPago} - Monto: $${Number(monto).toLocaleString("es-AR")}`;
  modal.classList.remove("hidden");
}

function cerrarModalAnular() {
  pagoAAnular = null;
  document.getElementById("modalAnularPago").classList.add("hidden");
}

async function confirmarAnularPago(dni) {
  if (!pagoAAnular) return;

  const btn = document.getElementById("btnConfirmarAnular");
  const textoOriginal = btn.textContent;

  try {
    btn.disabled = true;
    btn.textContent = "Anulando...";

    const res = await authFetch(`/pagos/${pagoAAnular}/anular`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Error al anular el pago");
    }

    Alerta.success("Pago anulado correctamente");
    cerrarModalAnular();

    // Recargar datos
    invalidarCaches();
    cargarHistorialPagos(dni);
    cargarMembresiaVigente(dni);
    cargarKPIs(dni);
  } catch (err) {
    console.error("Error anulando pago:", err);
    Alerta.error(err.message || "Error al anular el pago");
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}
