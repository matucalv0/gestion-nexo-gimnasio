import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";

import { byId, removeAll, setVisible } from "./finanzas/dom.js";
import { formatCurrency, formatVariation, formatDate } from "./finanzas/formatters.js";
import {
  detalleRowIds,
  movimientoMainRowHtml,
  movimientoDetailRowHtml,
  detalleIngresoHtml,
  detalleGastoHtml,
} from "./finanzas/templates.js";

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

const uiState = {
  kpisLoading: true,
  tablaLoading: true,
  donutLoading: true,
  evolucionLoading: true,
};

// cache DOM (MPA)
const dom = {
  filtroEvolucion: null,
  btnHome: null,
  btnNuevoGasto: null,
  btnFiltrarFecha: null,
  btnLimpiarFiltros: null,
  filtroDesde: null,
  filtroHasta: null,
  tablaMovimientos: null,
  emptyState: null,
  pagination: null,

  // UI helpers
  kpisLoading: null,
  kpisContent: null,
  filtrosBanner: null,
  filtrosTexto: null,
  finanzasError: null,

  tablaContainer: null,
  tablaLoading: null,

  donutContainer: null,
  donutLoading: null,

  evolucionContainer: null,
  evolucionLoading: null,

  filtroTipoMovimiento: null,
};

// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initEventos();

  // Inicializamos skeletons/estados
  setKpisLoading(true);
  setTablaLoading(true);
  setDonutLoading(true);
  setEvolucionLoading(true);
  setError(null);

  // Init params
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  if (dom.filtroHasta) dom.filtroHasta.value = hoy.toISOString().split("T")[0];
  if (dom.filtroDesde) dom.filtroDesde.value = hace30dias.toISOString().split("T")[0];

  updateFiltrosBanner();

  // Cargas iniciales
  cargarKPIs();
  cargarMovimientosPaginados();
  cargarDistribucionMensual();
  cargarEvolucion("7dias");
});

function cacheDom() {
  dom.filtroEvolucion = byId("filtroEvolucion");
  dom.btnHome = byId("btnHome");
  dom.btnNuevoGasto = byId("btnNuevoGasto");
  dom.btnFiltrarFecha = byId("btnFiltrarFecha");
  dom.btnLimpiarFiltros = byId("btnLimpiarFiltros");
  dom.btnExportarMovimientos = byId("btnExportarMovimientos");
  dom.filtroDesde = byId("filtroDesde");
  dom.filtroHasta = byId("filtroHasta");
  dom.tablaMovimientos = byId("tablaMovimientos");
  dom.emptyState = byId("emptyStateFinanzas");
  dom.pagination = byId("paginationContainer");

  dom.kpisLoading = byId("kpisLoading");
  dom.kpisContent = byId("kpisContent");
  dom.filtrosBanner = byId("filtrosBanner");
  dom.filtrosTexto = byId("filtrosTexto");
  dom.finanzasError = byId("finanzasError");

  dom.tablaContainer = byId("tablaContainer");
  dom.tablaLoading = byId("tablaLoading");

  dom.donutContainer = byId("donutContainer");
  dom.donutLoading = byId("donutLoading");

  dom.evolucionContainer = byId("evolucionContainer");
  dom.evolucionLoading = byId("evolucionLoading");

  dom.filtroTipoMovimiento = byId("filtroTipoMovimiento");
}

// ==========================
// UI helpers
// ==========================

function setError(message) {
  if (!dom.finanzasError) return;
  if (!message) {
    dom.finanzasError.textContent = "";
    setVisible(dom.finanzasError, false);
    return;
  }

  dom.finanzasError.textContent = message;
  setVisible(dom.finanzasError, true);
}

function setKpisLoading(isLoading) {
  uiState.kpisLoading = isLoading;
  setVisible(dom.kpisLoading, isLoading);
  setVisible(dom.kpisContent, !isLoading);
}

function setTablaLoading(isLoading) {
  uiState.tablaLoading = isLoading;
  setVisible(dom.tablaLoading, isLoading);
  if (dom.tablaContainer) dom.tablaContainer.setAttribute("aria-busy", String(isLoading));
}

function setDonutLoading(isLoading) {
  uiState.donutLoading = isLoading;
  setVisible(dom.donutLoading, isLoading);
  if (dom.donutContainer) dom.donutContainer.setAttribute("aria-busy", String(isLoading));
}

