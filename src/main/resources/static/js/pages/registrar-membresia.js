import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarMembresiaForm");
  const resultado = document.getElementById("resultado");

  document
    .getElementById("btnVolver")
    .addEventListener("click", () => (window.location.href = "membresias.html"));

  document
    .getElementById("btnLogout")
    .addEventListener("click", logout);

  form.addEventListener("submit", registrarMembresia);

  async function registrarMembresia(e) {
    e.preventDefault();
    limpiarResultado();

    const asistenciasValue = document.getElementById("asistencias").value;

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      duracionDias: Number(document.getElementById("duracion").value),
      asistenciasPorSemana: asistenciasValue
        ? Number(asistenciasValue)
        : null,
      tipoMembresia: document.getElementById("tipo").value,
      precioSugerido: Number(document.getElementById("precio").value)
    };

    try {
      const res = await authFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw await extraerMensajeError(res);
      }

      mostrarResultado("Plan registrado correctamente", "ok");
      form.reset();

    } catch (err) {
      mostrarResultado(
        err.message || "No se pudo registrar la membresía",
        "warn"
      );
    }
  }

  /* ===== Helpers ===== */

  async function extraerMensajeError(res) {
    try {
      const body = await res.json();
      return new Error(body.message || "Error al procesar la solicitud");
    } catch {
      return new Error("Error al procesar la solicitud");
    }
  }

  function limpiarResultado() {
    resultado.className = "hidden";
    resultado.textContent = "";
  }

  function mostrarResultado(texto, tipo) {
    resultado.textContent = texto;
    resultado.className =
      "mb-6 rounded-md px-4 py-3 text-sm font-medium " +
      (tipo === "ok"
        ? "bg-green-100 text-green-800 border border-green-300"
        : "bg-red-100 text-red-800 border border-red-300");
  }
});


