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

  document.getElementById("btnSocios")?.addEventListener("click", () => go("socios.html"));
  document.getElementById("btnAsistencias")?.addEventListener("click", () => go("asistencias.html"));
  document.getElementById("btnPagos")?.addEventListener("click", () => go("pagos.html"));
  document.getElementById("btnMembresias")?.addEventListener("click", () => go("membresias.html"));
  document.getElementById("btnProductos")?.addEventListener("click", () => go("productos.html"));
  document.getElementById("btnFinanzas")?.addEventListener("click", () => go("finanzas.html"));

  // Accesos rápidos
  document.getElementById("quickAsistencia")?.addEventListener("click", () => go("asistencia.html"));
  document.getElementById("quickSocio")?.addEventListener("click", () => go("registrar-socio.html"));
  document.getElementById("quickPago")?.addEventListener("click", () => go("registrar-pago.html"));

  // ===== ATAJOS DE TECLADO GLOBALES =====
  document.addEventListener("keydown", (e) => {
    // Solo si no estamos escribiendo en un input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch(e.key) {
      case "F2":
        e.preventDefault();
        go("asistencia.html");
        break;
      case "F3":
        e.preventDefault();
        go("registrar-pago.html");
        break;
      case "F4":
        e.preventDefault();
        go("socios.html?focus=true");
        break;
    }
  });

  // ===== MODAL POR VENCER =====
  const modalPorVencer = document.getElementById("modalPorVencer");
  const kpiPorVencerCard = document.getElementById("kpiPorVencerCard");
  const cerrarModalPorVencer = document.getElementById("cerrarModalPorVencer");

  kpiPorVencerCard?.addEventListener("click", () => {
    modalPorVencer?.classList.remove("hidden");
  });

  cerrarModalPorVencer?.addEventListener("click", () => {
    modalPorVencer?.classList.add("hidden");
  });

  modalPorVencer?.addEventListener("click", (e) => {
    if (e.target === modalPorVencer) {
      modalPorVencer.classList.add("hidden");
    }
  });

  // ESC para cerrar modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalPorVencer?.classList.contains("hidden")) {
      modalPorVencer.classList.add("hidden");
    }
  });

  // Cargar datos
  cargarDashboard();
  cargarSociosInactivos();
});

async function cargarDashboard() {
  try {
    const res = await authFetch("/dashboard");
    if (!res.ok) throw new Error("Error cargando dashboard");

    const data = await res.json();

    // Actualizar KPIs
    document.getElementById("kpiRecaudacionHoy").textContent =
      formatMoney(data.recaudacionHoy);
    document.getElementById("kpiSociosActivos").textContent =
      data.sociosActivos || 0;
    document.getElementById("kpiPorVencer").textContent =
      data.sociosPorVencer || 0;
    document.getElementById("kpiAsistenciasHoy").textContent =
      data.asistenciasHoy || 0;

    // Llenar lista de socios por vencer
    const listaPorVencer = document.getElementById("listaPorVencer");
    if (listaPorVencer && data.listaPorVencer) {
      if (data.listaPorVencer.length === 0) {
        listaPorVencer.innerHTML = `
          <p class="text-gray-400 text-center py-4">
            No hay membresías por vencer en los próximos 7 días
          </p>
        `;
      } else {
        listaPorVencer.innerHTML = data.listaPorVencer.map(s => `
          <div class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-700 hover:border-[var(--orange)] transition cursor-pointer"
               onclick="window.location.href='socio-detalle.html?dni=${s.dni}'">
            <div>
              <p class="font-semibold text-[var(--beige)]">${s.nombre}</p>
              <p class="text-xs text-gray-400">${s.nombreMembresia}</p>
            </div>
            <div class="text-right">
              <p class="font-bold ${s.diasRestantes <= 2 ? 'text-red-400' : 'text-yellow-400'}">
                ${s.diasRestantes === 0 ? 'Hoy' : s.diasRestantes === 1 ? 'Mañana' : `${s.diasRestantes} días`}
              </p>
              <p class="text-xs text-gray-500">${formatDate(s.fechaVencimiento)}</p>
            </div>
          </div>
        `).join('');
      }
    }

  } catch (err) {
    console.error("Error cargando dashboard", err);
  }
}

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

function formatMoney(amount) {
  if (amount == null) return "$0";
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";

  // Parsear fecha correctamente para evitar problemas de timezone
  let date;
  const str = String(dateStr);

  // Si es solo fecha (YYYY-MM-DD), parsear como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

