import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { renderPagination } from "../ui/pagination.js";
import { formatDateTime } from "../utils/date-utils.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

const API_URL = "/asistencias";

// Estado paginación
let currentPage = 0;
const pageSize = 20;

export function init() {
  const tablaBody = document.getElementById("tablaAsistenciasBody");

  // Filtros
  const inputBusqueda = document.getElementById("inputBusqueda");
  const inputDesde = document.getElementById("filtroDesde");
  const inputHasta = document.getElementById("filtroHasta");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiarFiltros");

  // Filtro Mes (solo gráfico)
  // Leer parámetros URL (para redirección desde dashboard y asistencias)
  const params = getRouteParams();
  const initDate = params.get("date");
  const forceFocus = params.get("focus");
  const inputMes = document.getElementById("filtroMesAsistencias");

  // Inicializar fechas (últimos 30 días)
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  if (inputHasta) inputHasta.value = hoy.toISOString().split("T")[0];
  if (inputDesde) inputDesde.value = hace30dias.toISOString().split("T")[0];

  document
    .getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

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
    if (inputBusqueda) inputBusqueda.value = "";
    if (inputDesde) inputDesde.value = "";
    if (inputHasta) inputHasta.value = "";
    currentPage = 0;
    cargarAsistencias(tablaBody);
  });

  // set mes actual por defecto para el gráfico
  if (inputMes) inputMes.value = mesActualISO();

  // listener: el mes impacta SOLO en el gráfico
  inputMes?.addEventListener("change", () => {
    cargarGrafico();
  });

  // carga inicial
  cargarAsistencias(tablaBody);
  cargarKPIs();
  cargarGrafico();
}

export function destroy() {
  if (chart) chart.destroy();
}

/* ================== ASISTENCIAS (TABLA) ================== */

async function cargarAsistencias(tablaBody) {
  try {
    if (!tablaBody) return;

    const q = document.getElementById("inputBusqueda")?.value || "";
    const desde = document.getElementById("filtroDesde")?.value || "";
    const hasta = document.getElementById("filtroHasta")?.value || "";

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
      },
    );
  } catch (err) {
    console.error(err);
    Alerta.error("Error al cargar asistencias");
  }
}

function renderTabla(tablaBody, asistencias) {
  const emptyState = document.getElementById("emptyStateAsistencias");

  // Limpiar filas existentes (excepto el empty state)
  const rows = tablaBody.querySelectorAll("tr:not(#emptyStateAsistencias)");
  rows.forEach((row) => row.remove());

  if (!asistencias || asistencias.length === 0) {
    // Mostrar empty state
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  // Ocultar empty state y mostrar datos
  if (emptyState) emptyState.classList.add("hidden");

  asistencias.forEach((a, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("animate-fade-in-up", "hover:bg-[#161616]", "transition");
    tr.style.animationDelay = `${index * 50}ms`;

    tr.innerHTML = `
      <td class="py-4 px-8 font-medium align-middle">${a.nombre}</td>
      <td class="py-4 px-8 text-gray-500 font-mono text-right align-middle">${a.dni}</td>
      <td class="py-4 px-8 text-gray-400 text-right align-middle tabular-nums">${formatDateTime(a.fechaHora)}</td>
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

    document.getElementById("kpiTotalAsistencias").textContent =
      stats.totalAsistencias ?? 0;
    renderVariacion("varTotalAsistencias", stats.variacionAsistencias);

    document.getElementById("kpiPromedio").textContent =
      stats.promedioAsistencias ?? 0;
    renderVariacion("varPromedio", stats.variacionPromedio);

    document.getElementById("kpiSociosActivosTotal").textContent =
      stats.sociosActivos ?? 0;
    renderVariacion("varSociosActivos", stats.variacionSocios);

    const ul = document.getElementById("kpiSociosActivos");
    ul.innerHTML = "";

    if (!stats.sociosMasActivos || stats.sociosMasActivos.length === 0) {
      ul.innerHTML = `<li class="text-gray-500 text-sm">Sin datos para este mes</li>`;
      return;
    }

    stats.sociosMasActivos.forEach((s) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center gap-3 p-3 rounded-lg border border-[#222] bg-[#111] hover:border-[#333] transition-colors";

      // Avatar dummy basado en inicial
      const initial = s.nombre ? s.nombre.charAt(0).toUpperCase() : "?";
      const hue =
        Array.from(s.nombre || "X").reduce(
          (acc, char) => acc + char.charCodeAt(0),
          0,
        ) % 360;

      li.innerHTML = `
        <div class="w-10 h-10 rounded bg-[#1a1a1a] flex flex-shrink-0 items-center justify-center font-bold text-white border border-[#333] relative overflow-hidden">
           <div class="absolute inset-x-0 bottom-0 h-1/2 opacity-20" style="background-color: hsl(${hue}, 70%, 50%)"></div>
           <span class="z-10">${initial}</span>
        </div>
        <div class="flex flex-col min-w-0 flex-1">
          <p class="text-sm font-medium text-white truncate">${s.nombre}</p>
          <p class="text-xs text-gray-500 font-mono mt-0.5 truncate">DNI: ${s.dni}</p>
        </div>
      `;
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

    document.getElementById("kpiHoraPico").textContent =
      data.rangoHorario || "--:--";
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
    const fechas = data.map((d) => {
      const [year, month, day] = d.fecha.split("-").map(Number);
      return new Date(year, month - 1, day); // hora local
    });

    const labels = fechas.map((d) => d.getDate()); // solo día para el eje x
    const values = data.map((d) => d.totalAsistencias);

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
            borderColor: "rgba(255, 140, 50, 0.8)",
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#FF8C32",
            pointHoverBorderColor: "#fff",
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

        plugins: {
          legend: { display: false },

          tooltip: {
            backgroundColor: "rgba(10, 10, 10, 0.95)",
            titleColor: "rgba(255, 255, 255, 0.9)",
            bodyColor: "rgba(255, 140, 50, 1)",
            titleFont: {
              size: 13,
              family: "'Inter', sans-serif",
              weight: "normal",
            },
            bodyFont: {
              size: 14,
              family: "'JetBrains Mono', monospace",
              weight: "bold",
            },
            padding: 12,
            cornerRadius: 6,
            displayColors: false,
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              title: (items) => {
                const i = items[0].dataIndex;
                return new Intl.DateTimeFormat("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(fechas[i]);
              },
              label: (item) => `${item.parsed.y} asistencias`,
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#6b7280",
              font: { size: 11, family: "'JetBrains Mono', monospace" },
              padding: 12,
              maxTicksLimit: 6,
            },
            grid: {
              display: false,
              drawBorder: false,
            },
            border: { display: false },
          },
          x: {
            ticks: {
              color: "#6b7280",
              font: { size: 11, family: "'Inter', sans-serif" },
              padding: 10,
              maxRotation: 0,
              callback: (value, index) => {
                const day = labels[index];
                return day === 1 ||
                  day % 7 === 0 ||
                  day === labels[labels.length - 1]
                  ? day
                  : "";
              },
            },
            grid: {
              display: false,
              drawBorder: false,
            },
            border: { display: false },
          },
        },

        animation: {
          duration: 800,
          easing: "easeOutCubic",
        },
      },
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
