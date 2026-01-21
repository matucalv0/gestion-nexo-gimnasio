import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

const API_URL = "/asistencias";

document.addEventListener("DOMContentLoaded", () => {
  limpiarAlertas();

  const tablaBody = document.getElementById("tablaAsistenciasBody");
  const busquedaInput = document.getElementById("inputBusqueda");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnHome = document.getElementById("btnHome");

  const inputMes = document.getElementById("filtroMesAsistencias");

  btnHome?.addEventListener("click", () => window.location.href = "home.html");

  btnBuscar?.addEventListener("click", () =>
    cargarAsistencias(tablaBody, busquedaInput.value)
  );

  busquedaInput?.addEventListener("input", () =>
    cargarAsistencias(tablaBody, busquedaInput.value)
  );

  // set mes actual por defecto
  inputMes.value = mesActualISO();

  // listeners
  inputMes.addEventListener("change", () => {
    cargarKPIs();
    cargarGrafico();
  });

  // carga inicial
  cargarAsistencias(tablaBody);
  cargarKPIs();
  cargarGrafico();
});

/* ================== ASISTENCIAS (TABLA) ================== */

async function cargarAsistencias(tablaBody, filtro = "") {
  try {
    const url =
      filtro.length >= 2
        ? `${API_URL}/search?q=${encodeURIComponent(filtro)}`
        : API_URL;

    const res = await authFetch(url);
    const asistencias = await res.json();

    renderTabla(tablaBody, asistencias);
  } catch (err) {
    console.error(err);
    mostrarAlerta({
      mensaje: "Error al cargar asistencias",
      tipo: "danger",
      contenedor: document.getElementById("alert-container"),
    });
  }
}

function renderTabla(tablaBody, asistencias) {
  tablaBody.innerHTML = "";

  if (!asistencias || asistencias.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="3" class="px-6 py-4 text-center text-gray-500">
          No se encontraron asistencias
        </td>
      </tr>`;
    return;
  }

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
  const mes = document.getElementById("filtroMesAsistencias").value;
  if (!mes) return;

  try {
    const res = await authFetch(`${API_URL}/estadisticas/mes`);
    const stats = await res.json();

    document.getElementById("kpiTotalAsistencias").textContent =
      stats.totalAsistencias ?? 0;

    document.getElementById("kpiPromedio").textContent =
      stats.promedioAsistencias ?? 0;

    document.getElementById("kpiSociosActivosTotal").textContent =
      stats.sociosActivos ?? 0;

    document.getElementById("kpiMaxAsistencias").textContent =
      stats.maxAsistencias ?? 0;

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
  } catch (err) {
    console.error(err);
    mostrarAlerta({
      mensaje: "Error al cargar KPIs",
      tipo: "danger",
      contenedor: document.getElementById("alert-container"),
    });
  }
}

/* ================== GRÁFICO ================== */

let chart;

async function cargarGrafico() {
  const mes = document.getElementById("filtroMesAsistencias").value;
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

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Asistencias",
            data: values,
            borderColor: "#ECD9BA",
            backgroundColor: "rgba(236,217,186,0.15)",
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#ECD9BA",
            pointHoverBackgroundColor: "#FFF1D6"
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

          title: {
            display: true,
            text: "Asistencias diarias del mes",
            color: "#ECD9BA",
            font: { size: 16, weight: "bold" },
            padding: { bottom: 12 }
          },

          tooltip: {
            backgroundColor: "rgba(15,15,15,0.95)",
            borderColor: "rgba(255,255,255,0.15)",
            borderWidth: 1,
            titleColor: "#ECD9BA",
            bodyColor: "#e5e5e5",
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
              label: (item) => `Asistencias: ${item.parsed.y}`
            }
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#e5e5e5",
              stepSize: 5
            },
            grid: {
              color: "rgba(255,255,255,0.06)"
            }
          },
          x: {
            ticks: {
              color: "#e5e5e5",
              callback: (value, index) => {
                // mostrar solo algunos días para no saturar
                const day = labels[index];
                return day === 1 || day % 5 === 0 || day === labels[labels.length - 1] ? day : "";
              }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },

        animation: {
          duration: 700,
          easing: "easeOutQuart"
        }
      }
    });

  } catch (err) {
    console.error(err);
    mostrarAlerta({
      mensaje: "Error al cargar gráfico",
      tipo: "danger",
      contenedor: document.getElementById("alert-container"),
    });
  }
}


/* ================== UTIL ================== */

function mesActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}






