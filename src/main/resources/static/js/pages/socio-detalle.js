import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const btnVolver = document.getElementById("btnVolver");
  const btnEditar = document.getElementById("btnEditar");
  const btnRegistrarPago = document.getElementById("btnRegistrarPago");

  const params = new URLSearchParams(window.location.search);
  const dni = params.get("dni");

  if (!dni) {
    mostrarAlerta({
      mensaje: "Socio inválido",
      tipo: "danger"
    });
    return;
  }

  btnVolver.addEventListener("click", () => {
    window.location.href = "socios.html";
  });

  btnEditar.addEventListener("click", () => {
    window.location.href = `editar-socio.html?dni=${dni}`;
  });

  btnRegistrarPago.addEventListener("click", () => {
    window.location.href = `registrar-pago.html?dni=${dni}&cuota=true`;
  });

  cargarSocio(dni);
  cargarMembresiaVigente(dni);
});

/* ===== SOCIO ===== */
async function cargarSocio(dni) {
  limpiarAlertas();

  try {
    const res = await authFetch(`${API_URL}/${dni}`);
    if (!res.ok) throw new Error();

    const socio = await res.json();

    document.getElementById("nombre").textContent = socio.nombre;
    document.getElementById("dni").textContent = socio.dni;
    document.getElementById("telefono").textContent = socio.telefono ?? "-";
    document.getElementById("email").textContent = socio.email ?? "-";

    const estado = document.getElementById("estado");
    estado.textContent = socio.activo ? "Activo" : "Inactivo";
    estado.className = socio.activo
      ? "font-semibold text-green-400"
      : "font-semibold text-red-400";

  } catch {
    mostrarAlerta({
      mensaje: "Error al cargar los datos del socio",
      tipo: "danger"
    });
  }
}

/* ===== MEMBRESÍA ===== */
async function cargarMembresiaVigente(dni) {
  const container = document.getElementById("membresiaContainer");
  container.innerHTML = "";

  try {
    const res = await authFetch(`${API_URL}/${dni}/membresia-vigente`);

    if (res.status === 204) {
      mostrarAlerta({
        mensaje: "El socio no posee una membresía vigente",
        tipo: "warning"
      });
      return;
    }

    if (!res.ok) {
      let mensaje = "Membresia vencida";

      try {
        const error = await res.json();
        mensaje = error.message || mensaje;
      } catch { }

      return mostrarAlerta({ mensaje, tipo: "danger" }); // ⬅️ RETURN CLAVE
    }

    const m = await res.json();

    container.innerHTML = `
      <div class="bg-[#16232c] rounded-lg p-4">
        <p class="text-xs text-gray-400">Nombre</p>
        <p class="text-lg font-semibold">${m.tipo}</p>
      </div>

      <div class="bg-[#16232c] rounded-lg p-4">
        <p class="text-xs text-gray-400">Tipo</p>
        <p class="text-lg font-semibold">${m.tipoMembresia}</p>
      </div>

      <div class="bg-[#16232c] rounded-lg p-4">
        <p class="text-xs text-gray-400">Estado</p>
        <span class="text-green-400 font-semibold">Vigente</span>
      </div>

      <div class="bg-[#16232c] rounded-lg p-4">
        <p class="text-xs text-gray-400">Vencimiento</p>
        <p class="text-lg font-semibold">${m.vencimiento}</p>
      </div>
    `;
  } catch {
    mostrarAlerta({
      mensaje: "Error al cargar la membresía",
      tipo: "danger"
    });
  }
}

