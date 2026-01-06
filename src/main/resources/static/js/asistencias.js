checkAuth();

const API_URL = "/asistencias";
const tablaBody = document.querySelector("#tablaAsistencias tbody");
const busquedaInput = document.getElementById("inputBusqueda");

// Buscar mientras se escribe
busquedaInput.addEventListener("input", buscarAsistencias);

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.id === "asistenciasPage") {
    cargarAsistencias();
  }
});

/* ===== Navegación ===== */
function volverHome() {
  window.location.href = "home.html";
}

function irARegistro() {
  window.location.href = "asistencia.html";
}

/* ===== Cargar asistencias ===== */
function cargarAsistencias() {
  authFetch(API_URL)
    .then(res => res.json())
    .then(data => renderAsistencias(data))
    .catch(err => {
      console.error("Error al cargar asistencias", err);
      alert("Error al cargar asistencias");
    });
}

/* ===== Renderizar tabla ===== */
function renderAsistencias(asistencias) {
  tablaBody.innerHTML = "";

  if (!asistencias || asistencias.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;">No se encontraron asistencias</td>
      </tr>
    `;
    return;
  }

  asistencias.forEach(a => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>${a.dni}</td>
      <td>${a.fecha_hora}</td>
    `;

    tablaBody.appendChild(tr);
  });
}

/* ===== Búsqueda dinámica ===== */
function buscarAsistencias() {
  const valor = busquedaInput.value.trim();

  if (valor.length < 2) {
    cargarAsistencias();
    return;
  }

  authFetch(`${API_URL}/search?q=${encodeURIComponent(valor)}`)
    .then(res => {
      if (!res.ok) return [];
      return res.json();
    })
    .then(data => renderAsistencias(data))
    .catch(err => {
      console.error("Error en búsqueda", err);
    });
}



