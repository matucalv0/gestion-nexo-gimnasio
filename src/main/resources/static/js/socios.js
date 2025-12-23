checkAuth()

const API_URL = "/socios";
const tablaBody = document.querySelector("#tablaSocios tbody");
const busquedaInput = document.getElementById("busquedaInput");

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.id === "sociosPage") {
    cargarSocios();
  }
});


function volverHome() {
  window.location.href = "home.html";
}

function registrarSocio(){
 const form = document.getElementById("registrarSocioForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Se ejecutó el submit del formulario");

  // Recolectar datos del formulario
  const data = {
    nombre: document.getElementById("fullname").value,
    email: document.getElementById("email").value,
    telefono: document.getElementById("telefono").value,
    fechaNacimiento: document.getElementById("fechaNacimiento").value
  };

  try {
    // Usar authFetch para enviar la información
    const res = await authFetch("http://localhost:8080/socios", {
      method: "POST",
      body: JSON.stringify(data)
    });
    console.log(res.status, await res.text());

    if (!res.ok) {
      const errorData = await res.json();
      alert("Error al registrar socio: " + (errorData.message || res.statusText));
      return;
    }

    const responseData = await res.json();
    console.log("Socio registrado:", responseData);
    alert("Socio registrado correctamente!");
    form.reset(); // Limpiar el formulario
  } catch (err) {
    console.error(err);
    alert("Error al enviar los datos");
  }
});

}

function mostrarAltaSocio(){
  window.location.href = "registrar-socio.html";

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
      <td>${socio.email}</td>
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


