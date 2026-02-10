import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";

checkAuth();

const API_URL = "/asistencias";

// Estado paginación
let currentPage = 0;
const pageSize = 20;

document.addEventListener("DOMContentLoaded", () => {

  const tablaBody = document.getElementById("tablaAsistenciasBody");

  // Filtros
  const inputBusqueda = document.getElementById("inputBusqueda");
  const inputDesde = document.getElementById("filtroDesde");
  const inputHasta = document.getElementById("filtroHasta");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiarFiltros");

  // Filtro Mes (KPIs)
  const inputMes = document.getElementById("filtroMesAsistencias");

  // Inicializar fechas (últimos 30 días)
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  inputHasta.value = hoy.toISOString().split("T")[0];
  inputDesde.value = hace30dias.toISOString().split("T")[0];

  document.getElementById("btnHome")?.addEventListener("click", () => window.location.href = "home.html");

  // Botón Buscar / Filtrar
  btnBuscar?.addEventListener("click", () => {
    currentPage = 0;
    cargarAsistencias(tablaBody);
  });

  // Enter en buscador
  inputBusqueda?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentPage = 0;
      cargarAsistencias(tablaBody);
    }
  });

  // Botón Limpiar
  btnLimpiar?.addEventListener("click", () => {
    inputBusqueda.value = "";
    inputDesde.value = "";
    inputHasta.value = "";
    currentPage = 0;
    cargarAsistencias(tablaBody);
  });

  // set mes actual por defecto para KPIs
  if (inputMes) inputMes.value = mesActualISO();

  // listeners KPIs
  inputMes?.addEventListener("change", () => {
    cargarKPIs();
    cargarGrafico();
  });

  // carga inicial
  cargarAsistencias(tablaBody);
  cargarKPIs();
  cargarGrafico();
});

/* ================== ASISTENCIAS (TABLA) ================== */

async function cargarAsistencias(tablaBody) {
  try {
    const q = document.getElementById("inputBusqueda").value;
    const desde = document.getElementById("filtroDesde").value;
    const hasta = document.getElementById("filtroHasta").value;

    let url = `${API_URL}?page=${currentPage}&size=${pageSize}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;

    const res = await authFetch(url);
    const pageData = await res.json();

    // pageData es PageResponseDTO
    renderTabla(tablaBody, pageData.content);

    renderPagination(
      document.getElementById("paginationContainer"),
      pageData.page,
      pageData.totalPages,
      (newPage) => {
        currentPage = newPage;
        cargarAsistencias(tablaBody);
      }
    );

  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar asistencias");
  }
}

function renderTabla(tablaBody, asistencias) {
  const emptyState = document.getElementById('emptyStateAsistencias');

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll('tr:not(#emptyStateAsistencias)');
  rows.forEach(row => row.remove());

  if (!asistencias || asistencias.length === 0) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add('hidden');

  // Agregar animación al tbody
  tablaBody.classList.add('animate-fade-in');

  asistencias.forEach(a => {
    const tr = document.createElement("tr");
    tr.className =
      "border-b border-[var(--input-border)] hover:bg-[#1a1a1a] transition";

    tr.innerHTML = `
      <td class="px-6 py-4">${a.nombre}</td>
      <td class="px-6 py-4">${a.dni}</td>
      <td class="px-6 py-4">${new Date(a.fechaHora).toLocaleString("es-AR")}</td>
    `;

    tablaBody.appendChild(tr);
  });
}

/* ================== KPIs ================== */

async function cargarKPIs() {
  const mesInput = document.getElementById("filtroMesAsistencias");
  if (!mesInput) return;
  const mes = mesInput.value;
  if (!mes) return;

  try {
    const res = await authFetch(`${API_URL}/estadisticas/mes`);
    const stats = await res.json();

    document.getElementById("kpiTotalAsistencias").textContent = stats.totalAsistencias ?? 0;
    renderVariacion("varTotalAsistencias", stats.variacionAsistencias);

    document.getElementById("kpiPromedio").textContent = stats.promedioAsistencias ?? 0;
    renderVariacion("varPromedio", stats.variacionPromedio);

    document.getElementById("kpiSociosActivosTotal").textContent = stats.sociosActivos ?? 0;
    renderVariacion("varSociosActivos", stats.variacionSocios);

    const ul = document.getElementById("kpiSociosActivos");
    ul.innerHTML = "";

    if (!stats.sociosMasActivos || stats.sociosMasActivos.length === 0) {
      ul.innerHTML = `<li class="text-gray-500">Sin datos</li>`;
      return;
    }

    stats.sociosMasActivos.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `• ${s.nombre} (${s.dni})`;
      ul.appendChild(li);
    });

    // Cargar hora pico
    await cargarHoraPico();

  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar KPIs");
  }
}

async function cargarHoraPico() {
  try {
    const res = await authFetch(`${API_URL}/estadisticas/hora-pico`);
    const data = await res.json();

    document.getElementById("kpiHoraPico").textContent = data.rangoHorario || "--:--";
    document.getElementById("kpiHoraPicoAsistencias").textContent =
      `${data.totalAsistencias || 0} asistencias`;
  } catch (err) {
    console.error("Error cargando hora pico", err);
  }
}

/* ================== GRÁFICO ================== */

let chart;

async function cargarGrafico() {
  const mesInput = document.getElementById("filtroMesAsistencias");
  if (!mesInput) return;
  const mes = mesInput.value;
  if (!mes) return;

  try {
    const res = await authFetch(`${API_URL}/estadisticas?mes=${mes}`);
    const data = await res.json();

    if (!data || data.length === 0) return;

    // 👉 Construir fechas locales correctas para evitar desfase
    const fechas = data.map(d => {
      const [year, month, day] = d.fecha.split("-").map(Number);
      return new Date(year, month - 1, day); // hora local
    });

    const labels = fechas.map(d => d.getDate()); // solo día para el eje x
    const values = data.map(d => d.totalAsistencias);

    const ctx = document.getElementById("AsistenciasDiaChart");

    if (chart) chart.destroy();

    // Crear gradiente para el fill
    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, "rgba(255, 140, 50, 0.3)");
    gradient.addColorStop(0.5, "rgba(255, 140, 50, 0.1)");
    gradient.addColorStop(1, "rgba(255, 140, 50, 0)");

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Asistencias",
            data: values,
            borderColor: "#FF8C32",
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#FF8C32",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false
        },

        plugins: {
          legend: { display: false },

          tooltip: {
            backgroundColor: "rgba(10,10,10,0.95)",
            borderColor: "#FF8C32",
            borderWidth: 1,
            titleColor: "#FF8C32",
            bodyColor: "#e5e5e5",
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) => {
                const i = items[0].dataIndex;
                return new Intl.DateTimeFormat("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                }).format(fechas[i]);
              },
              label: (item) => `📊 ${item.parsed.y} asistencias`
            }
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#9ca3af",
              font: { size: 11 },
              padding: 8
            },
            grid: {
              color: "rgba(255,255,255,0.05)",
              drawBorder: false
            },
            border: { display: false }
          },
          x: {
            ticks: {
              color: "#9ca3af",
              font: { size: 11 },
              maxRotation: 0,
              callback: (value, index) => {
                const day = labels[index];
                return day === 1 || day % 7 === 0 || day === labels[labels.length - 1] ? day : "";
              }
            },
            grid: { display: false },
            border: { display: false }
          }
        },

        animation: {
          duration: 800,
          easing: "easeOutCubic"
        }
      }
    });

  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar gráfico");
  }
}


/* ================== UTIL ================== */

function mesActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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






