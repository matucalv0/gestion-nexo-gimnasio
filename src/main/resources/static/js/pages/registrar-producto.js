import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/productos";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarProductoForm");
  const btnHome = document.getElementById("btnVolver");
  const btnLogout = document.getElementById("btnLogout");

  /* ===== Navegación ===== */
  btnHome?.addEventListener("click", () => history.back());
  btnLogout?.addEventListener("click", logout);

  /* ===== Submit ===== */
  form.addEventListener("submit", registrarProducto);

  async function registrarProducto(e) {
    e.preventDefault();

    limpiarErrores();

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

      Alerta.success("Producto registrado correctamente");

      form.reset();

    } catch {
      Alerta.error("No se pudo conectar con el servidor");
    }
  }

  /* ===== Helpers ===== */
  function obtenerDatosFormulario() {
    return {
      nombre: form.nombre.value.trim(),
      precioSugerido: Number(form.precio.value),
      stock: Number(form.stock.value)
    };
  }

  async function manejarErrores(res, body) {
    if (res.status === 400 && typeof body === "object" && body.errors) {
      mostrarErroresPorCampo(body.errors);
      return;
    }

    const mensaje = body.message || "Error al registrar producto";
    if (res.status >= 500) Alerta.error(mensaje);
    else Alerta.warning(mensaje);
  }

  function limpiarErrores() {
    form.querySelectorAll(".error").forEach(span => span.textContent = "");
  }

  function mostrarErroresPorCampo(errors) {
    Object.entries(errors).forEach(([campo, mensaje]) => {
      const input = form.querySelector(`[name="${campo}"]`);
      if (!input) return;
      const span = input.nextElementSibling;
      if (span && span.classList.contains("error")) {
        span.textContent = mensaje;
      }
    });
  }
});