function setEvolucionLoading(isLoading) {
  uiState.evolucionLoading = isLoading;
  setVisible(dom.evolucionLoading, isLoading);
  if (dom.evolucionContainer) dom.evolucionContainer.setAttribute("aria-busy", String(isLoading));
}

function updateFiltrosBanner() {
  const desde = dom.filtroDesde?.value;
  const hasta = dom.filtroHasta?.value;
  const tipo = dom.filtroTipoMovimiento?.value;

  const parts = [];
  if (desde) parts.push(`Desde ${formatDate(desde)}`);
  if (hasta) parts.push(`Hasta ${formatDate(hasta)}`);
  if (tipo) parts.push(`Tipo ${tipo === "INGRESO" ? "Ingreso" : "Egreso"}`);

  if (!dom.filtrosBanner || !dom.filtrosTexto) return;

  if (!parts.length) {
    setVisible(dom.filtrosBanner, false);
    dom.filtrosTexto.textContent = "";
    return;
  }

  dom.filtrosTexto.textContent = parts.join(" · ");
  setVisible(dom.filtrosBanner, true);
}

// ==========================
// EVENTOS
// ==========================

function initEventos() {
  dom.filtroEvolucion?.addEventListener("change", (e) => {
    setEvolucionLoading(true);
    cargarEvolucion(e.target.value);
  });

  dom.btnHome?.addEventListener("click", () => {
    history.back();
  });

  dom.btnNuevoGasto?.addEventListener("click", () => {
    window.location.href = "registrar-gasto.html";
  });

  dom.btnFiltrarFecha?.addEventListener("click", () => {
    currentPage = 0;
    updateFiltrosBanner();
    setTablaLoading(true);
    cargarMovimientosPaginados();
  });

  dom.btnLimpiarFiltros?.addEventListener("click", () => {
    if (dom.filtroDesde) dom.filtroDesde.value = "";
    if (dom.filtroHasta) dom.filtroHasta.value = "";
    if (dom.filtroTipoMovimiento) dom.filtroTipoMovimiento.value = "";
    currentPage = 0;
    updateFiltrosBanner();
    setTablaLoading(true);
    cargarMovimientosPaginados();
  });

  dom.btnExportarMovimientos?.addEventListener("click", exportarMovimientos);

  // UX: actualizar banner al cambiar fecha (sin tocar backend)
  dom.filtroDesde?.addEventListener("change", updateFiltrosBanner);
  dom.filtroHasta?.addEventListener("change", updateFiltrosBanner);

  dom.filtroTipoMovimiento?.addEventListener("change", () => {
    currentPage = 0;
    updateFiltrosBanner();
    setTablaLoading(true);
    cargarMovimientosPaginados();
  });

  // Event delegation para acciones en tabla
  dom.tablaMovimientos?.addEventListener("click", onTablaClick);
}

