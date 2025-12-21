checkAuth()

const API_URL = "http://localhost:8080/socios";
const tablaBody = document.querySelector("#tablaSocios tbody");
const busquedaInput = document.getElementById("busquedaInput");

document.addEventListener("DOMContentLoaded", () => {
  cargarSocios();
});


function volverHome() {
  window.location.href = "home.html";
}

function cargarSocios() {
  authFetch(API_URL)
    .then(res => res.json())
    .then(data => renderSocios(data))
    .catch(err => {
      console.error("Error al cargar socios", err);
      alert("Error al cargar socios");
    });
}


function renderSocios(socios) {
  tablaBody.innerHTML = "";

  if (!socios || socios.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5">No hay socios</td>
      </tr>
    `;
    return;
  }

  socios.forEach(socio => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${socio.dni}</td>
      <td>${socio.nombre}</td>
      <td>${socio.telefono}</td>
      <td>${socio.mail}</td>
      <td class="${socio.activo ? "estado-activo" : "estado-inactivo"}">
          ${socio.activo ? "Activo" : "Inactivo"}
      </td>
      <td>
        <button onclick="verDetalle('${socio.dni}')">Ver</button>
      </td>
    `;

    tablaBody.appendChild(tr);
  });
}


function buscarSocios() {
  const valor = busquedaInput.value.trim();

  if (valor === "") {
    cargarSocios();
    return;
  }

  authFetch(`${API_URL}/${valor}`)
    .then(res => {
      if (res.status === 404) return null;
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        renderSocios(data);
      } else if (data) {
        renderSocios([data]);
      } else {
        renderSocios([]);
      }
    })
    .catch(err => {
      console.error("Error en búsqueda", err);
      alert("Error en búsqueda");
    });
}


