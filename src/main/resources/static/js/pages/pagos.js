import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";

checkAuth();

let productosMap = {};
let membresiasMap = {};
let pagosDiaChart = null; // Chart global

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
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          No hay pagos registrados
        </td>
      </tr>`;
    return;
  }

  pagos.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-gray-200 hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-6 py-4">${p.fecha}</td>
      <td class="px-6 py-4">${p.estado}</td>
      <td class="px-6 py-4">$ ${p.monto}</td>
      <td class="px-6 py-4">
        <button class="text-[var(--orange)] font-semibold hover:underline"
                data-index="${index}">
          Ver detalle
        </button>
      </td>
    `;
    tablaBody.appendChild(tr);

    const trDetalle = document.createElement("tr");
    trDetalle.className = "bg-gray-50 hidden";
    trDetalle.id = `detalle-${index}`;
    trDetalle.innerHTML = `
      <td colspan="4" class="px-6 py-4">
        ${renderDetalle(p.detalles)}
      </td>
    `;
    tablaBody.appendChild(trDetalle);
  });

  tablaBody.querySelectorAll("button[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      const filaDetalle = document.getElementById(`detalle-${index}`);
      filaDetalle.classList.toggle("hidden");
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
    return `<p class="text-gray-500">No hay detalle.</p>`;
  }

  let html = `<table class="w-full text-sm border border-gray-200">
                <thead class="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th class="px-4 py-2">Tipo</th>
                    <th class="px-4 py-2">Nombre</th>
                    <th class="px-4 py-2">Cantidad</th>
                    <th class="px-4 py-2">Precio Unitario</th>
                  </tr>
                </thead>
                <tbody>`;

  detallePagos.forEach(d => {
    const tipo = d.idProducto ? "PRODUCTO" : "MEMBRESIA";
    const nombre = d.idProducto
      ? productosMap[d.idProducto] || "Desconocido"
      : membresiasMap[d.idMembresia] || "Desconocida";

    html += `<tr class="border-b border-gray-200">
               <td class="px-4 py-2 font-medium">${tipo}</td>
               <td class="px-4 py-2">${nombre}</td>
               <td class="px-4 py-2">${d.cantidad}</td>
               <td class="px-4 py-2">$ ${d.precioUnitario}</td>
             </tr>`;
  });

  html += `</tbody></table>`;
  return html;
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







