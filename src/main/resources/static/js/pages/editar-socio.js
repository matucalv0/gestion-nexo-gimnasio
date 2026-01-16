import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("editarSocioForm");
  const btnVolver = document.getElementById("btnVolver");

  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "socios.html";
    });
  }

  const params = new URLSearchParams(window.location.search);
  const dni = params.get("dni");

  if (!dni) {
    mostrarAlerta({ mensaje: "Socio inválido", tipo: "danger" });
    return;
  }

  await cargarSocio(dni, form);

  form.addEventListener("submit", (e) => editarSocio(e, dni, form));
});

/* ===== cargar ===== */
async function cargarSocio(dni, form) {
  try {
    const res = await authFetch(`${API_URL}/${dni}`);
    const socio = await res.json();

    form.nombre.value = socio.nombre ?? "";
    form.telefono.value = socio.telefono ?? "";
    form.email.value = socio.email ?? "";

  } catch {
    mostrarAlerta({ mensaje: "Error al cargar socio", tipo: "danger" });
  }
}

/* ===== patch ===== */
async function editarSocio(e, dni, form) {
  e.preventDefault();
  limpiarAlertas();
  limpiarErrores();

  const data = {
    nombre: form.nombre.value.trim(),
    telefono: form.telefono.value.trim(),
    email: form.email.value.trim()
  };

  try {
    const res = await authFetch(`${API_URL}/${dni}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    const body = await res.json();

    if (!res.ok) {
      manejarErrores(res, body, form);
      return;
    }

    mostrarAlerta({ mensaje: "Socio actualizado correctamente", tipo: "success" });

  } catch {
    mostrarAlerta({ mensaje: "No se pudo conectar con el servidor", tipo: "danger" });
  }
}

/* ===== helpers ===== */
function limpiarErrores() {
  document.querySelectorAll(".error").forEach(e => e.textContent = "");
}

function manejarErrores(res, body, form) {
  if (res.status === 400 && body?.errors) {
    Object.entries(body.errors).forEach(([campo, mensaje]) => {
      const input = form.querySelector(`[name="${campo}"]`);
      if (!input) return;
      input.nextElementSibling.textContent = mensaje;
    });
    return;
  }

  mostrarAlerta({
    mensaje: body.message || "Error al editar socio",
    tipo: res.status >= 500 ? "danger" : "warning"
  });
}

