import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { renderPagination } from "../ui/pagination.js";
import { Alerta } from "../ui/alerta.js";
import { formatCurrency, formatVariation } from "./finanzas/formatters.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

let productosMap = {};
let membresiasMap = {};
let pagosDiaChart = null;
let donutIngresosChart;

const API_URL = "/pagos";

// Estado de paginación y filtro
let currentPage = 0;
const pageSize = 20;

export function init() {
  const tablaBody = document.getElementById("tablaPagosBody");
  const filtroSelect = document.getElementById("filtroRecaudado");

  // Inputs de fecha
  const inputDesde = document.getElementById("filtroDesde");
  const inputHasta = document.getElementById("filtroHasta");

  // Inicializar fechas (últimos 30 días por defecto)
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  inputHasta.value = hoy.toISOString().split("T")[0];
  inputDesde.value = hace30dias.toISOString().split("T")[0];

  document
    .getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

  document
    .getElementById("btnNuevoPago")
    ?.addEventListener("click", () => navigateTo("registrar-pago"));

  // Botón Filtrar Fechas
  document.getElementById("btnFiltrarFecha").addEventListener("click", () => {
    currentPage = 0; // Resetear a primera página al filtrar
    cargarPagos(tablaBody);
  });

  // Botón Limpiar Filtros
  document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
    inputDesde.value = "";
    inputHasta.value = "";
    currentPage = 0;
    cargarPagos(tablaBody);
  });

  // Botón Exportar CSV
  document
    .getElementById("btnExportarPagos")
    ?.addEventListener("click", exportarPagos);

  // Cargar datos iniciales asegurando el orden correcto para el render de la tabla
  cargarDatosIniciales(tablaBody);

  // Cargar gráfico según filtro seleccionado
  cargarRecaudado(filtroSelect.value);

  // Escuchar cambios en el filtro de gráfico
  filtroSelect.addEventListener("change", (e) => {
    cargarRecaudado(e.target.value);
  });
}

export function destroy() {
  if (pagosDiaChart) pagosDiaChart.destroy();
  if (donutIngresosChart) donutIngresosChart.destroy();
}

async function cargarDatosIniciales(tablaBody) {
  try {
    // 1. Primero cargar los nombres (productos y membresías) que necesita la tabla
    await cargarNombres();

    // 2. Ahora sí podemos cargar los pagos y el resto de los KPIs en paralelo
    await Promise.all([
      cargarPagos(tablaBody),
      cargarKPIsRecaudado(),
      cargarDistribucionIngresos(),
      cargarMasVendidos(),
    ]);
  } catch (err) {
    console.error("Error en carga inicial de pagos", err);
  }
}

async function cargarPagos(tablaBody) {
  try {
    const desde = document.getElementById("filtroDesde").value;
    const hasta = document.getElementById("filtroHasta").value;

    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;

    const res = await authFetch(url);
    const pageData = await res.json();

    // pageData es PageResponseDTO { content, page, size, totalElements, totalPages }
    renderPagos(tablaBody, pageData.content);

    renderPagination(
      document.getElementById("paginationContainer"),
      pageData.page,
      pageData.totalPages,
      (newPage) => {
        currentPage = newPage;
        cargarPagos(tablaBody);
      },
    );
  } catch (err) {
    Alerta.error("Error al cargar pagos");
  }
}

