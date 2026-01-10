import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_SOCIOS = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputBusqueda");
  const btnRegistrar = document.getElementById("btnRegistrar");
  const btnHome = document.getElementById("btnHome");

  const resultado = document.getElementById("resultado");
  const resultadosBusqueda = document.getElementById("resultadosBusqueda");
  const infoSocio = document.getElementById("infoSocio");
  const infoMembresia = document.getElementById("infoMembresia");

  let socioSeleccionado = null;
  let asistenciasDisponibles = null;

  /* ===== Navegación ===== */
  btnHome.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  /* ===== Eventos ===== */
  btnRegistrar.addEventListener("click", registrar);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") registrar();
  });

  input.addEventListener("input", () =>
    buscarSocios(input, resultadosBusqueda)
  );

  /* ===== Buscar socios ===== */
  async function buscarSocios(input, contenedor) {
    const valor = input.value.trim();
    contenedor.innerHTML = "";
    socioSeleccionado = null;

    if (!valor) return;

    try {
      const res = await authFetch(
        `${API_SOCIOS}/search?q=${encodeURIComponent(valor)}`
      );
      const data = await res.json();

      data.forEach(socio => {
        const div = document.createElement("div");
        div.textContent = `${socio.nombre} - ${socio.dni}`;

        div.addEventListener("click", async () => {
          socioSeleccionado = socio;
          input.value = div.textContent;
          contenedor.innerHTML = "";

          await mostrarInfoSocio(socio);
          await mostrarInfoMembresia(socio);
        });

        contenedor.appendChild(div);
      });
    } catch (err) {
      console.error("Error buscando socios", err);
    }
  }

  /* ===== Registrar asistencia ===== */
  async function registrar() {
    limpiarResultado();

    if (!socioSeleccionado) {
      mostrarResultado("Seleccione un socio primero", "warn");
      return;
    }

    if (asistenciasDisponibles !== null && asistenciasDisponibles <= 0) {
      mostrarResultado("No quedan asistencias disponibles", "warn");
      return;
    }

    try {
      const res = await authFetch(
        `${API_SOCIOS}/${socioSeleccionado.dni}/asistencias`,
        { method: "POST" }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw msg || "Error al registrar asistencia";
      }

      const data = await res.json();
      const fecha = new Date(data.fechaHora).toLocaleDateString("es-AR");

      mostrarResultado(`✔ Asistencia registrada (${fecha})`, "ok");

      await mostrarInfoSocio(socioSeleccionado);
      await mostrarInfoMembresia(socioSeleccionado);

      input.value = "";
      socioSeleccionado = null;
      resultadosBusqueda.innerHTML = "";

    } catch (err) {
      mostrarResultado(err, "warn");
    }
  }

  /* ===== Info socio ===== */
  async function mostrarInfoSocio(socio) {
    infoSocio.textContent = "Cargando información...";

    try {
      const res = await authFetch(
        `${API_SOCIOS}/${socio.dni}/asistencias-disponibles`
      );
      const disponibles = await res.json();

      asistenciasDisponibles = disponibles;

      infoSocio.innerHTML = `
        <strong>${socio.nombre}</strong><br>
        DNI: ${socio.dni}<br>
        Asistencias disponibles: <strong>${disponibles}</strong>
      `;
    } catch {
      infoSocio.textContent = "Error al cargar datos del socio";
    }
  }

  /* ===== Info membresía ===== */
  async function mostrarInfoMembresia(socio) {
    infoMembresia.textContent = "Cargando información...";

    try {
      const res = await authFetch(
        `${API_SOCIOS}/${socio.dni}/membresia-vigente`
      );

      if (!res.ok) {
        const msg = await res.text();
        throw msg;
      }

      const membresia = await res.json();

      infoMembresia.innerHTML = `
        <strong>Membresía activa</strong><br>
        Tipo: ${membresia.tipo}<br>
        Vence: ${new Date(membresia.vencimiento)
          .toLocaleDateString("es-AR")}
      `;
    } catch (err) {
      infoMembresia.textContent =
        err || "No se pudo obtener la membresía";
    }
  }

  /* ===== Helpers ===== */
  function limpiarResultado() {
    resultado.textContent = "";
    resultado.className = "resultado";
  }

  function mostrarResultado(texto, tipo) {
    resultado.textContent = texto;
    resultado.classList.add(tipo);
  }
});

