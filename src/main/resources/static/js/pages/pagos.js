import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

let productosMap = {};
let membresiasMap = {};
let pagosDiaChart = null;
let donutIngresosChart;


const API_URL = "/pagos";

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.getElementById("tablaPagosBody");
  const filtroSelect = document.getElementById("filtroRecaudado");

  document.getElementById("btnHome")
    .addEventListener("click", () => window.location.href = "home.html");

  document.getElementById("btnNuevoPago")
    .addEventListener("click", () => window.location.href = "registrar-pago.html");

  // Cargar tabla y nombres
  cargarPagos(tablaBody);
  cargarNombres();
  cargarKPIsRecaudado();
  cargarDistribucionIngresos();
  cargarMasVendidos();
  

  // Cargar gráfico según filtro seleccionado
  cargarRecaudado(filtroSelect.value);

  // Escuchar cambios en el filtro
  filtroSelect.addEventListener("change", (e) => {
    cargarRecaudado(e.target.value);
  });
});



async function cargarPagos(tablaBody) {
  try {
    const res = await authFetch(API_URL);
    const data = await res.json();
    renderPagos(tablaBody, data);
  } catch (err) {
    console.error(err);
    alert("Error al cargar pagos");
  }
}

function renderPagos(tablaBody, pagos) {
  tablaBody.innerHTML = "";

  if (!pagos.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-400">
          No hay pagos registrados
        </td>
      </tr>`;
    return;
  }

  pagos.forEach((p, index) => {

    // Fila principal
    const tr = document.createElement("tr");
    tr.className = `
      border-b border-[var(--input-border)]
      hover:bg-[#1a1a1a] transition
    `;

    tr.innerHTML = `
  <td class="px-6 py-4 whitespace-nowrap text-sm text-left">
    ${p.fecha}
  </td>

  <td class="px-6 py-4 whitespace-nowrap text-left">
    <span class="
      inline-block
      px-3 py-1
      text-xs font-semibold
      rounded-full
      bg-[#1a1a1a]
      border border-[var(--input-border)]
    ">
      ${p.estado}
    </span>
  </td>

  <td class="
    px-6 py-4
    whitespace-nowrap
    font-semibold
    text-[var(--beige)]
    text-left
  ">
    $ ${p.monto}
  </td>

  <td class="px-6 py-4 whitespace-nowrap text-left">
    <button
      class="text-[var(--orange)] font-semibold hover:underline"
      data-index="${index}">
      Ver detalle
    </button>
  </td>
`;


    tablaBody.appendChild(tr);

    // Fila detalle (sub-card)
    const trDetalle = document.createElement("tr");
    trDetalle.className = "hidden";
    trDetalle.id = `detalle-${index}`;

    trDetalle.innerHTML = `
  <td colspan="4" class="px-6 py-4 bg-[#0f0f0f]">
    <div class="
      bg-[#121212]
      border border-[var(--input-border)]
      rounded-xl
      p-5
      shadow-inner
    ">
      <h4 class="text-sm font-semibold text-[var(--beige)] mb-4">
        Detalle del pago
      </h4>

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
    return `<p class="text-sm text-gray-400">No hay detalle.</p>`;
  }

  return `
    <div class="space-y-3">
      ${detallePagos.map(d => {
    const tipo = d.idProducto ? "Producto" : "Membresía";
    const nombre = d.idProducto
      ? productosMap[d.idProducto] || "Desconocido"
      : membresiasMap[d.idMembresia] || "Desconocida";

    return `
          <div class="flex justify-between items-start
                      bg-[#181818] border border-[var(--input-border)]
                      rounded-lg p-3">
            <div>
              <p class="text-xs text-gray-400 uppercase">${tipo}</p>
              <p class="font-medium text-gray-200">${nombre}</p>
              <p class="text-xs text-gray-400">Cantidad: ${d.cantidad}</p>
            </div>

            <div class="text-right">
              <p class="text-sm text-gray-400">Unitario</p>
              <p class="font-semibold text-[var(--beige)]">
                $ ${d.precioUnitario}
              </p>
            </div>
          </div>
        `;
  }).join("")}
    </div>
  `;
}




async function cargarKPIsRecaudado() {
  try {
    const [resHoy, resSemana, resMes] = await Promise.all([
      authFetch("/pagos/estadisticas/recaudado-hoy"),
      authFetch("/pagos/estadisticas/recaudado-semana"),
      authFetch("/pagos/estadisticas/recaudado-mes")
    ]);

    const totalHoy = await resHoy.json();
    const totalSemana = await resSemana.json();
    const totalMes = await resMes.json();

    document.getElementById("kpiDia").textContent =
      `$${Number(totalHoy).toLocaleString("es-AR")}`;

    document.getElementById("kpiSemana").textContent =
      `$${Number(totalSemana).toLocaleString("es-AR")}`;

    document.getElementById("kpiMes").textContent =
      `$${Number(totalMes).toLocaleString("es-AR")}`;

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