function renderPagos(tablaBody, pagos) {
  const emptyState = document.getElementById("emptyStatePagos");

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll("tr:not(#emptyStatePagos)");
  rows.forEach((row) => row.remove());

  if (!pagos || !pagos.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add("hidden");

  pagos.forEach((p, index) => {
    // Fila principal
    const tr = document.createElement("tr");
    tr.classList.add("animate-fade-in-up");
    tr.style.animationDelay = `${index * 50}ms`;

    let socioHtml = "—";
    if (p.dniSocio) {
      socioHtml = `${p.nombreSocio} <span class="text-xs text-gray-400">(${p.dniSocio})</span>`;
    }

    tr.innerHTML = `
      <td class="py-5 px-6 align-middle">${p.fecha}</td>
      <td class="py-5 px-6 align-middle">${socioHtml}</td>
      <td class="py-5 px-6 align-middle text-center">
        <span class="badge ${p.estado === "PAGADO" ? "badge-success" : p.estado === "ANULADO" ? "badge-danger" : "badge-warning"}">
          ${p.estado}
        </span>
      </td>
      <td class="py-5 px-6 align-middle text-right font-semibold text-[var(--beige)] font-mono">$ ${p.monto}</td>
      <td class="py-5 px-6 align-middle text-center">
        <button class="table-action-btn" data-index="${index}" title="Ver detalle">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </td>
    `;

    tablaBody.appendChild(tr);

    // Fila detalle (sub-card)
    const trDetalle = document.createElement("tr");
    trDetalle.className = "hidden bg-[#0a0a0a]";
    trDetalle.id = `detalle-${index}`;

    trDetalle.innerHTML = `
      <td colspan="5" class="p-0 border-b border-[#222]">
        <div class="detail-panel py-6 px-12">
          <h4 class="detail-panel-title mb-4 text-gray-300">Detalle del pago</h4>
          ${renderDetalle(p.detalles)}
        </div>
      </td>
    `;
    tablaBody.appendChild(trDetalle);
  });

  // Toggle detalle
  tablaBody.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      document.getElementById(`detalle-${index}`).classList.toggle("hidden");
    });
  });
}

async function cargarNombres() {
  const [productosRes, membresiasRes] = await Promise.all([
    authFetch("/productos"),
    authFetch("/membresias"),
  ]);

  const productos = await productosRes.json();
  const membresias = await membresiasRes.json();

  productosMap = Object.fromEntries(
    productos.map((p) => [p.idProducto, p.nombre]),
  );
  membresiasMap = Object.fromEntries(
    membresias.map((m) => [m.idMembresia, m.nombre]),
  );
}

