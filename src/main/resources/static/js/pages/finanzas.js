import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

const API = "/finanzas";

checkAuth();

// ==========================
// STATE
// ==========================

let chartEvolucion = null;

// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  initEventos();
  cargarKPIs();
  cargarMovimientos();
  cargarEvolucion("7dias");
});

// ==========================
// EVENTOS
// ==========================

function initEventos() {
  document
    .getElementById("filtroEvolucion")
    ?.addEventListener("change", e => {
      cargarEvolucion(e.target.value);
    });

  document.getElementById("btnHome")?.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  document.getElementById("btnNuevoGasto")?.addEventListener("click", () => {
    window.location.href = "registrar-gasto.html";
  });
}

// ==========================
// KPIs
// ==========================

async function cargarKPIs() {
  try {
    setValor("kpiGananciaHoy", await fetchValor(`${API}/ganancias-hoy`));
    setValor("kpiGananciaSemana", await fetchValor(`${API}/ganancias-semana`));
    setValor("kpiGananciaMes", await fetchValor(`${API}/ganancias-mes`));
  } catch (e) {
    console.error("Error cargando KPIs", e);
  }
}

async function fetchValor(endpoint) {
  const res = await authFetch(endpoint);
  return res.json();
}

function setValor(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = `$${(Number(valor) || 0).toLocaleString()}`;
}

// ==========================
// MOVIMIENTOS
// ==========================

async function cargarMovimientos() {
  try {
    const res = await authFetch(API);
    const movimientos = await res.json();

    if (!Array.isArray(movimientos)) return;

    const tbody = document.getElementById("tablaMovimientos");
    tbody.innerHTML = "";

    movimientos.forEach((m, index) => {
      const tr = document.createElement("tr");

      const badgeColor =
        m.tipoMovimiento === "INGRESO" ? "text-green-400" : "text-red-400";

      tr.className = "border-b border-[var(--input-border)] hover:bg-[#1a1a1a]";

      tr.innerHTML = `
        <td class="px-6 py-4">${formatearFecha(m.fecha)}</td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 text-xs rounded-full border ${badgeColor}">
            ${m.tipoMovimiento}
          </span>
        </td>
        <td class="px-6 py-4 font-semibold text-[var(--beige)]">
          $ ${Number(m.monto).toLocaleString()}
        </td>
        <td class="px-6 py-4">
          <button class="text-[var(--orange)] hover:underline" data-index="${index}">
            Ver detalle
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error cargando movimientos", e);
  }
}

// ==========================
// EVOLUCIÓN (GRÁFICO)
// ==========================

async function cargarEvolucion(filtro) {
  try {
    const endpoint =
      filtro === "7dias"
        ? `${API}/balance-semanal`
        : `${API}/balance-mensual`;

    const res = await authFetch(endpoint);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    renderChart({
      labels: mapLabels(data, filtro),
      ingresos: data.map(d => Number(d.ingresos) || 0),
      egresos: data.map(d => Number(d.egresos) || 0)
    });
  } catch (e) {
    console.error("Error cargando evolución", e);
  }
}

// ==========================
// CHART
// ==========================

function renderChart({ labels, ingresos, egresos }) {
  if (chartEvolucion) chartEvolucion.destroy();

  const ctx = document.getElementById("chartEvolucion");

  chartEvolucion = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        createDataset("Ingresos", ingresos, "#22c55e", "rgba(34,197,94,0.08)"),
        createDataset("Gastos", egresos, "#ef4444", "rgba(239,68,68,0.08)")
      ]
    },
    options: chartOptions()
  });
}

function createDataset(label, data, color, bgColor) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: bgColor,
    fill: true,
    tension: 0.35,
    pointRadius: 0,
    pointHoverRadius: 0
  };
}

function chartOptions() {
  return {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 400, easing: "easeOutQuart" },

    plugins: {
      legend: {
        labels: {
          color: "#9ca3af",
          usePointStyle: true,
          pointStyle: "line"
        }
      },
      tooltip: {
        backgroundColor: "#020617",
        borderColor: "#334155",
        borderWidth: 1,
        displayColors: false,
        titleColor: "#e5e7eb",
        bodyColor: "#e5e7eb",
        padding: 10,
        callbacks: {
          label: ctx =>
            `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
        }
      }
    },

    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: "#9ca3af",
          callback: v => `$${v.toLocaleString()}`
        },
        grid: { color: "#1f2937" }
      }
    }
  };
}

// ==========================
// UTILS
// ==========================

function mapLabels(data, filtro) {
  return filtro === "7dias"
    ? data.map(d =>
        d.fecha, {
          day: "2-digit",
          month: "2-digit"
        })
    : data.map(d => `${String(d.mes).padStart(2, "0")}/${d.anio}`);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR");
}


