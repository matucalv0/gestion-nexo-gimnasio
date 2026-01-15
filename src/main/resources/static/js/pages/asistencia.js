import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_SOCIOS = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputBusqueda");
  const btnRegistrar = document.getElementById("btnRegistrar");
  const btnHome = document.getElementById("btnHome");
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

  input.addEventListener("input", () => {
    buscarSocios(input.value);
  });

  /* ===== Buscar socios ===== */
  async function buscarSocios(valor) {
    resultadosBusqueda.innerHTML = "";
    socioSeleccionado = null;

    if (!valor.trim()) return;

    try {
      const res = await authFetch(
        `${API_SOCIOS}/search?q=${encodeURIComponent(valor.trim())}`
      );
      const socios = await res.json();

      socios.forEach(socio => {
        const item = document.createElement("div");
        item.className =
          "px-4 py-2 cursor-pointer hover:bg-gray-200 text-gray-800";
        item.textContent = `${socio.nombre} - ${socio.dni}`;

        item.addEventListener("click", async () => {
          socioSeleccionado = socio;
          input.value = item.textContent;
          resultadosBusqueda.innerHTML = "";

          await cargarInfoSocio(socio);
          await cargarInfoMembresia(socio);
        });

        resultadosBusqueda.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      mostrarAlerta({
        mensaje: "Error al buscar socios",
        tipo: "danger"
      });
    }
  }

  /* ===== Registrar asistencia ===== */
  async function registrar() {
    limpiarAlertas();

    if (!socioSeleccionado) {
      mostrarAlerta({
        mensaje: "Seleccione un socio primero",
        tipo: "warning"
      });
      return;
    }

    if (asistenciasDisponibles !== null && asistenciasDisponibles <= 0) {
      mostrarAlerta({
        mensaje: "No quedan asistencias disponibles",
        tipo: "warning"
      });
      return;
    }

    try {
      const res = await authFetch(
        `${API_SOCIOS}/${socioSeleccionado.dni}/asistencias`,
        { method: "POST" }
      );

      if (!res.ok) {
        let mensaje = "Error al registrar asistencia";
        try {
          const body = await res.json();
          mensaje = body.message || mensaje;
        } catch {}
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
    const res = await authFetch(
      `${API_SOCIOS}/${socio.dni}/asistencias-disponibles`
    );

    if (!res.ok) throw new Error();

    const data = await res.json();

    infoSocio.innerHTML = `
      <strong>${socio.nombre}</strong><br>
      DNI: ${socio.dni}<br>
      Asistencias disponibles: <strong>${data.disponibles}</strong>
    `;
  } catch {
    infoSocio.textContent = "El socio no tiene asistencias disponibles";
  }
}



  /* ===== Info membresía ===== */
  async function cargarInfoMembresia(socio) {
    infoMembresia.classList.remove("hidden");
    infoMembresia.textContent = "Cargando información...";

    try {
      const res = await authFetch(
        `${API_SOCIOS}/${socio.dni}/membresia-vigente`
      );

      if (!res.ok) throw new Error();

      const membresia = await res.json();

      infoMembresia.innerHTML = `
        <strong>Plan activo</strong><br>
        Tipo: ${membresia.tipo}<br>
        Vence: ${new Date(membresia.vencimiento).toLocaleDateString("es-AR")}
      `;
    } catch {
      infoMembresia.textContent = "El socio no tiene ningun plan activo";
    }
  }

  /* ===== Reset ===== */
  function resetFormulario() {
    input.value = "";
    socioSeleccionado = null;
    resultadosBusqueda.innerHTML = "";
    infoSocio.classList.add("hidden");
    infoMembresia.classList.add("hidden");
  }
});
