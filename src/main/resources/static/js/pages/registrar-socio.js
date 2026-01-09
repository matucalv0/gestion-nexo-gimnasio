import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarSocioForm");
  const resultado = document.getElementById("resultado");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");

  /* ===== Navegación ===== */
  btnHome.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  btnLogout.addEventListener("click", logout);

  /* ===== Submit ===== */
  form.addEventListener("submit", registrarSocio);

  async function registrarSocio(e) {
    e.preventDefault();
    limpiarResultado();

    const data = {
      nombre: document.getElementById("fullname").value.trim(),
      email: document.getElementById("email").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      dni: document.getElementById("dni").value.trim(),
      fechaNacimiento: document.getElementById("fechaNacimiento").value
    };

    try {
      const res = await authFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw err.message || "Error al registrar socio";
      }

      mostrarResultado("✔ Socio registrado correctamente", "ok");
      form.reset();

    } catch (err) {
      mostrarResultado(err, "warn");
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
