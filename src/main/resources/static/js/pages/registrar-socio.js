import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarSocioForm");
  const btnHome = document.getElementById("btnVolver");
  const btnLogout = document.getElementById("btnLogout");

  /* ===== Navegación ===== */
  btnHome.addEventListener("click", () => window.location.href = "socios.html");
  btnLogout.addEventListener("click", logout);

  /* ===== Submit ===== */
  form.addEventListener("submit", registrarSocio);

  async function registrarSocio(e) {
    e.preventDefault();

    limpiarErrores();
    limpiarAlertas();

    const data = obtenerDatosFormulario();

    try {
      const res = await authFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
      });

      const body = await res.json();

      if (!res.ok) {
        await manejarErrores(res, body);
        return;
      }

      mostrarAlerta({ mensaje: "Socio registrado correctamente", tipo: "success" });

      form.reset();

    } catch {
      mostrarAlerta({ mensaje: "No se pudo conectar con el servidor", tipo: "danger" });
    }
  }

  /* ===== Helpers ===== */
  function obtenerDatosFormulario() {
    return {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      dni: form.dni.value.trim(),
      fechaNacimiento: form.fechaNacimiento.value
    };
  }

  async function manejarErrores(res, body) {
    if (res.status === 400 && typeof body === "object" && body.errors) {
      mostrarErroresPorCampo(body.errors);
      return;
    }

    mostrarAlerta({
      mensaje: body.message || "Error al registrar socio",
      tipo: res.status >= 500 ? "danger" : "warning"
    });
  }

  function limpiarErrores() {
    form.querySelectorAll(".error").forEach(span => span.textContent = "");
  }

  function mostrarErroresPorCampo(errors) {
    Object.entries(errors).forEach(([campo, mensaje]) => {
      const input = form.querySelector(`[name="${campo}"]`);
      if (!input) return;
      const span = input.nextElementSibling;
      if (span && span.classList.contains("error")) span.textContent = mensaje;
    });
  }
});