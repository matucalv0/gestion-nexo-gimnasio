import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_SOCIOS = "/socios";

// ===== Audio feedback =====
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'success') {
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
    } else {
      osc.frequency.value = 300;
      gain.gain.value = 0.1;
    }
    osc.start();
    setTimeout(() => osc.stop(), 150);
  } catch (e) { /* ignore */ }
};

let timeoutModalExito = null;

document.addEventListener("DOMContentLoaded", () => {
  const go = page => window.location.href = page;

  // ===== HEADER: fecha contextual =====
  const headerSaludo = document.getElementById("headerSaludo");
  if (headerSaludo) {
    const ahora = new Date();
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const dia = diasSemana[ahora.getDay()];
    const fecha = `${ahora.getDate()} ${meses[ahora.getMonth()]}`;
    headerSaludo.textContent = `${dia} ${fecha} · NEXO`;
  }

  // ===== NAVEGACIÓN =====
  document.getElementById("btnLogout")?.addEventListener("click", logout);
  document.getElementById("quickSocio")?.addEventListener("click", () => go("registrar-socio.html"));
  document.getElementById("quickPago")?.addEventListener("click", () => go("registrar-pago.html"));

  // ===== REGISTRO RÁPIDO DE ASISTENCIA =====
  const input = document.getElementById("inputAsistenciaRapida");
  const resultadosBusqueda = document.getElementById("resultadosBusquedaHome");

  let ultimaBusqueda = [];
  let debounceTimer = null;

  // Foco automático
  input?.focus();

  // Debounced search on input
  input?.addEventListener("input", () => {
    const valor = input.value.trim();
    if (!valor) {
      resultadosBusqueda.innerHTML = "";
      resultadosBusqueda.classList.add("hidden");
      ultimaBusqueda = [];
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => buscarSocios(valor), 250);
  });

  // ENTER: registro rápido
  input?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const valor = input.value.trim();

      // Si el valor parece un DNI (7-8 dígitos), registro directo
      if (/^\d{7,8}$/.test(valor)) {
        await registrarRapidoPorDni(valor);
        return;
      }

      // Si hay un solo resultado, registrar ese
      if (ultimaBusqueda.length === 1) {
        await registrarAsistencia(ultimaBusqueda[0]);
        return;
      }

      Alerta.warning("Ingrese un DNI o seleccione un socio de la lista");
    }

    // Navegación con flechas
    if (e.key === "ArrowDown" && ultimaBusqueda.length > 0) {
      e.preventDefault();
      const items = resultadosBusqueda.querySelectorAll(".search-item");
      if (items.length > 0) items[0].focus();
    }
  });

  // Click fuera para cerrar dropdown
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#inputAsistenciaRapida") && !e.target.closest("#resultadosBusquedaHome")) {
      resultadosBusqueda?.classList.add("hidden");
    }
  });

  // ===== Buscar socios =====
  async function buscarSocios(valor) {
    try {
      const res = await authFetch(`${API_SOCIOS}/search?q=${encodeURIComponent(valor)}`);
      const socios = await res.json();
      ultimaBusqueda = socios;

      resultadosBusqueda.innerHTML = "";

      socios.forEach((socio, index) => {
        const item = document.createElement("div");
        item.className = "search-item";
        item.tabIndex = 0;
        item.innerHTML = `
          <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <div class="flex-1 min-w-0">
            <span class="block truncate">${socio.nombre}</span>
            <span class="text-xs text-gray-500">${socio.dni}</span>
          </div>
          <svg class="w-4 h-4 text-primary transition-colors duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
          </svg>
        `;

        // Click to register directly
        item.addEventListener("click", async () => {
          await registrarAsistencia(socio);
        });

        // Keyboard nav in dropdown
        item.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            await registrarAsistencia(socio);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            item.nextElementSibling?.focus();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (index === 0) {
              input?.focus();
            } else {
              item.previousElementSibling?.focus();
            }
          }
          if (e.key === "Escape") {
            resultadosBusqueda.classList.add("hidden");
            input?.focus();
          }
        });

        resultadosBusqueda.appendChild(item);
      });

      resultadosBusqueda.classList.toggle("hidden", socios.length === 0);
    } catch (err) {
      console.error("Error buscando socios:", err);
    }
  }

  // ===== Registro rápido por DNI =====
  async function registrarRapidoPorDni(dni) {
    try {
      const resSocio = await authFetch(`${API_SOCIOS}/${dni}`);
      if (!resSocio.ok) {
        Alerta.error(`No se encontró socio con DNI ${dni}`);
        playSound('error');
        return;
      }
      const socio = await resSocio.json();
      await registrarAsistencia(socio);
    } catch (err) {
      Alerta.error("Error al buscar socio");
      playSound('error');
    }
  }

  // ===== Registrar asistencia =====
  async function registrarAsistencia(socio) {
    try {
      const res = await authFetch(`${API_SOCIOS}/${socio.dni}/asistencias`, { method: "POST" });

      if (!res.ok) {
        let mensaje = "Error al registrar asistencia";
        try {
          const body = await res.json();
          mensaje = body.message || mensaje;
        } catch { }
        Alerta.error(mensaje);
        playSound('error');
        resetInput();
        return;
      }

      Alerta.success(`Asistencia registrada - ${socio.nombre}`);
      playSound('success');

      // Actualizar KPI de asistencias
      const kpiEl = document.getElementById("kpiAsistenciasHoy");
      if (kpiEl) {
        const current = parseInt(kpiEl.textContent) || 0;
        kpiEl.textContent = current + 1;
      }

      resetInput();
      cargarUltimasAsistencias();

      // ===== Mostrar Modal de Éxito con Info del Socio =====
      mostrarModalExito(socio);

    } catch (err) {
      Alerta.error("No se pudo registrar la asistencia");
      playSound('error');
    }
  }

  function resetInput() {
    if (input) input.value = "";
    ultimaBusqueda = [];
    if (resultadosBusqueda) {
      resultadosBusqueda.innerHTML = "";
      resultadosBusqueda.classList.add("hidden");
    }
    input?.focus();
  }

  // ===== ATAJOS DE TECLADO GLOBALES =====
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key) {
      case "F2":
        e.preventDefault();
        input?.focus();
        break;
      case "F3":
        e.preventDefault();
        go("registrar-pago.html");
        break;
      case "F4":
        e.preventDefault();
        go("registrar-socio.html");
        break;
    }
  });

  // ===== MODAL POR VENCER =====
  const modalPorVencer = document.getElementById("modalPorVencer");
  const kpiPorVencerCard = document.getElementById("kpiPorVencerCard");
  const cerrarModalPorVencer = document.getElementById("cerrarModalPorVencer");
  const cerrarModalPorVencerFooter = document.getElementById("cerrarModalPorVencerFooter");
  const backdropPorVencer = modalPorVencer?.querySelector(".modal-backdrop");

  kpiPorVencerCard?.addEventListener("click", () => {
    modalPorVencer?.classList.remove("hidden");
  });
  cerrarModalPorVencer?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });
  cerrarModalPorVencerFooter?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });
  backdropPorVencer?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });

  // ===== MODAL ASISTENCIA EXITO =====
  const modalExito = document.getElementById("modalAsistenciaExito");
  const cerrarModalExito = document.getElementById("cerrarModalExito");
  const backdropExito = modalExito?.querySelector(".modal-backdrop");

  cerrarModalExito?.addEventListener("click", () => {
    ocultarModalExito();
  });
  backdropExito?.addEventListener("click", () => {
    ocultarModalExito();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!modalPorVencer?.classList.contains("hidden")) {
        modalPorVencer.classList.add("hidden");
      }
      if (!modalExito?.classList.contains("hidden")) {
        ocultarModalExito();
      }
    }
  });

  // ===== Cargar datos =====
  Promise.all([
    cargarDashboard(),
    cargarSociosInactivos(),
    cargarUltimasAsistencias()
  ]).catch(err => console.error("Error en carga inicial del home", err));
});

