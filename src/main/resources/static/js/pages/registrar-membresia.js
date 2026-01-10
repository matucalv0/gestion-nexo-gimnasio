import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarMembresiaForm");
  const resultado = document.getElementById("resultado");

  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");

  /* ===== Navegación ===== */
  btnHome.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  btnLogout.addEventListener("click", logout);

  /* ===== Submit ===== */
  form.addEventListener("submit", registrarMembresia);

  async function registrarMembresia(e) {
    e.preventDefault();
    limpiarResultado();

    const asistenciasInput = document.getElementById("asistencias").value;

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      duracionDias: Number(document.getElementById("duracion").value),
      asistenciasPorSemana: asistenciasInput ? Number(asistenciasInput) : null,
      precioSugerido: Number(document.getElementById("precio").value),
    };

    try {
      const res = await authFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw err.message || "Error al registrar membresía";
      }

      mostrarResultado("✔ Membresía registrada correctamente", "ok");
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
