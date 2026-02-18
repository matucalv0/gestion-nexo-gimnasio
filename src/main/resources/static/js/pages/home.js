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

document.addEventListener("DOMContentLoaded", () => {
  const go = page => window.location.href = page;

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
          <svg class="w-4 h-4 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
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
        go("socios.html?focus=true");
        break;
    }
  });

  // ===== MODAL POR VENCER =====
  const modalPorVencer = document.getElementById("modalPorVencer");
  const kpiPorVencerCard = document.getElementById("kpiPorVencerCard");
  const cerrarModalPorVencer = document.getElementById("cerrarModalPorVencer");
  const backdropPorVencer = modalPorVencer?.querySelector(".modal-backdrop");

  kpiPorVencerCard?.addEventListener("click", () => {
    modalPorVencer?.classList.remove("hidden");
  });
  cerrarModalPorVencer?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });
  backdropPorVencer?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalPorVencer?.classList.contains("hidden")) {
      modalPorVencer.classList.add("hidden");
    }
  });

  // ===== Cargar datos =====
  cargarDashboard();
  cargarSociosInactivos();
  cargarUltimasAsistencias();
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
          <div class="empty-state py-6">
            <p class="text-gray-500 text-sm">No hay membresías por vencer en los próximos 7 días</p>
          </div>
        `;
      } else {
        listaPorVencer.innerHTML = data.listaPorVencer.map(s => `
          <div class="detail-item cursor-pointer hover:bg-[#1a1a1a] transition"
               onclick="window.location.href='socio-detalle.html?dni=${s.dni}'">
            <div>
              <p class="detail-item-name">${s.nombre}</p>
              <p class="detail-item-type">${s.nombreMembresia}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold ${s.diasRestantes <= 2 ? 'text-red-400' : 'text-yellow-400'}">
                ${s.diasRestantes === 0 ? 'Hoy' : s.diasRestantes === 1 ? 'Mañana' : `${s.diasRestantes} días`}
              </p>
              <p class="text-xs text-gray-500">${formatDate(s.fechaVencimiento)}</p>
            </div>
          </div>
        `).join('');
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
      li.className = "flex justify-between items-center text-gray-300";

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
