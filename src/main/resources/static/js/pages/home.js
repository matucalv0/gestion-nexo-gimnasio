import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

const API_SOCIOS = "/socios";

document.addEventListener("DOMContentLoaded", () => {
  const go = page => window.location.href = page;

  const btnLogout = document.getElementById("btnLogout");

  // ===== ATAJOS RÁPIDOS =====
  const btnQuickAsistencia = document.getElementById("quickAsistencia");
  const btnQuickSocio = document.getElementById("quickSocio");
  const btnQuickPago = document.getElementById("quickPago");

  if (btnQuickAsistencia) {
    btnQuickAsistencia.addEventListener("click", () => {
      window.location.href = "asistencia.html";
    });
  }

  if (btnQuickSocio) {
    btnQuickSocio.addEventListener("click", () => {
      window.location.href = "registrar-socio.html";
    });
  }

  if (btnQuickPago) {
    btnQuickPago.addEventListener("click", () => {
      window.location.href = "registrar-pago.html";
    });
  }

  // ===== NAVEGACIÓN =====
  document.getElementById("btnLogout").addEventListener("click", logout);

  document.getElementById("btnSocios").onclick = () => go("socios.html");
  document.getElementById("btnAsistencias").onclick = () => go("asistencias.html");
  document.getElementById("btnPagos").onclick = () => go("pagos.html");
  document.getElementById("btnMembresias").onclick = () => go("membresias.html");
  document.getElementById("btnProductos").onclick = () => go("productos.html");
  document.getElementById("btnFinanzas").onclick = () => go("finanzas.html");

  // Accesos rápidos
  document.getElementById("quickAsistencia").onclick = () => go("asistencia.html");
  document.getElementById("quickSocio").onclick = () => go("registrar-socio.html");
  document.getElementById("quickPago").onclick = () => go("registrar-pago.html");

  // Cargar socios inactivos
  cargarSociosInactivos();
});

async function cargarSociosInactivos() {
  try {
    const res = await authFetch("/socios/inactivos?dias=7");
    const inactivos = await res.json();

    const seccion = document.getElementById("seccionSociosInactivos");
    const lista = document.getElementById("listaInactivos");
    const cantidad = document.getElementById("cantidadInactivos");

    if (!inactivos || inactivos.length === 0) {
      seccion.classList.add("hidden");
      return;
    }

    seccion.classList.remove("hidden");
    cantidad.textContent = inactivos.length;
    lista.innerHTML = "";

    inactivos.forEach(s => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center text-gray-300";

      const diasTexto = s.diasSinAsistir >= 999
        ? "Nunca asistió"
        : `${s.diasSinAsistir}d`;

      li.innerHTML = `
        <span>${s.nombre}</span>
        <span class="text-yellow-400 text-xs">${diasTexto}</span>
      `;

      lista.appendChild(li);
    });

  } catch (err) {
    console.error("Error cargando socios inactivos", err);
  }
}
