import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

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

export function init() {
  const go = page => navigateTo(page.replace('.html', ''));

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
        item.className = "search-item group flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors outline-none focus:bg-white/10";
        item.tabIndex = 0;
        item.innerHTML = `
          <div class="w-10 h-10 rounded-lg bg-black/50 text-gray-500 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="block truncate font-bold text-gray-200 group-hover:text-white transition-colors text-base">${socio.nombre}</span>
            <span class="text-xs text-gray-500 font-medium tracking-wide">DNI: <span class="font-mono text-gray-400 group-hover:text-gray-300">${socio.dni}</span></span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-75">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
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
}

export function destroy() {
  // Limpieza al cambiar de ruta
  if (timeoutModalExito) {
    clearTimeout(timeoutModalExito);
  }
}

// ===== Últimas asistencias del día =====
async function cargarUltimasAsistencias() {
  const lista = document.getElementById("listaUltimasAsistenciasHome");
  if (!lista) return;

  try {
    const hoy = new Date().toISOString().split('T')[0];
    const res = await authFetch(`/asistencias?page=0&size=4&desde=${hoy}&hasta=${hoy}`);

    if (!res.ok) throw new Error();
    const data = await res.json();

    if (!data.content || data.content.length === 0) {
      lista.innerHTML = '<p class="text-gray-500 text-xs text-center py-2">No hay asistencias registradas hoy</p>';
      return;
    }

    lista.innerHTML = data.content.map(a => {
      const hora = formatTime(a.fechaHora);
      return `
        <div class="recent-item bg-black/40 border border-[#222] px-3 py-1.5 rounded-lg flex items-center gap-3">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span class="recent-item-name font-bold text-gray-300 text-xs tracking-wide uppercase truncate max-w-[120px]">${a.nombre || a.dni}</span>
          <span class="recent-item-time text-gray-500 font-mono text-[10px] bg-[#111] px-1.5 py-0.5 rounded border border-[#333]">${hora}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    lista.innerHTML = '<p class="text-gray-500 text-xs w-full text-center py-2">Error cargando asistencias</p>';
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
        <div class="flex items-start gap-4 mb-2">
          <div class="icon-box w-10 h-10 border border-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-lg leading-tight truncate tracking-wide">${socio.nombre}</p>
            <p class="text-gray-400 text-sm mt-0.5">DNI: ${socio.dni}</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-[#333] flex justify-between items-center -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
          <span class="text-sm font-bold text-gray-400">Asistencias disp.</span>
          <span class="text-lg font-black px-3 py-0.5 rounded-full ${data.disponibles <= 2 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}">${data.disponibles}</span>
        </div>
      `;
  } catch {
    infoSocio.innerHTML = `
        <div class="flex items-start gap-4 mb-2">
          <div class="icon-box w-10 h-10 border border-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-lg leading-tight truncate tracking-wide">${socio.nombre}</p>
            <p class="text-gray-400 text-sm mt-0.5">DNI: ${socio.dni}</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-yellow-500/20 flex justify-center items-center bg-yellow-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
          <span class="text-xs font-bold text-yellow-500 w-full text-center">Sin membresía activa (pendiente)</span>
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
      <div class="flex items-start gap-4 mb-2">
          <div class="icon-box w-10 h-10 border border-secondary/20 bg-secondary/10 text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-md leading-tight truncate tracking-wide">${membresia.tipo}</p>
            <p class="text-gray-400 text-xs mt-0.5 font-bold uppercase tracking-wider">Plan Activo</p>
          </div>
        </div>
      <div class="mt-4 pt-4 border-t border-[#333] flex justify-between items-center -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
        <span class="text-sm font-bold text-gray-400">Vencimiento</span>
        <span class="text-sm font-black text-white px-3 py-1 rounded bg-[#222] border border-[#333]">${membresia.vencimiento}</span>
      </div>
    `;
  } catch {
    infoMembresia.innerHTML = `
        <div class="flex items-start gap-4 mb-2">
          <div class="icon-box w-10 h-10 border border-gray-500/20 bg-gray-500/10 text-gray-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0 flex items-center h-10">
            <p class="text-gray-400 font-bold text-sm">Ningún plan activo asociado</p>
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

          const diasLabel = hoy ? 'Hoy' : manana ? 'Mañana' : `${s.diasRestantes} d`;

          return `
          <div class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#111] border border-[#222] hover:bg-[#161616] hover:border-[#333] cursor-pointer transition-all group"
              onclick="window.location.hash='#/socio-detalle?dni=${s.dni}'">
            <div class="flex items-center gap-3 min-w-0">
              <div class="icon-box w-8 h-8 m-0 border border-white/10">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">${s.nombre}</p>
                <p class="text-xs text-gray-500 font-bold truncate">${s.nombreMembresia}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <span class="text-xs text-gray-500 font-bold">${formatDate(s.fechaVencimiento)}</span>
              <span class="text-xs font-black px-2 py-1 rounded ${pillClass}">${diasLabel}</span>
              <svg class="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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

    if (!seccion || !lista || !cantidad) {
      return;
    }

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
        : `${s.diasSinAsistir} d`;

      li.innerHTML = `
            < span > ${s.nombre}</span >
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
