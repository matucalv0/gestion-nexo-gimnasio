import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { renderPagination } from "../ui/pagination.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

let productosMap = {};
let membresiasMap = {};
let pagosDiaChart = null;
let donutIngresosChart;

const API_URL = "/pagos";

// Estado de paginación y filtro
let currentPage = 0;
const pageSize = 20;

document.addEventListener("DOMContentLoaded", () => {
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

  document.getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

  document.getElementById("btnNuevoPago")
    .addEventListener("click", () => window.location.href = "registrar-pago.html");

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
  document.getElementById("btnExportarPagos")?.addEventListener("click", exportarPagos);

  // Cargar tabla inicial
  cargarPagos(tablaBody);

  // Cargar otros datos
  cargarNombres();
  cargarKPIsRecaudado();
  cargarDistribucionIngresos();
  cargarMasVendidos();

  // Cargar gráfico según filtro seleccionado
  cargarRecaudado(filtroSelect.value);

  // Escuchar cambios en el filtro de gráfico
  filtroSelect.addEventListener("change", (e) => {
    cargarRecaudado(e.target.value);
  });
});

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
      }
    );

  } catch (err) {
    Alerta.error("Error al cargar pagos");
  }
}

function renderPagos(tablaBody, pagos) {
  const emptyState = document.getElementById('emptyStatePagos');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStatePagos)');
  rows.forEach(row => row.remove());

  if (!pagos || !pagos.length) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

  pagos.forEach((p, index) => {

    // Fila principal
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.fecha}</td>
      <td>
        <span class="badge ${p.estado === 'PAGADO' ? 'badge-success' : p.estado === 'ANULADO' ? 'badge-danger' : 'badge-warning'}">
          ${p.estado}
        </span>
      </td>
      <td class="font-semibold text-[var(--beige)]">$ ${p.monto}</td>
      <td>
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
    trDetalle.className = "hidden";
    trDetalle.id = `detalle-${index}`;

    trDetalle.innerHTML = `
      <td colspan="4" class="p-0">
        <div class="detail-panel">
          <h4 class="detail-panel-title">Detalle del pago</h4>
          ${renderDetalle(p.detalles)}
        </div>
      </td>
    `;
    tablaBody.appendChild(trDetalle);
  });

  // Toggle detalle
  tablaBody.querySelectorAll("button[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      document
        .getElementById(`detalle-${index}`)
        .classList.toggle("hidden");
    });
  });
}


async function cargarNombres() {
  const [productosRes, membresiasRes] = await Promise.all([
    authFetch("/productos"),
    authFetch("/membresias")
  ]);

  const productos = await productosRes.json();
  const membresias = await membresiasRes.json();

  productosMap = Object.fromEntries(productos.map(p => [p.idProducto, p.nombre]));
  membresiasMap = Object.fromEntries(membresias.map(m => [m.idMembresia, m.nombre]));
}

function renderDetalle(detallePagos) {
  if (!detallePagos || !detallePagos.length) {
    return `<p class="text-sm text-gray-500">No hay detalle.</p>`;
  }

  return `
    <div class="detail-items">
      ${detallePagos.map(d => {
    const tipo = d.idProducto ? "Producto" : "Membresía";
    const nombre = d.idProducto
      ? productosMap[d.idProducto] || "Desconocido"
      : membresiasMap[d.idMembresia] || "Desconocida";

    return `
          <div class="detail-item">
            <div>
              <p class="detail-item-type">${tipo}</p>
              <p class="detail-item-name">${nombre}</p>
              <p class="detail-item-qty">Cantidad: ${d.cantidad}</p>
            </div>
            <div class="text-right">
              <p class="detail-item-label">Unitario</p>
              <p class="detail-item-price">$ ${d.precioUnitario}</p>
            </div>
          </div>
        `;
  }).join("")}
    </div>
  `;
}




async function cargarKPIsRecaudado() {
  try {
    const [resHoy, resSemana, resMesCompleto] = await Promise.all([
      authFetch("/pagos/estadisticas/recaudado-hoy"),
      authFetch("/pagos/estadisticas/recaudado-semana"),
      authFetch("/pagos/estadisticas/mes-completo")
    ]);

    const totalHoy = await resHoy.json();
    const totalSemana = await resSemana.json();
    const statsMes = await resMesCompleto.json();

    document.getElementById("kpiDia").textContent =
      `$${Number(totalHoy).toLocaleString("es-AR")}`;

    document.getElementById("kpiSemana").textContent =
      `$${Number(totalSemana).toLocaleString("es-AR")}`;

    document.getElementById("kpiMes").textContent =
      `$${Number(statsMes.totalMes).toLocaleString("es-AR")}`;

    renderVariacion("varMes", statsMes.variacionMensual);

  } catch (err) {
    console.error("Error al cargar KPIs de recaudado:", err);
  }
}