// ===== Últimas asistencias del día =====
async function cargarUltimasAsistencias() {
  const lista = document.getElementById("listaUltimasAsistenciasHome");
  if (!lista) return;

  try {
    const hoy = new Date().toISOString().split('T')[0];
    const res = await authFetch(`/asistencias?page=0&size=5&desde=${hoy}&hasta=${hoy}`);

    if (!res.ok) throw new Error();
    const data = await res.json();

    if (!data.content || data.content.length === 0) {
      lista.innerHTML = '<p class="text-gray-500 text-xs text-center py-2">No hay asistencias registradas hoy</p>';
      return;
    }

    lista.innerHTML = data.content.map(a => {
      const hora = formatTime(a.fechaHora);
      return `
        <div class="recent-item">
          <span class="recent-item-name truncate">${a.nombre || a.dni}</span>
          <span class="recent-item-time">${hora}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    lista.innerHTML = '<p class="text-gray-500 text-xs text-center py-2">Error cargando asistencias</p>';
  }
}

// ===== FUNCIONES PARA MODAL DE ÉXITO =====
async function mostrarModalExito(socio) {
  const modal = document.getElementById("modalAsistenciaExito");
  if (!modal) return;

  // Clear previous timeout if user rapidly registers another one
  if (timeoutModalExito) {
    clearTimeout(timeoutModalExito);
  }

  await Promise.all([
    cargarInfoSocioHome(socio),
    cargarInfoMembresiaHome(socio)
  ]);

  // Animate in
  modal.classList.remove("hidden");

  // Usamos setTimeout en vez de requestAnimationFrame para asegurar que el display: flex se aplique
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    const content = modal.querySelector(".modal-content");
    if (content) {
      content.classList.remove("scale-95");
      content.classList.add("scale-100");
    }
  }, 30);

  // Auto close in 4 seconds
  timeoutModalExito = setTimeout(() => {
    ocultarModalExito();
  }, 4000);
}

function ocultarModalExito() {
  const modal = document.getElementById("modalAsistenciaExito");
  if (!modal) return;

  modal.classList.add("opacity-0");
  const content = modal.querySelector(".modal-content");
  if (content) {
    content.classList.remove("scale-100");
    content.classList.add("scale-95");
  }

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);

  if (timeoutModalExito) clearTimeout(timeoutModalExito);
}

async function cargarInfoSocioHome(socio) {
  const infoSocio = document.getElementById("homeInfoSocio");
  infoSocio.innerHTML = `<p class="text-sm text-gray-500 animate-pulse text-center">Cargando socio...</p>`;

  try {
    const res = await authFetch(`${API_SOCIOS}/${socio.dni}/asistencias-disponibles`);
    if (!res.ok) throw new Error();

    const data = await res.json();
    infoSocio.innerHTML = `
        <div class="absolute left-0 top-0 h-full w-1 bg-primary rounded-l-xl"></div>
        <div class="flex items-start gap-4 mb-2">
          <div class="p-2.5 rounded-lg bg-primary/10 text-primary mt-1 border border-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-lg leading-tight truncate tracking-wide">${socio.nombre}</p>
            <p class="text-gray-400 text-sm font-mono mt-0.5">DNI: ${socio.dni}</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center bg-black/20 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
          <span class="text-sm font-medium text-gray-400">Asistencias disp.</span>
          <span class="text-lg font-black px-3 py-0.5 rounded-full shadow-inner border border-white/5 ${data.disponibles <= 2 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}">${data.disponibles}</span>
        </div>
      `;
  } catch {
    infoSocio.innerHTML = `
        <div class="absolute left-0 top-0 h-full w-1 bg-primary rounded-l-xl"></div>
        <div class="flex items-start gap-4 mb-2">
          <div class="p-2.5 rounded-lg bg-primary/10 text-primary mt-1 border border-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-lg leading-tight truncate tracking-wide">${socio.nombre}</p>
            <p class="text-gray-400 text-sm font-mono mt-0.5">DNI: ${socio.dni}</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-yellow-500/20 flex justify-center items-center bg-yellow-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
          <span class="text-xs font-semibold text-yellow-500 w-full text-center">Sin membresía activa (pendiente)</span>
        </div>
      `;
  }
}

async function cargarInfoMembresiaHome(socio) {
  const infoMembresia = document.getElementById("homeInfoMembresia");
  infoMembresia.innerHTML = `<p class="text-sm text-gray-500 animate-pulse text-center">Cargando membresía...</p>`;

  try {
    const res = await authFetch(`${API_SOCIOS}/${socio.dni}/membresia-vigente`);
    if (!res.ok) throw new Error();

    const membresia = await res.json();
    infoMembresia.innerHTML = `
        <div class="absolute left-0 top-0 h-full w-1 bg-secondary rounded-l-xl"></div>
        <div class="flex items-start gap-4 mb-2">
          <div class="p-2.5 rounded-lg bg-secondary/10 text-secondary mt-1 border border-secondary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-md leading-tight truncate tracking-wide">${membresia.tipo}</p>
            <p class="text-gray-400 text-xs mt-0.5 font-medium uppercase tracking-wider">Plan Activo</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center bg-black/20 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
          <span class="text-sm font-medium text-gray-400">Vencimiento</span>
          <span class="text-sm font-bold text-white tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-md shadow-inner">${membresia.vencimiento}</span>
        </div>
      `;
  } catch {
    infoMembresia.innerHTML = `
        <div class="absolute left-0 top-0 h-full w-1 bg-gray-500 rounded-l-xl"></div>
        <div class="flex items-start gap-4 mb-2">
          <div class="p-2.5 rounded-lg bg-gray-500/10 text-gray-400 mt-1 border border-gray-500/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0 flex items-center h-10">
            <p class="text-gray-400 font-medium text-sm">Ningún plan activo asociado</p>
          </div>
        </div>
      `;
  }
}

// ===== Dashboard KPIs =====
async function cargarDashboard() {
  try {
    const res = await authFetch("/dashboard");
    if (!res.ok) throw new Error("Error cargando dashboard");

    const data = await res.json();

    document.getElementById("kpiRecaudacionHoy").textContent =
      formatMoney(data.recaudacionHoy);
    document.getElementById("kpiSociosActivos").textContent =
      data.sociosActivos || 0;
    document.getElementById("kpiPorVencer").textContent =
      data.sociosPorVencer || 0;
    document.getElementById("kpiAsistenciasHoy").textContent =
      data.asistenciasHoy || 0;

    // Llenar lista de socios por vencer
    const listaPorVencer = document.getElementById("listaPorVencer");
    if (listaPorVencer && data.listaPorVencer) {
      if (data.listaPorVencer.length === 0) {
        listaPorVencer.innerHTML = `
          <div class="flex flex-col items-center justify-center py-8 gap-2">
            <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-600 text-sm text-center">Sin membresías por vencer en los próximos 7 días</p>
          </div>
        `;
      } else {
        listaPorVencer.innerHTML = data.listaPorVencer.map(s => {
          const urgente = s.diasRestantes <= 2;
          const hoy = s.diasRestantes === 0;
          const manana = s.diasRestantes === 1;

          const pillClass = hoy || manana
            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
            : urgente
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';

          const diasLabel = hoy ? 'Hoy' : manana ? 'Mañana' : `${s.diasRestantes}d`;

          return `
          <div class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 cursor-pointer transition-all group"
               onclick="window.location.href='socio-detalle.html?dni=${s.dni}'">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">${s.nombre}</p>
                <p class="text-[10px] text-gray-600 uppercase tracking-wider font-medium truncate">${s.nombreMembresia}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-[10px] text-gray-600">${formatDate(s.fechaVencimiento)}</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${pillClass}">${diasLabel}</span>
              <svg class="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>`;
        }).join('');
      }
    }

  } catch (err) {
    console.error("Error cargando dashboard", err);
  }
}

// ===== Socios inactivos =====
async function cargarSociosInactivos() {
  try {
    const res = await authFetch("/socios/inactivos?dias=7");
    const inactivos = await res.json();

    const seccion = document.getElementById("seccionSociosInactivos");
    const lista = document.getElementById("listaInactivos");
    const cantidad = document.getElementById("cantidadInactivos");

    if (!inactivos || inactivos.length === 0) {
      seccion.classList.add("hidden");
      return;
    }

    seccion.classList.remove("hidden");
    cantidad.textContent = inactivos.length;
    lista.innerHTML = "";

    inactivos.forEach(s => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center text-gray-300 py-1.5 border-b border-white/5 last:border-0";

      const diasTexto = s.diasSinAsistir >= 999
        ? "Nunca asistió"
        : `${s.diasSinAsistir}d`;

      li.innerHTML = `
        <span>${s.nombre}</span>
        <span class="text-yellow-400 text-xs">${diasTexto}</span>
      `;

      lista.appendChild(li);
    });

  } catch (err) {
    console.error("Error cargando socios inactivos", err);
  }
}

// ===== Utilidades =====
function formatMoney(amount) {
  if (amount == null) return "$0";
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  let date;
  const str = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
