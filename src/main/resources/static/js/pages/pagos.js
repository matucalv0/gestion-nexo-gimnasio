import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { renderPagination } from "../ui/pagination.js";
import { Alerta } from "../ui/alerta.js";
import { renderMasterTable, createAvatarCell, createStatusBadge } from "../ui/tabla.js";
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

  renderMasterTable({
    tbody: tablaBody,
    emptyElement: emptyState,
    data: pagos,
    columns: [
      {
        field: "fecha",
        format: (f) => `<span class="text-xs text-gray-400 font-mono">${f || "—"}</span>`
      },
      {
        render: (p) => {
          if (p.nombreSocio) {
            return createAvatarCell(p.nombreSocio, p.dniSocio ? `DNI ${p.dniSocio}` : "");
          }
          return `<span class="text-gray-500 text-xs italic">Venta mostrador</span>`;
        }
      },
      {
        className: "text-center",
        render: (p) => {
          const tipo = p.estado === "PAGADO" ? "success" : p.estado === "ANULADO" ? "danger" : "warning";
          return createStatusBadge(p.estado || "PAGADO", tipo, p.estado === "PAGADO");
        }
      },
      {
        className: "text-right",
        render: (p) => `<span class="font-mono font-bold text-white tabular-nums">${formatCurrency(p.monto)}</span>`
      }
    ],
    actions: [
      {
        icon: "view",
        type: "primary",
        title: "Ver detalle del pago",
        onClick: (p, index) => {
          const rowDetalle = document.getElementById(`detalle-pago-${index}`);
          if (rowDetalle) {
            rowDetalle.classList.toggle("hidden");
          }
        }
      }
    ]
  });

  // Inject collapsible detail rows
  if (pagos && pagos.length > 0) {
    const rows = Array.from(tablaBody.querySelectorAll("tr"));
    pagos.forEach((p, index) => {
      const parentRow = rows[index];
      if (!parentRow) return;

      const trDetalle = document.createElement("tr");
      trDetalle.className = "hidden bg-[#090909]";
      trDetalle.id = `detalle-pago-${index}`;

      trDetalle.innerHTML = `
        <td colspan="5" class="p-0 border-b border-[#222]">
          <div class="py-5 px-8 bg-[#090909] border-t border-b border-white/5">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Detalle de los conceptos</h4>
            ${renderDetalle(p.detalles)}
          </div>
        </td>
      `;
      parentRow.after(trDetalle);
    });
  }
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

    const canvas = document.getElementById("donutIngresos");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (donutIngresosChart) donutIngresosChart.destroy();

    const total = productos + membresias;

    // Center text plugin
    const centerTextPlugin = {
      id: "centerTextPluginPagos",
      beforeDraw: (chart) => {
        const { width, height, ctx } = chart;
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2 - 12;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "600 9px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#71717a";
        ctx.fillText("TOTAL MES", centerX, centerY - 10);

        const formatted = formatCurrency(total);
        ctx.font = "700 15px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(formatted, centerX, centerY + 10);

        ctx.restore();
      },
    };

    donutIngresosChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Productos", "Cuotas"],
        datasets: [
          {
            data: total > 0 ? [productos, membresias] : [1, 0],
            backgroundColor: total > 0 ? ["#818cf8", "#38bdf8"] : ["#27272a", "#18181b"],
            hoverBackgroundColor: total > 0 ? ["#a5b4fc", "#7dd3fc"] : ["#3f3f46", "#27272a"],
            borderColor: "#0d0d11",
            borderWidth: 3,
            borderRadius: 4,
            spacing: 3,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "76%",
        animation: { animateScale: true, animateRotate: true, duration: 600, easing: "easeOutQuart" },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#a1a1aa",
              padding: 16,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
              boxHeight: 6,
            },
          },
          tooltip: {
            backgroundColor: "rgba(13, 13, 17, 0.95)",
            titleColor: "#fff",
            bodyColor: "#d4d4d8",
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 700 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12, weight: 600 },
            borderColor: "rgba(255, 255, 255, 0.12)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (ctx) => {
                if (total === 0) return "  Sin cobros registrados";
                const value = ctx.raw;
                const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                return `  $ ${value.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
      plugins: [centerTextPlugin],
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
      labels = data.map((d) => `${d.mes}/${d.anio}`);
      totals = data.map((d) => d.monto ?? 0);
    }

    const canvas = document.getElementById("pagosDiaChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Electric Cyan gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.22)");
    gradient.addColorStop(0.7, "rgba(56, 189, 248, 0.03)");
    gradient.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    if (pagosDiaChart) pagosDiaChart.destroy();

    pagosDiaChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Recaudado",
            data: totals,
            borderColor: "#38bdf8",
            backgroundColor: gradient,
            fill: true,
            tension: 0.28,
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#0d0d11",
            pointHoverBackgroundColor: "#38bdf8",
            pointBorderColor: "#38bdf8",
            pointHoverBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2,
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
        animation: {
          duration: 600,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(13, 13, 17, 0.95)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            borderWidth: 1,
            titleColor: "#ffffff",
            bodyColor: "#38bdf8",
            titleFont: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: "bold",
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 13,
              weight: "bold",
            },
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => `  Recaudado: ${formatCurrency(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#71717a",
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              padding: 8,
              maxTicksLimit: 6,
              callback: (v) => `${formatCurrency(v)}`,
            },
            grid: {
              color: "rgba(255, 255, 255, 0.04)",
              borderDash: [4, 4],
              drawBorder: false,
            },
            border: { display: false },
          },
          x: {
            ticks: {
              color: "#71717a",
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
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
