import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

const API = "/finanzas";

checkAuth();

// ==========================
// STATE
// ==========================

let chartEvolucion = null;
let chartDonut = null;
let movimientosData = [];

// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  initEventos();
  cargarKPIs();
  cargarMovimientos();
  cargarDistribucionMensual();
  cargarEvolucion("7dias");
});

// ==========================
// EVENTOS
// ==========================

function initEventos() {
  document
    .getElementById("filtroEvolucion")
    ?.addEventListener("change", (e) => {
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
    const res = await authFetch("/finanzas");
    const data = await res.json();

    movimientosData = data;
    renderMovimientos(data);
  } catch (e) {
    console.error("Error cargando movimientos", e);
  }
}

async function cargarDistribucionMensual() {
  try {
    const res = await authFetch(`${API}/distribucion-mensual`);
    const data = await res.json();

    console.log(data);

    if (!data) return;

    renderDonut(data.ingresos || 0, data.gastos || 0);
  } catch (e) {
    console.error("Error cargando distribución mensual", e);
  }
}

// ==========================
// EVOLUCIÓN (GRÁFICO)
// ==========================

function renderMovimientos(movimientos) {
  const tbody = document.getElementById("tablaMovimientos");
  tbody.innerHTML = "";

  if (!movimientos.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-400">
          No hay movimientos registrados
        </td>
      </tr>`;
    return;
  }

  movimientos.forEach((m, index) => {
    // ---------- FILA PRINCIPAL ----------
    const tr = document.createElement("tr");
    tr.className = `
      border-b border-[var(--input-border)]
      hover:bg-[#1a1a1a] transition
    `;

    const badgeColor =
      m.tipoMovimiento === "INGRESO" ? "text-green-400" : "text-red-400";

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
        <button
        class="text-[var(--orange)] font-semibold hover:underline"
        data-id="${m.id}"
        data-tipo="${m.tipoMovimiento}">
        Ver detalle
        </button>


      </td>
    `;

    tbody.appendChild(tr);

    // ---------- FILA DETALLE ----------
    const trDetalle = document.createElement("tr");
    trDetalle.id = `detalle-${m.id}`;
    trDetalle.className = "hidden";

    trDetalle.innerHTML = `
  <td colspan="4" class="px-6 py-4 bg-[#0f0f0f]">
    <div
      id="detalle-content-${m.id}"
      class="bg-[#121212] border border-[var(--input-border)]
             rounded-xl p-5 shadow-inner text-sm text-gray-400">
      Cargando detalle...
    </div>
  </td>
`;

    tbody.appendChild(trDetalle);
  });

  // ---------- TOGGLE ----------
  tbody.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .getElementById(`detalle-${btn.dataset.index}`)
        .classList.toggle("hidden");
    });
  });
}

function renderDetalleMovimiento(m) {
  if (m.tipoMovimiento === "INGRESO") {
    return renderDetalleIngreso(m);
  }

  return renderDetalleGasto(m);
}

function renderDetalleIngreso(m) {
  console.log(m);
  if (!m.detalles || !m.detalles.length) {
    return `<p class="text-sm text-gray-400">Sin detalle.</p>`;
  }

  return `
    <div class="space-y-3">
      ${m.detalles
      .map(
        (d) => `
        <div class="
          bg-[#181818]
          border border-[var(--input-border)]
          rounded-lg
          p-3
          flex justify-between
        ">
          <div>
            <p class="text-xs text-gray-400">${d.tipo}</p>
            <p class="font-medium">${d.nombre}</p>
            <p class="text-xs text-gray-400">Cantidad: ${d.cantidad}</p>
          </div>

          <div class="text-right">
            <p class="text-sm text-gray-400">Unitario</p>
            <p class="font-semibold">$ ${d.precioUnitario}</p>
          </div>
        </div>
      `,
      )
      .join("")}
    </div>
  `;
}

function renderDetalleGasto(m) {
  return `
    <div class="text-sm space-y-2">
      <p>
        <span class="text-gray-400">Tipo:</span><br>
        ${m.categoria?.trim() || "Sin categoria"}
      </p>

      <p>
        <span class="text-gray-400">Descripción:</span><br>
        ${m.proveedor?.trim() || "Sin descripción"}
      </p>
    </div>
  `;
}

async function cargarEvolucion(filtro) {
  try {
    const endpoint =
      filtro === "7dias" ? `${API}/balance-semanal` : `${API}/balance-mensual`;

    const res = await authFetch(endpoint);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    renderChart({
      labels: mapLabels(data, filtro),
      ingresos: data.map((d) => Number(d.ingresos) || 0),
      egresos: data.map((d) => Number(d.egresos) || 0),
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
        createDataset("Gastos", egresos, "#ef4444", "rgba(239,68,68,0.08)"),
      ],
    },
    options: chartOptions(),
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
    pointHoverRadius: 0,
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
          pointStyle: "line",
        },
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
          label: (ctx) =>
            `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },

    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#9ca3af",
          callback: (v) => `$${v.toLocaleString()}`,
        },
        grid: { color: "#1f2937" },
      },
    },
  };
}

function renderDonut(ingresos, gastos) {
  if (chartDonut) chartDonut.destroy();

  const ctx = document.getElementById("donutIngresos").getContext("2d");

  chartDonut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [
        {
          data: [ingresos, gastos],
          backgroundColor: ["#22c55e", "#ef4444"],
          hoverBackgroundColor: ["#34d399", "#f87171"],
          borderColor: "#111",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ECD9BA",
            padding: 16,
            boxWidth: 12,
          },
        },
        tooltip: {
          backgroundColor: "rgba(20,20,20,0.95)",
          titleColor: "#ECD9BA",
          bodyColor: "#ECD9BA",
          borderColor: "rgba(255,255,255,0.15)",
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => {
              const total = ingresos + gastos;
              const value = ctx.raw;
              const pct = total ? ((value / total) * 100).toFixed(1) : 0;
              return `$ ${value.toLocaleString()} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ==========================
// UTILS
// ==========================

function mapLabels(data, filtro) {
  return filtro === "7dias"
    ? data.map((d) => d.fecha, {
      day: "2-digit",
      month: "2-digit",
    })
    : data.map((d) => `${String(d.mes).padStart(2, "0")}/${d.anio}`);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR");
}