async function cargarDistribucionIngresos() {
  try {
    const res = await authFetch(
      "/pagos/estadisticas/recaudado-productos-planes"
    );
    const data = await res.json();

    const productos = data.totalProductos || 0;
    const membresias = data.totalPlanes || 0;

    const ctx = document
      .getElementById("donutIngresos")
      .getContext("2d");

    if (donutIngresosChart) donutIngresosChart.destroy();

    donutIngresosChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Productos", "Cuotas"],
        datasets: [{
          data: [productos, membresias],
          backgroundColor: ["#c7c7c7", "#e9561e"],
          hoverBackgroundColor: ["#e0e0e0", "#ff6a2b"],
          borderColor: "#111",
          borderWidth: 2,
          hoverOffset: 6
        }]

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
              boxWidth: 12
            }
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
                const total = productos + membresias;
                const value = ctx.raw;
                const pct = total
                  ? ((value / total) * 100).toFixed(1)
                  : 0;
                return `$ ${value.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error al cargar donut de ingresos:", err);
  }
}

async function cargarMasVendidos() {
  try {
    const [productoRes, planRes] = await Promise.all([
      authFetch("/pagos/estadisticas/producto-mas-vendido-mes"),
      authFetch("/pagos/estadisticas/plan-mas-vendido-mes")
    ]);

    const producto = await productoRes.json();
    const plan = await planRes.json();

    console.log(producto);

    document.getElementById("productoMasVendidoNombre").textContent =
      producto.nombre || "—";

    document.getElementById("productoMasVendidoTotal").textContent =
      producto.cantidad
        ? `${producto.cantidad} vendidos`
        : "Sin ventas";

    document.getElementById("planMasVendidoNombre").textContent =
      plan.nombre || "—";

    document.getElementById("planMasVendidoTotal").textContent =
      plan.cantidad
        ? `${plan.cantidad} socios`
        : "Sin socios";

  } catch (e) {
    console.error("Error cargando más vendidos", e);
  }
}




// ------------------ GRÁFICO ------------------
async function cargarRecaudado(filtro = "7dias") {
  try {
    const endpoint = filtro === "7dias"
      ? "/pagos/estadisticas/recaudado-ultima-semana"
      : "/pagos/estadisticas/recaudado-meses";

    const res = await authFetch(endpoint);
    const data = await res.json();

    let labels = [];
    let totals = [];

    if (filtro === "7dias") {
      labels = data.map(d => d.fecha);
      totals = data.map(d => d.monto ?? 0);
    } else {
      // suponemos data = [{anio, mes, total}]
      labels = data.map(d => `${d.mes}/${d.anio}`);
      totals = data.map(d => d.monto ?? 0);
    }

    const ctx = document.getElementById("pagosDiaChart").getContext("2d");

    if (pagosDiaChart) pagosDiaChart.destroy();

    pagosDiaChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Recaudado",
          data: totals,

          borderColor: "#c7c7c7",
          backgroundColor: "rgba(199,199,199,0.15)",
          fill: true,
          tension: 0.3,

          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#c7c7c7",
          pointHoverBackgroundColor: "#ECD9BA",
          pointBorderColor: "#ffffff",
          pointHoverBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,

        interaction: {
          mode: "index",
          intersect: false
        },

        plugins: {
          legend: { display: false },

          title: {
            display: true,
            text: filtro === "7dias"
              ? "Recaudado últimos 7 días"
              : "Recaudado por mes",
            color: "#ECD9BA",
            font: {
              size: 16,
              weight: "bold"
            },
            padding: {
              top: 8,
              bottom: 16
            }
          },

          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,

            backgroundColor: "rgba(15,15,15,0.95)",
            borderColor: "rgba(255,255,255,0.15)",
            borderWidth: 1,

            titleColor: "#ECD9BA",
            bodyColor: "#ECD9BA",

            titleFont: {
              size: 13,
              weight: "bold"
            },
            bodyFont: {
              size: 12
            },

            padding: 10,
            cornerRadius: 6,
            displayColors: false
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#e5e5e5"
            },
            grid: {
              color: "rgba(255,255,255,0.08)"
            }
          },
          x: {
            ticks: {
              color: "#e5e5e5"
            },
            grid: {
              drawOnChartArea: false // clave: limpia visualmente el gráfico
            }
          }
        }
      }
    });


  } catch (err) {
    console.error("Error al cargar estadística de recaudado:", err);
  }
}

/* ================== UTIL ================== */

function renderVariacion(elementId, variacion) {
  const el = document.getElementById(elementId);
  if (!el || variacion == null) return;

  const esPositivo = variacion >= 0;
  const color = esPositivo ? "text-green-500" : "text-red-500";
  const icono = esPositivo ? "▲" : "▼";

  el.className = `text-xs font-bold ${color} ml-2`;
  el.innerHTML = `${icono} ${Math.abs(variacion).toFixed(1)}%`;
}

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
    a.download = `pagos_${desde || 'inicio'}_a_${hasta || 'hoy'}.csv`;
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

