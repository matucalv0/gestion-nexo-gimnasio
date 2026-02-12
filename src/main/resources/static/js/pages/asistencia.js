import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { formatDate, formatTime } from "../utils/date-utils.js";

checkAuth();

const API_SOCIOS = "/socios";

// Sonidos de feedback (opcional, falla silenciosamente si no hay soporte)
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

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("inputBusqueda");
  const btnRegistrar = document.getElementById("btnRegistrarAsistencia");
  const btnHome = document.getElementById("btnHome");
  const resultadosBusqueda = document.getElementById("resultadosBusqueda");
  const infoSocio = document.getElementById("infoSocio");
  const infoMembresia = document.getElementById("infoMembresia");

  let socioSeleccionado = null;
  let asistenciasDisponibles = null;
  let ultimaBusqueda = [];

  // Foco automático en el input
  input?.focus();

  // ===== Navegación =====
  if (btnHome) {
    btnHome.addEventListener("click", () => history.back());
  }

  // ===== Registrar asistencia =====
  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", registrar);
  }

  // ===== ENTER: Registro rápido =====
  input?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const valor = input.value.trim();

      // Si ya hay socio seleccionado, registrar
      if (socioSeleccionado) {
        await registrar();
        return;
      }

      // Si el valor parece un DNI (solo números), buscar y registrar directamente
      if (/^\d{7,8}$/.test(valor)) {
        await registrarRapidoPorDni(valor);
        return;
      }

      // Si hay resultados y solo hay uno, seleccionarlo y registrar
      if (ultimaBusqueda.length === 1) {
        socioSeleccionado = ultimaBusqueda[0];
        await registrar();
        return;
      }

      // Si no hay socio seleccionado, mostrar advertencia
      Alerta.warning("Ingrese DNI o seleccione un socio de la lista");
    }

    // Navegación con flechas en resultados
    if (e.key === "ArrowDown" && ultimaBusqueda.length > 0) {
      e.preventDefault();
      const items = resultadosBusqueda.querySelectorAll("div");
      if (items.length > 0) items[0].focus();
    }
  });

  input?.addEventListener("input", () => {
    const valor = input.value.trim();
    if (!valor) {
      resetFormulario();
      return;
    }
    buscarSocios(valor);
  });

  // ===== Preselección desde ficha =====
  const params = new URLSearchParams(window.location.search);
  const dniFromFicha = params.get("dni");
  const esAsistencia = params.get("asistencia") === "true";

  if (dniFromFicha && esAsistencia) {
    await preseleccionarSocioDesdeFicha(dniFromFicha);
  }

  // ===== REGISTRO RÁPIDO POR DNI =====
  async function registrarRapidoPorDni(dni) {
    try {
      // Buscar socio por DNI exacto
      const resSocio = await authFetch(`${API_SOCIOS}/${dni}`);
      if (!resSocio.ok) {
        Alerta.error(`No se encontró socio con DNI ${dni}`);
        playSound('error');
        return;
      }

      const socio = await resSocio.json();
      socioSeleccionado = socio;

      // Registrar asistencia directamente
      const res = await authFetch(`${API_SOCIOS}/${dni}/asistencias`, { method: "POST" });

      if (!res.ok) {
        let mensaje = "Error al registrar asistencia";
        try {
          const body = await res.json();
          mensaje = body.message || mensaje;
        } catch { }
        Alerta.error(mensaje);
        playSound('error');
        return;
      }

      Alerta.success(`✓ ${socio.nombre}`);
      playSound('success');

      // Limpiar para el siguiente
      resetFormulario();
      cargarUltimasAsistencias(); // Actualizar lista
      input?.focus();

    } catch (err) {
      Alerta.error("Error al registrar asistencia");
      playSound('error');
    }
  }

  // ===== Funciones =====

  async function preseleccionarSocioDesdeFicha(dni) {
    try {
      const res = await authFetch(`${API_SOCIOS}/${dni}`);
      if (!res.ok) throw new Error("Socio no encontrado");

      const socio = await res.json();
      socioSeleccionado = socio;

      input.value = `${socio.nombre} - ${socio.dni}`;
      input.disabled = true;
      resultadosBusqueda.classList.add("hidden");

      await cargarInfoSocio(socio);
      await cargarInfoMembresia(socio);

    } catch (err) {
      Alerta.error("No se pudo cargar el socio desde ficha");
    }
  }

  async function buscarSocios(valor) {
    resultadosBusqueda.innerHTML = "";
    socioSeleccionado = null;

    if (!valor.trim()) return;

    try {
      const res = await authFetch(`${API_SOCIOS}/search?q=${encodeURIComponent(valor)}`);
      const socios = await res.json();
      ultimaBusqueda = socios;

      socios.forEach((socio, index) => {
        const item = document.createElement("div");
        item.className =
          "px-4 py-2 cursor-pointer text-[var(--beige)] hover:bg-orange-500/20 transition focus:bg-orange-500/20 outline-none";
        item.tabIndex = 0;
        item.textContent = `${socio.nombre} - ${socio.dni}`;

        item.addEventListener("click", async () => {
          socioSeleccionado = socio;
          input.value = item.textContent;
          resultadosBusqueda.innerHTML = "";
          resultadosBusqueda.classList.add("hidden");

          await cargarInfoSocio(socio);
          await cargarInfoMembresia(socio);
        });

        // Enter en item seleccionado
        item.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            socioSeleccionado = socio;
            await registrar();
          }
          if (e.key === "ArrowDown" && index < socios.length - 1) {
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
        });

        resultadosBusqueda.appendChild(item);
      });

      resultadosBusqueda.classList.toggle("hidden", socios.length === 0);

    } catch (err) {
      console.error(err);
      Alerta.error("Error al buscar socios");
    }
  }

  async function registrar() {
    if (!socioSeleccionado) {
      Alerta.warning("Seleccione un socio primero");
      return;
    }

    // Solo bloquear si tiene membresía activa pero sin asistencias disponibles
    if (asistenciasDisponibles !== null && asistenciasDisponibles <= 0) {
      Alerta.warning("No quedan asistencias disponibles");
      playSound('error');
      return;
    }

    try {
      const res = await authFetch(`${API_SOCIOS}/${socioSeleccionado.dni}/asistencias`, { method: "POST" });

      if (!res.ok) {
        let mensaje = "Error al registrar asistencia";
        try {
          const body = await res.json();
          mensaje = body.message || mensaje;
        } catch { }
        throw new Error(mensaje);
      }

      const data = await res.json();

      Alerta.success(`✓ Asistencia registrada: ${socioSeleccionado.nombre}`);
      playSound('success');

      resetFormulario();
      cargarUltimasAsistencias(); // Actualizar lista
      input?.focus();

    } catch (err) {
      Alerta.error(err.message || "No se pudo registrar la asistencia");
      playSound('error');
    }
  }

  async function cargarInfoSocio(socio) {
    infoSocio.classList.remove("hidden");
    infoSocio.textContent = "Cargando información...";

    try {
      const res = await authFetch(`${API_SOCIOS}/${socio.dni}/asistencias-disponibles`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      asistenciasDisponibles = data.disponibles;

      infoSocio.innerHTML = `
        <strong>${socio.nombre}</strong><br>
        DNI: ${socio.dni}<br>
        Asistencias disponibles: <strong class="${data.disponibles <= 2 ? 'text-yellow-400' : 'text-green-400'}">${data.disponibles}</strong>
      `;
    } catch {
      infoSocio.innerHTML = `
        <strong>${socio.nombre}</strong><br>
        DNI: ${socio.dni}<br>
        <span class="text-yellow-400">Sin membresía activa (quedará como pendiente)</span>
      `;
      asistenciasDisponibles = null;
    }
  }

  async function cargarInfoMembresia(socio) {
    infoMembresia.classList.remove("hidden");
    infoMembresia.textContent = "Cargando información...";

    try {
      const res = await authFetch(`${API_SOCIOS}/${socio.dni}/membresia-vigente`);
      if (!res.ok) throw new Error();

      const membresia = await res.json();

      infoMembresia.innerHTML = `
        <strong>Plan activo</strong><br>
        Tipo: ${membresia.tipo}<br>
        Vence: ${membresia.vencimiento}
      `;
    } catch {
      infoMembresia.textContent = "El socio no tiene ningún plan activo";
    }
  }

  function resetFormulario() {
    input.value = "";
    socioSeleccionado = null;
    asistenciasDisponibles = null;
    ultimaBusqueda = [];
    resultadosBusqueda.innerHTML = "";
    resultadosBusqueda.classList.add("hidden");
    infoSocio.classList.add("hidden");
    infoMembresia.classList.add("hidden");
    input.disabled = false;
  }

  // Cargar últimas asistencias del día
  async function cargarUltimasAsistencias() {
    const lista = document.getElementById("listaUltimasAsistencias");
    if (!lista) return;

    try {
      // Obtener asistencias de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const res = await authFetch(`/asistencias?page=0&size=10&desde=${hoy}&hasta=${hoy}`);

      if (!res.ok) throw new Error();

      const data = await res.json();

      if (!data.content || data.content.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-sm text-center">No hay asistencias registradas hoy</p>';
        return;
      }

      lista.innerHTML = data.content.map(a => {
        const hora = formatTime(a.fechaHora);
        return `
          <div class="flex items-center justify-between py-2 px-3 bg-[#121212] rounded hover:bg-[#252525] cursor-pointer transition"
               onclick="document.getElementById('inputBusqueda').value='${a.dni}'; document.getElementById('inputBusqueda').dispatchEvent(new Event('input'))">
            <span class="text-[var(--beige)] text-sm truncate">${a.nombreSocio || a.dni}</span>
            <span class="text-gray-500 text-xs">${hora}</span>
          </div>
        `;
      }).join('');

    } catch (err) {
      lista.innerHTML = '<p class="text-gray-500 text-sm">Error cargando asistencias</p>';
    }
  }

  // Cargar al inicio
  cargarUltimasAsistencias();
});


