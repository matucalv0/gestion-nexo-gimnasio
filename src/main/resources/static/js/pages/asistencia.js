import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_SOCIOS = "/socios";

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("inputBusqueda");
  const btnRegistrar = document.getElementById("btnRegistrarAsistencia");
  const btnHome = document.getElementById("btnHome");
  const resultadosBusqueda = document.getElementById("resultadosBusqueda");
  const infoSocio = document.getElementById("infoSocio");
  const infoMembresia = document.getElementById("infoMembresia");

  let socioSeleccionado = null;
  let asistenciasDisponibles = null;

  // ===== Navegación =====
  if (btnHome) {
    btnHome.addEventListener("click", () => window.location.href = "home.html");
  }

  // ===== Registrar asistencia =====
  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", registrar);
  } else {
    console.warn("No se encontró el botón de registrar asistencia");
  }

  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      registrar();
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

  // ===== Funciones =====

  async function preseleccionarSocioDesdeFicha(dni) {
    try {
      const res = await authFetch(`${API_SOCIOS}/${dni}`);
      if (!res.ok) throw new Error("Socio no encontrado");

      const socio = await res.json();
      socioSeleccionado = socio;

      input.value = `${socio.nombre} - ${socio.dni}`;
      input.disabled = true; // opcional: bloquear input
      resultadosBusqueda.classList.add("hidden");

      await cargarInfoSocio(socio);
      await cargarInfoMembresia(socio);

    } catch (err) {
      mostrarAlerta({
        mensaje: "No se pudo cargar el socio desde ficha",
        tipo: "danger"
      });
    }
  }

  async function buscarSocios(valor) {
    resultadosBusqueda.innerHTML = "";
    socioSeleccionado = null;

    if (!valor.trim()) return;

    try {
      const res = await authFetch(`${API_SOCIOS}/search?q=${encodeURIComponent(valor)}`);
      const socios = await res.json();

      socios.forEach(socio => {
        const item = document.createElement("div");
        item.className =
          "px-4 py-2 cursor-pointer text-[var(--beige)] hover:bg-orange-500/20 transition";
        item.textContent = `${socio.nombre} - ${socio.dni}`;

        item.addEventListener("click", async () => {
          socioSeleccionado = socio;
          input.value = item.textContent;
          resultadosBusqueda.innerHTML = "";
          resultadosBusqueda.classList.add("hidden");

          await cargarInfoSocio(socio);
          await cargarInfoMembresia(socio);
        });

        resultadosBusqueda.appendChild(item);
      });

      resultadosBusqueda.classList.toggle("hidden", socios.length === 0);

    } catch (err) {
      console.error(err);
      mostrarAlerta({
        mensaje: "Error al buscar socios",
        tipo: "danger"
      });
    }
  }

  async function registrar() {
    limpiarAlertas();

    if (!socioSeleccionado) {
      mostrarAlerta({ mensaje: "Seleccione un socio primero", tipo: "warning" });
      return;
    }

    if (asistenciasDisponibles !== null && asistenciasDisponibles <= 0) {
      mostrarAlerta({ mensaje: "No quedan asistencias disponibles", tipo: "warning" });
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
      const fecha = new Date(data.fechaHora).toLocaleDateString("es-AR");

      mostrarAlerta({
        mensaje: `Asistencia registrada para ${socioSeleccionado.nombre} - (${fecha})`,
        tipo: "success"
      });

      await cargarInfoSocio(socioSeleccionado);
      await cargarInfoMembresia(socioSeleccionado);

      resetFormulario();

    } catch (err) {
      mostrarAlerta({
        mensaje: err.message || "No se pudo registrar la asistencia",
        tipo: "danger"
      });
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
        Asistencias disponibles: <strong>${data.disponibles}</strong>
      `;
    } catch {
      infoSocio.textContent = "El socio no tiene asistencias disponibles";
      asistenciasDisponibles = 0;
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
    resultadosBusqueda.innerHTML = "";
    resultadosBusqueda.classList.add("hidden");
    infoSocio.classList.add("hidden");
    infoMembresia.classList.add("hidden");
    input.disabled = false;
  }
});


