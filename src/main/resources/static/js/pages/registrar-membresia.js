import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrarMembresiaForm");

  document
    .getElementById("btnVolver")
    .addEventListener("click", () => (window.location.href = "membresias.html"));

  document
    .getElementById("btnLogout")
    .addEventListener("click", logout);

  form.addEventListener("submit", registrarMembresia);

  async function registrarMembresia(e) {
    e.preventDefault();

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

      Alerta.success("Plan registrado correctamente");
      form.reset();

    } catch (err) {
      Alerta.error(err.message || "No se pudo registrar la membresía");
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
});


