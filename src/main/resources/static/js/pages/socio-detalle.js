import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { formatDate, formatDateTime } from "../utils/date-utils.js";

checkAuth();
const API_URL = "/socios";

// Estado global
let socioActual = null;
let membresiaActual = null;
let membresiasDisponibles = [];
let pagoAAnular = null;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const dni = params.get("dni");

    if (!dni) {
        Alerta.error("Socio inválido");
        return;
    }

    // Cargar membresías disponibles para renovación
    await cargarMembresiasDisponibles();

    cargarKPIs(dni);
    cargarSocio(dni);
    cargarMembresiaVigente(dni);
    cargarRutinaActiva(dni);
    cargarHistorialPagos(dni);

    // Botones
    // Botones
    document.getElementById("btnVolver")?.addEventListener("click", () => history.back());
    document.getElementById("btnEditar")?.addEventListener("click", () => window.location.href = `editar-socio.html?dni=${dni}`);
    document.getElementById("btnRegistrarPago")?.addEventListener("click", () => window.location.href = `registrar-pago.html?dni=${dni}`);
    document.getElementById("btnRegistrarAsistencia")?.addEventListener("click", () => { window.location.href = `asistencia.html?dni=${dni}&asistencia=true`; });
    document.getElementById("btnRenovarMembresia")?.addEventListener("click", () => renovarMembresia(dni));

    // Modal de anulación
    document.getElementById("btnCancelarAnular")?.addEventListener("click", cerrarModalAnular);
    document.getElementById("btnConfirmarAnular")?.addEventListener("click", () => confirmarAnularPago(dni));
    document.getElementById("modalAnularPago")?.querySelector(".modal-backdrop")?.addEventListener("click", cerrarModalAnular);
});

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
        const membresia = membresiasDisponibles.find(m => m.nombre === membresiaActual.tipo);
        if (!membresia) {
            Alerta.error("No se encontró el plan en el catálogo");
            return;
        }

        // Obtener primer empleado activo
        const resEmpleados = await authFetch("/empleados");
        const empleados = await resEmpleados.json();
        const empleadoActivo = empleados.find(e => e.activo);
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
            detalles: [{
                idMembresia: membresia.idMembresia,
                cantidad: 1,
                precioUnitario: membresia.precioSugerido
            }]
        };

        const res = await authFetch("/pagos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pagoData)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Error al registrar el pago");
        }

        Alerta.success(`✓ Membresía renovada: ${membresia.nombre} - $${membresia.precioSugerido}`);

        // Recargar datos
        setTimeout(() => {
            window.location.reload();
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
        const resSocio = await authFetch(`${API_URL}/${dni}`);
        const socio = await resSocio.json();

        const activoRes = await authFetch(`${API_URL}/activo-mes?dni=${dni}`);
        const activo = await activoRes.json();

        // Actualizar KPI Estado
        const kpiEstadoCard = document.getElementById("kpiEstado");
        const estadoEl = kpiEstadoCard.querySelector("p:last-child");
        estadoEl.textContent = activo ? "Activo" : "Inactivo";
        estadoEl.className = `kpi-value ${activo ? 'text-green-400' : 'text-red-400'}`;

        // Actualizar Status Badge en Hero
        const statusBadge = document.getElementById("statusBadge");
        const statusText = document.getElementById("statusText");
        if (activo) {
            statusBadge.className = 'status-badge status-badge-success';
        } else {
            statusBadge.className = 'status-badge status-badge-danger';
        }
        statusText.textContent = activo ? 'ACTIVO' : 'INACTIVO';

        // Visitas de la semana
        const resVisitas = await authFetch(`/asistencias/estadisticas/semana-actual?q=${dni}`);
        const visitas = await resVisitas.json();
        document.getElementById("kpiVisitas").querySelector("p:last-child").textContent = visitas ?? 0;

        // Membresía y vencimiento
        try {
            const resMembresia = await authFetch(`${API_URL}/${dni}/membresia-vigente`);
            if (resMembresia.status === 409) throw { status: 409 };
            const m = await resMembresia.json();

            document.getElementById("kpiMembresia").querySelector("p:last-child").textContent = m.tipo;

            const resVencimiento = await authFetch(`${API_URL}/dias-para-vencer-membresiavigente?q=${dni}`);
            const dias = await resVencimiento.json();

            // KPI Vencimiento
            const kpiVencEl = document.getElementById("kpiVencimiento");
            const kpiVencValue = kpiVencEl.querySelector("p:last-child");
            kpiVencValue.textContent = dias + ' días';
            kpiVencEl.style.display = "block";

            // Colorear según urgencia
            if (dias <= 3) {
                kpiVencValue.className = 'text-2xl font-bold text-red-400';
            } else if (dias <= 7) {
                kpiVencValue.className = 'text-2xl font-bold text-yellow-400';
            } else {
                kpiVencValue.className = 'text-2xl font-bold text-[var(--beige)]';
            }

            // Actualizar info de vencimiento en el hero
            const expiryInfo = document.getElementById("expiryInfo");
            const expiryDate = document.getElementById("expiryDate");
            const expiryDays = document.getElementById("expiryDays");

            expiryInfo.style.display = "block";
            expiryDate.textContent = m.vencimiento || '--/--/----';
            expiryDays.textContent = dias + ' días';
            if (dias <= 3) {
                expiryDays.className = 'text-xs text-red-400 font-medium';
            } else if (dias <= 7) {
                expiryDays.className = 'text-xs text-yellow-400 font-medium';
            } else {
                expiryDays.className = 'text-xs text-gray-400';
            }

        } catch (err) {
            if (err.status === 409) {
                document.getElementById("kpiMembresia").querySelector("p:last-child").textContent = "Vencida";
                document.getElementById("kpiMembresia").querySelector("p:last-child").className = 'kpi-value text-red-400';
                document.getElementById("kpiVencimiento").style.display = "none";
                document.getElementById("expiryInfo").style.display = "none";

                // Actualizar status a vencido
                const statusBadge = document.getElementById("statusBadge");
                const statusText = document.getElementById("statusText");
                statusBadge.className = 'status-badge status-badge-danger';
                statusText.textContent = 'VENCIDO';
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
        const res = await authFetch(`${API_URL}/${dni}/membresia-vigente`);
        if (res.status === 409) throw { status: 409 };
        const m = await res.json();

        // Guardar membresía actual para renovación
        membresiaActual = m;

        renderMembresiaCard(container, m.tipo, m.tipoMembresia, "Vigente",
            m.vencimiento ? m.vencimiento : "-"
        );

        // Mostrar botón de renovar con el precio
        const membresiaCatalogo = membresiasDisponibles.find(mem => mem.nombre === m.tipo);
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

                    const membresiaCatalogo = membresiasDisponibles.find(mem => mem.nombre === ultima.nombreMembresia);
                    if (membresiaCatalogo && btnRenovar) {
                        btnRenovar.classList.remove("hidden");
                        btnRenovar.querySelector("#btnRenovarTexto").textContent =
                            `Renovar ${ultima.nombreMembresia} - $${membresiaCatalogo.precioSugerido}`;
                    }
                }
            } catch { }

            container.innerHTML = `
                <div class="col-span-full bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <svg class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        { label: "Plan", valor: nombre || "—" },
        { label: "Tipo", valor: tipo || "—" },
        { label: "Estado", valor: estado },
        { label: "Vencimiento", valor: vencimiento }
    ];

    campos.forEach(c => {
        const card = document.createElement("div");
        card.className = "border border-[var(--input-border)] bg-[#1a1a1a] rounded-lg p-4 hover:border-[var(--orange)]/50 transition";
        card.innerHTML = `
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">${c.label}</p>
            <p class="text-lg font-bold text-[var(--beige)]">${c.valor}</p>
        `;
        container.appendChild(card);
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
                    <h3 class="text-lg font-semibold text-[var(--beige)]">${rutina.nombre || 'Sin nombre'}</h3>
                    <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            ${rutina.nombreEmpleado || 'Sin asignar'}
                        </span>
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            ${formatDate(rutina.fecha)}
                        </span>
                        ${rutina.descripcion ? `<span class="text-gray-500">${rutina.descripcion}</span>` : ''}
                    </div>
                </div>
                <button onclick="window.location.href='ver-rutina.html?id=${rutina.idRutina}'" 
                    class="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-medium px-4 py-2 rounded-md transition">
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
        const res = await authFetch(`${API_URL}/${dni}`);

        if (!res.ok) {
            console.error("Error en respuesta:", res.status, res.statusText);
            Alerta.error("Error al cargar los datos del socio");
            return;
        }

        const socio = await res.json();
        socioActual = socio;

        // Actualizar Hero Section
        const nombreCompleto = socio.nombre || 'Sin nombre';
        document.getElementById("nombreSocio").textContent = nombreCompleto;
        document.getElementById("dniSocio").textContent = socio.dni || '--------';

        // Avatar con iniciales
        const iniciales = nombreCompleto.split(' ')
            .slice(0, 2)
            .map(n => n.charAt(0).toUpperCase())
            .join('');
        document.getElementById("avatarSocio").innerHTML = `<span>${iniciales || '--'}</span>`;

        // Teléfono
        const telEl = document.getElementById("telefonoSocio");
        if (telEl) {
            if (socio.telefono) {
                telEl.querySelector('span').textContent = socio.telefono;
                telEl.style.display = 'flex';
            } else {
                telEl.style.display = 'none';
            }
        }

        // Email
        const emailEl = document.getElementById("emailSocio");
        if (emailEl) {
            if (socio.email) {
                emailEl.querySelector('span').textContent = socio.email;
                emailEl.style.display = 'flex';
            } else {
                emailEl.style.display = 'none';
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

        tbody.innerHTML = pagos.map(pago => {
            const fecha = formatDate(pago.fecha);
            const detalles = pago.detalles?.map(d => `${d.nombre} x${d.cantidad}`).join(', ') || '-';
            const monto = `$${pago.monto?.toLocaleString('es-AR') || 0}`;

            // Estado con colores semánticos
            let badgeClass = 'badge-success';
            let estadoTexto = 'Pagado';
            if (pago.estado === 'ANULADO') {
                badgeClass = 'badge-danger';
                estadoTexto = 'Anulado';
            } else if (pago.estado === 'PENDIENTE') {
                badgeClass = 'badge-warning';
                estadoTexto = 'Pendiente';
            }

            // Solo mostrar botón anular si está PAGADO
            const btnAnular = pago.estado === 'PAGADO'
                ? `<button data-id="${pago.idPago}" data-monto="${pago.monto}" class="btn-anular table-action-btn table-action-btn-danger" title="Anular">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                   </button>`
                : '<span class="text-gray-600 text-xs">—</span>';

            return `
                <tr>
                    <td class="text-gray-400">${fecha}</td>
                    <td class="max-w-xs truncate" title="${detalles}">${detalles}</td>
                    <td class="font-medium">${monto}</td>
                    <td><span class="badge ${badgeClass}">${estadoTexto}</span></td>
                    <td>${btnAnular}</td>
                </tr>
            `;
        }).join('');

        // Agregar event listeners a los botones de anular
        tbody.querySelectorAll('.btn-anular').forEach(btn => {
            btn.addEventListener('click', () => {
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

    info.textContent = `Pago #${idPago} - Monto: $${Number(monto).toLocaleString('es-AR')}`;
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
            method: "PATCH"
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Error al anular el pago");
        }

        Alerta.success("Pago anulado correctamente");
        cerrarModalAnular();

        // Recargar datos
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