function onTablaClick(e) {
  const btn = e.target?.closest?.("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const tipo = btn.dataset.tipo;
  const action = btn.dataset.action;

  if (!id || !tipo || !action) return;

  if (action === "detalle") {
    onVerDetalleClick({ id, tipo });
    return;
  }

  if (action === "eliminar") {
    onEliminarClick({ id, tipo });
  }
}

async function onVerDetalleClick({ id, tipo }) {
  const row = byId(`detalle-${id}-${tipo}`);
  const contentDiv = byId(`detalle-content-${id}-${tipo}`);
  if (!row || !contentDiv) return;

  row.classList.toggle("hidden");

  // Si se está mostrando, cargar los detalles
  if (!row.classList.contains("hidden")) {
    if (tipo === "INGRESO") {
      await cargarDetallesPago(id, contentDiv);
    } else {
      const movimiento = movimientosData.find(
        (m) => m.idReferencia === parseInt(id) && m.tipoMovimiento === "EGRESO",
      );
      if (movimiento) {
        contentDiv.innerHTML = detalleGastoHtml(movimiento);
      }
    }
  }
}

function onEliminarClick({ id, tipo }) {
  Alerta.confirm({
    titulo: `¿Eliminar ${tipo === "INGRESO" ? "pago" : "gasto"}?`,
    mensaje: `¿Seguro que deseas eliminar este ${tipo === "INGRESO" ? "pago" : "gasto"}?`,
    textoConfirmar: "Eliminar",
    onConfirm: async () => {
      await eliminarMovimiento(id, tipo);
    },
  });
}

// ==========================
// KPIs
// ==========================

async function cargarKPIs() {
  setKpisLoading(true);
  setError(null);

  try {
    const [resHoy, resSemana, resMes] = await Promise.all([
      authFetch(`${API}/ganancias-hoy`),
      authFetch(`${API}/ganancias-semana`),
      authFetch(`${API}/estadisticas/mes-completo`),
    ]);

    const hoy = await resHoy.json();
    const semana = await resSemana.json();
    const statsMes = await resMes.json();

    setValor("kpiGananciaHoy", hoy);
    setValor("kpiGananciaSemana", semana);

    setValor("kpiGananciaMes", statsMes.gananciaMes);
    renderVariacion("varGananciaMes", statsMes.variacionMensual);

    setKpisLoading(false);
  } catch (e) {
    console.error("Error cargando KPIs", e);
    setKpisLoading(false);
    // No bloqueamos la UI; solo informamos
    setError("No se pudieron cargar las métricas. Reintentá en unos segundos.");
  }
}

function setValor(id, valor) {
  const el = byId(id);
  if (!el) return;
  el.innerText = formatCurrency(valor);
}

function renderVariacion(elementId, variacion) {
  const el = byId(elementId);
  if (!el) return;

  const v = formatVariation(variacion);
  if (!v) {
    el.innerHTML = "";
    el.className = "";
    return;
  }

  const color = v.esPositivo ? "text-green-500" : "text-red-500";
  el.className = `text-xs font-bold ${color} ml-2`;
  el.innerHTML = `${v.icono} ${v.value}%`;
}

// ==========================
// MOVIMIENTOS
// ==========================

async function cargarMovimientosPaginados() {
  setTablaLoading(true);
  setError(null);

  try {
    const desde = dom.filtroDesde?.value;
    const hasta = dom.filtroHasta?.value;
    const tipo = dom.filtroTipoMovimiento?.value; // "" | "INGRESO" | "EGRESO"

    let url = `${API}?page=${currentPage}&size=${pageSize}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;

    const res = await authFetch(url);
    const pageData = await res.json();

    // Filtro en frontend para no depender de cambios backend
    const content = Array.isArray(pageData.content) ? pageData.content : [];
    const filteredContent = tipo ? content.filter((m) => m.tipoMovimiento === tipo) : content;

    movimientosData = filteredContent;
    renderMovimientos(filteredContent);

    // Paginación: mantenemos la del backend. Si el filtro deja pocas filas,
    // se verá una página con menos resultados (esperado sin cambios backend).
    renderPagination(dom.pagination, pageData.page, pageData.totalPages, (newPage) => {
      currentPage = newPage;
      cargarMovimientosPaginados();
    });

    setTablaLoading(false);
  } catch (e) {
    console.error("Error cargando movimientos", e);
    setTablaLoading(false);
    setError("No se pudieron cargar los movimientos. Verificá tu conexión o volvé a intentar.");
  }
}

async function cargarDistribucionMensual() {
  setDonutLoading(true);

  try {
    const res = await authFetch(`${API}/distribucion-mensual`);
    const data = await res.json();

    if (!data) {
      setDonutLoading(false);
      return;
    }

    const ingresos = Number(data.ingresos) || 0;
    const gastos = Number(data.gastos) || 0;

    renderDonut(ingresos, gastos);
    renderDonutResumen(ingresos, gastos);

    setDonutLoading(false);
  } catch (e) {
    console.error("Error cargando distribución mensual", e);
    setDonutLoading(false);
  }
}

function renderMovimientos(movimientos) {
  const tbody = dom.tablaMovimientos;
  if (!tbody) return;

  removeAll(tbody, "tr:not(#emptyStateFinanzas)");

  if (!movimientos?.length) {
    setVisible(dom.emptyState, true);
    return;
  }

  setVisible(dom.emptyState, false);

  const fragment = document.createDocumentFragment();

  movimientos.forEach((m) => {
    const tr = document.createElement("tr");
    tr.className = `
      border-b border-[var(--input-border)]
      hover:bg-[#1a1a1a] transition
    `;
    tr.innerHTML = movimientoMainRowHtml(m);
    fragment.appendChild(tr);

    const trDetalle = document.createElement("tr");
    const { rowId } = detalleRowIds(m);
    trDetalle.id = rowId;
    trDetalle.className = "hidden";
    trDetalle.innerHTML = movimientoDetailRowHtml(m);
    fragment.appendChild(trDetalle);
  });

  tbody.appendChild(fragment);
}

async function eliminarMovimiento(id, tipo) {
  try {
    let endpoint;

    if (tipo === "INGRESO") {
      endpoint = `/pagos/${id}`;
    } else {
      endpoint = `/gastos/${id}`;
    }

    const res = await authFetch(endpoint, { method: "DELETE" });

    if (!res.ok) {
      throw new Error("Error al eliminar movimiento");
    }

    Alerta.success(`${tipo === "INGRESO" ? "Pago" : "Gasto"} eliminado correctamente`);

    setTablaLoading(true);

    await cargarMovimientosPaginados();
    await cargarKPIs();
    await cargarDistribucionMensual();
  } catch (e) {
    console.error("Error eliminando movimiento", e);
    Alerta.error("No se pudo eliminar el movimiento");
  } finally {
    setTablaLoading(false);
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
    contentDiv.innerHTML = detalleIngresoHtml(pago);
  } catch (e) {
    console.error("Error cargando detalles del pago", e);
    contentDiv.innerHTML = `<p class="text-red-400">No se pudieron cargar los detalles</p>`;
  }
}

// ==========================
// EVOLUCIÓN (GRÁFICO)
// ==========================

async function cargarEvolucion(filtro) {
  setEvolucionLoading(true);

  try {
    const endpoint = filtro === "7dias" ? `${API}/balance-semanal` : `${API}/balance-mensual`;

    const res = await authFetch(endpoint);
    const data = await res.json();

    if (!Array.isArray(data)) {
      setEvolucionLoading(false);
      return;
    }

    renderChart({
      labels: mapLabels(data, filtro),
      ingresos: data.map((d) => Number(d.ingresos) || 0),
      egresos: data.map((d) => Number(d.egresos) || 0),
    });
  } catch (e) {
    console.error("Error cargando evolución", e);
  } finally {
    setEvolucionLoading(false);
  }
}

// ==========================
// CHART
// ==========================

function renderChart({ labels, ingresos, egresos }) {
  if (chartEvolucion) chartEvolucion.destroy();

  const ctx = byId("chartEvolucion");

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
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
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
          callback: (v) => `${formatCurrency(v)}`,
        },
        grid: { color: "#1f2937" },
      },
    },
  };
}

function renderDonut(ingresos, gastos) {
  if (chartDonut) chartDonut.destroy();

  const ctx = byId("donutIngresos").getContext("2d");

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

function renderDonutResumen(ingresos, gastos) {
  const elIngresos = byId("donutResumenIngresos");
  const elGastos = byId("donutResumenGastos");
  const elNeto = byId("donutResumenNeto");
  const elPct = byId("donutResumenPct");

  if (elIngresos) elIngresos.textContent = formatCurrency(ingresos);
  if (elGastos) elGastos.textContent = formatCurrency(gastos);

  const neto = ingresos - gastos;
  if (elNeto) {
    elNeto.textContent = formatCurrency(neto);
    elNeto.classList.toggle("text-green-400", neto >= 0);
    elNeto.classList.toggle("text-red-400", neto < 0);
  }

  if (elPct) {
    const total = ingresos + gastos;
    if (!total) {
      elPct.textContent = "";
      return;
    }

    const pctIngresos = (ingresos / total) * 100;
    const pctGastos = (gastos / total) * 100;
    elPct.textContent = `${pctIngresos.toFixed(0)}% ingresos · ${pctGastos.toFixed(0)}% gastos`;
  }
}

// ==========================
// UTILS
// ==========================

function mapLabels(data, filtro) {
  if (filtro === "7dias") {
    return data.map((d) => (d.fecha ? formatDate(d.fecha) : ""));
  }

  return data.map((d) => `${String(d.mes).padStart(2, "0")}/${d.anio}`);
}

// ==========================
// EXPORTAR
// ==========================

async function exportarMovimientos() {
  try {
    const desde = dom.filtroDesde?.value || "";
    const hasta = dom.filtroHasta?.value || "";

    let url = `/exportar/movimientos?`;
    if (desde) url += `desde=${desde}&`;
    if (hasta) url += `hasta=${hasta}`;

    const res = await authFetch(url);
    if (!res.ok) {
      if (res.status === 403) {
        Alerta.error("Solo administradores pueden exportar");
        return;
      }
      throw new Error("Error al exportar");
    }

    const blob = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = `movimientos_${desde || 'inicio'}_a_${hasta || 'hoy'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(urlBlob);

    Alerta.success("Archivo exportado correctamente");
  } catch (err) {
    console.error("Error exportando", err);
    Alerta.error("No se pudo exportar el archivo");
  }
}

