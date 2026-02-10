import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";

const API = "/finanzas";

checkAuth();

// ==========================
// STATE
// ==========================

let chartEvolucion = null;
let chartDonut = null;
let movimientosData = [];
let currentPage = 0;
const pageSize = 20;

// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  initEventos();
  cargarKPIs();

  // Init params
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  if (document.getElementById("filtroHasta"))
    document.getElementById("filtroHasta").value = hoy.toISOString().split("T")[0];
  if (document.getElementById("filtroDesde"))
    document.getElementById("filtroDesde").value = hace30dias.toISOString().split("T")[0];

  cargarMovimientosPaginados();
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

  document.getElementById("btnFiltrarFecha")?.addEventListener("click", () => {
    currentPage = 0;
    cargarMovimientosPaginados();
  });

  document.getElementById("btnLimpiarFiltros")?.addEventListener("click", () => {
    if (document.getElementById("filtroDesde")) document.getElementById("filtroDesde").value = "";
    if (document.getElementById("filtroHasta")) document.getElementById("filtroHasta").value = "";
    currentPage = 0;
    cargarMovimientosPaginados();
  });
}

// ==========================
// KPIs
// ==========================

async function cargarKPIs() {
  try {
    const [resHoy, resSemana, resMes] = await Promise.all([
      authFetch(`${API}/ganancias-hoy`),
      authFetch(`${API}/ganancias-semana`),
      authFetch(`${API}/estadisticas/mes-completo`)
    ]);

    const hoy = await resHoy.json();
    const semana = await resSemana.json();
    const statsMes = await resMes.json();

    setValor("kpiGananciaHoy", hoy);
    setValor("kpiGananciaSemana", semana);

    // Ganancia Mes + Variación
    setValor("kpiGananciaMes", statsMes.gananciaMes);
    renderVariacion("varGananciaMes", statsMes.variacionMensual);

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
  el.innerText = `$${(Number(valor) || 0).toLocaleString("es-AR")}`;
}

function renderVariacion(elementId, variacion) {
  const el = document.getElementById(elementId);
  if (!el || variacion == null) return;

  const esPositivo = variacion >= 0;
  const color = esPositivo ? "text-green-500" : "text-red-500";
  const icono = esPositivo ? "▲" : "▼";

  el.className = `text-xs font-bold ${color} ml-2`;
  el.innerHTML = `${icono} ${Math.abs(variacion).toFixed(1)}%`;
}

// ==========================
// MOVIMIENTOS
// ==========================

async function cargarMovimientosPaginados() {
  try {
    const desde = document.getElementById("filtroDesde")?.value;
    const hasta = document.getElementById("filtroHasta")?.value;

    let url = `${API}?page=${currentPage}&size=${pageSize}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;

    const res = await authFetch(url);
    const pageData = await res.json();

    movimientosData = pageData.content;
    renderMovimientos(pageData.content);

    renderPagination(
      document.getElementById("paginationContainer"),
      pageData.page,
      pageData.totalPages,
      (newPage) => {
        currentPage = newPage;
        cargarMovimientosPaginados();
      }
    );

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
  const emptyState = document.getElementById('emptyStateFinanzas');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tbody.querySelectorAll('tr:not(#emptyStateFinanzas)');
  rows.forEach(row => row.remove());

  if (!movimientos.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

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

      <td class="px-6 py-4 flex gap-3">
        <button
        class="text-[var(--orange)] font-semibold hover:underline"
        data-id="${m.idReferencia}"
        data-tipo="${m.tipoMovimiento}">
        Ver detalle
        </button>
        <button
        class="text-red-500 font-semibold hover:underline btn-eliminar"
        data-id="${m.idReferencia}"
        data-tipo="${m.tipoMovimiento}">
        Eliminar
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    // ---------- FILA DETALLE ----------
    const trDetalle = document.createElement("tr");
    trDetalle.id = `detalle-${m.idReferencia}-${m.tipoMovimiento}`;
    trDetalle.className = "hidden";

    trDetalle.innerHTML = `
  <td colspan="4" class="px-6 py-4 bg-[#0f0f0f]">
    <div
      id="detalle-content-${m.idReferencia}-${m.tipoMovimiento}"
      class="bg-[#121212] border border-[var(--input-border)]
             rounded-xl p-5 shadow-inner text-sm text-gray-400">
      Cargando detalle...
    </div>
  </td>
`;

    tbody.appendChild(trDetalle);
  });

  // ---------- VER DETALLE ----------
  tbody.querySelectorAll("button[data-id]:not(.btn-eliminar)").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const tipo = btn.dataset.tipo;
      const row = document.getElementById(`detalle-${id}-${tipo}`);
      const contentDiv = document.getElementById(`detalle-content-${id}-${tipo}`);

      row.classList.toggle("hidden");

      // Si se está mostrando, cargar los detalles
      if (!row.classList.contains("hidden")) {
        if (tipo === "INGRESO") {
          await cargarDetallesPago(id, contentDiv);
        } else {
          // Para gastos, buscar el movimiento en movimientosData
          // Nota: movimientosData ahora es current page content
          const movimiento = movimientosData.find(m =>
            m.idReferencia === parseInt(id) && m.tipoMovimiento === "EGRESO"
          );
          if (movimiento) {
            contentDiv.innerHTML = renderDetalleGasto(movimiento);
          }
        }
      }
    });
  });

  // ---------- ELIMINAR ----------
  tbody.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const tipo = btn.dataset.tipo;

      Alerta.confirm({
        titulo: `¿Eliminar ${tipo === "INGRESO" ? "pago" : "gasto"}?`,
        mensaje: `¿Seguro que deseas eliminar este ${tipo === "INGRESO" ? "pago" : "gasto"}?`,
        textoConfirmar: "Eliminar",
        onConfirm: async () => {
          await eliminarMovimiento(id, tipo);
        }
      });
    });
  });
}



async function eliminarMovimiento(id, tipo) {
  try {
    let endpoint;

    if (tipo === "INGRESO") {
      // Ahora usamos DELETE físico para pagos
      endpoint = `/pagos/${id}`;
    } else {
      endpoint = `/gastos/${id}`;
    }

    const res = await authFetch(endpoint, { method: "DELETE" });

    if (!res.ok) {
      throw new Error("Error al eliminar movimiento");
    }

    // Mostrar alerta de éxito
    Alerta.success(`${tipo === "INGRESO" ? "Pago" : "Gasto"} eliminado correctamente`);

    // Recargar datos
    await cargarMovimientosPaginados();
    await cargarKPIs();
    await cargarDistribucionMensual();

  } catch (e) {
    console.error("Error eliminando movimiento", e);
    Alerta.error("No se pudo eliminar el movimiento");
  }
}

async function cargarDetallesPago(id, contentDiv) {
  try {
    contentDiv.innerHTML = "Cargando detalles...";
    const res = await authFetch(`/pagos/${id}`);

    if (!res.ok) {
      throw new Error("Error al cargar detalles");
    }

    const pago = await res.json();
    contentDiv.innerHTML = renderDetalleIngreso(pago);

  } catch (e) {
    console.error("Error cargando detalles del pago", e);
    contentDiv.innerHTML = `<p class="text-red-400">No se pudieron cargar los detalles</p>`;
  }
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