function renderDetalle(detallePagos) {
  if (!detallePagos || !detallePagos.length) {
    return `<p class="text-sm text-gray-500">No hay detalle.</p>`;
  }

  return `
    <div class="detail-items flex flex-col gap-4">
      ${detallePagos
        .map((d) => {
          const tipo = d.idProducto ? "Producto" : "Membresía";
          const nombre = d.idProducto
            ? productosMap[d.idProducto] || "Desconocido"
            : membresiasMap[d.idMembresia] || "Desconocida";

          return `
          <div class="detail-item flex justify-between items-center p-4 rounded border border-[#222] bg-[#111]">
            <div>
              <p class="detail-item-type text-xs text-gray-500 uppercase tracking-widest mb-1">${tipo}</p>
              <p class="detail-item-name text-sm text-white font-medium">${nombre}</p>
              <p class="detail-item-qty text-xs text-gray-400 mt-1">Cantidad: <span class="text-gray-300 font-bold">${d.cantidad}</span></p>
            </div>
            <div class="text-right">
              <p class="detail-item-label text-xs text-gray-500 mb-1">Unitario</p>
              <p class="detail-item-price text-sm text-[var(--beige)] font-mono">$ ${d.precioUnitario}</p>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function setValor(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = formatCurrency(valor);
}

function renderVariacion(elementId, variacion) {
  const el = document.getElementById(elementId);
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

async function cargarKPIsRecaudado() {
  try {
    const [resHoy, resSemana, resMesCompleto] = await Promise.all([
      authFetch("/pagos/estadisticas/recaudado-hoy"),
      authFetch("/pagos/estadisticas/recaudado-semana"),
      authFetch("/pagos/estadisticas/mes-completo"),
    ]);

    const totalHoy = await resHoy.json();
    const totalSemana = await resSemana.json();
    const statsMes = await resMesCompleto.json();

    setValor("kpiDia", totalHoy);
    setValor("kpiSemana", totalSemana);
    setValor("kpiMes", statsMes.totalMes);
    renderVariacion("varMes", statsMes.variacionMensual);
  } catch (err) {
    console.error("Error al cargar KPIs de recaudado:", err);
  }
}

async function cargarDistribucionIngresos() {
  try {
    const res = await authFetch(
      "/pagos/estadisticas/recaudado-productos-planes",
    );
    const data = await res.json();

    const productos = data.totalProductos || 0;
    const membresias = data.totalPlanes || 0;

    const ctx = document.getElementById("donutIngresos").getContext("2d");

    if (donutIngresosChart) donutIngresosChart.destroy();

    donutIngresosChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Productos", "Cuotas"],
        datasets: [
          {
            data: [productos, membresias],
            backgroundColor: ["#c7c7c7", "#3b82f6"],
            hoverBackgroundColor: ["#e0e0e0", "#60a5fa"],
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "82%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#9ca3af",
              padding: 24,
              boxWidth: 8,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            backgroundColor: "rgba(10,10,10,0.9)",
            titleColor: "#fff",
            bodyColor: "#d1d5db",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const total = productos + membresias;
                const value = ctx.raw;
                const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                return `$ ${value.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error al cargar donut de ingresos:", err);
  }
}

async function cargarMasVendidos() {
  try {
    const [productoRes, planRes] = await Promise.all([
      authFetch("/pagos/estadisticas/producto-mas-vendido-mes"),
      authFetch("/pagos/estadisticas/plan-mas-vendido-mes"),
    ]);

    const producto = await productoRes.json();
    const plan = await planRes.json();

    console.log(producto);

    document.getElementById("productoMasVendidoNombre").textContent =
      producto.nombre || "—";

    document.getElementById("productoMasVendidoTotal").textContent =
      producto.cantidad ? `${producto.cantidad} vendidos` : "Sin ventas";

    document.getElementById("planMasVendidoNombre").textContent =
      plan.nombre || "—";

    document.getElementById("planMasVendidoTotal").textContent = plan.cantidad
      ? `${plan.cantidad} socios`
      : "Sin socios";
  } catch (e) {
    console.error("Error cargando más vendidos", e);
  }
}

// ------------------ GRÁFICO ------------------
async function cargarRecaudado(filtro = "7dias") {
  try {
    const endpoint =
      filtro === "7dias"
        ? "/pagos/estadisticas/recaudado-ultima-semana"
        : "/pagos/estadisticas/recaudado-meses";

    const res = await authFetch(endpoint);
    const data = await res.json();

    let labels = [];
    let totals = [];

    if (filtro === "7dias") {
      labels = data.map((d) => d.fecha);
      totals = data.map((d) => d.monto ?? 0);
    } else {
      // suponemos data = [{anio, mes, total}]
      labels = data.map((d) => `${d.mes}/${d.anio}`);
      totals = data.map((d) => d.monto ?? 0);
    }

    const ctx = document.getElementById("pagosDiaChart").getContext("2d");

    if (pagosDiaChart) pagosDiaChart.destroy();

    pagosDiaChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Recaudado",
            data: totals,

            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.4,

            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: "#3b82f6",
            pointHoverBackgroundColor: "#111",
            pointBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: { display: false },

          title: {
            display: false,
          },

          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,

            backgroundColor: "rgba(10,10,10,0.9)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,

            titleColor: "#aaa",
            bodyColor: "#fff",

            titleFont: {
              size: 11,
              weight: "normal",
            },
            bodyFont: {
              size: 13,
              weight: "bold",
            },

            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => `Recaudado: ${formatCurrency(ctx.parsed.y)}`,
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#6b7280",
              font: { size: 11 },
              callback: (v) => `${formatCurrency(v)}`,
            },
            grid: {
              display: false,
            },
            border: { display: false },
          },
          x: {
            ticks: {
              color: "#6b7280",
              font: { size: 11 },
            },
            grid: {
              display: false,
            },
            border: { display: false },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error al cargar estadística de recaudado:", err);
  }
}

/* ================== UTIL ================== */

/* ================== EXPORTAR ================== */

async function exportarPagos() {
  try {
    const desde = document.getElementById("filtroDesde").value || "";
    const hasta = document.getElementById("filtroHasta").value || "";

    let url = `/exportar/pagos?`;
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
    a.download = `pagos_${desde || "inicio"}_a_${hasta || "hoy"}.csv`;
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
