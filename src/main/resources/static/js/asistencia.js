checkAuth();

const input = document.getElementById("inputBusqueda");
const btn = document.getElementById("btnRegistrar");
const resultado = document.getElementById("resultado");
const resultadosBusqueda = document.getElementById("resultadosBusqueda");
let asistenciasDisponibles = null;

let socioSeleccionado = null;

btn.addEventListener("click", registrar);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") registrar();
});

input.addEventListener("input", async () => {
  const valor = input.value.trim();
  resultadosBusqueda.innerHTML = '';
  socioSeleccionado = null;

  if (!valor) return;

  try {
    const socios = await authFetch(`/socios/search?q=${encodeURIComponent(valor)}`);
    if (!socios.ok) throw "Error al buscar socios";
    const data = await socios.json();

    // Siempre mostrar todos los resultados para que el usuario elija
    data.forEach(socio => {
      const div = document.createElement("div");
      div.textContent = `${socio.nombre} - ${socio.dni}`;
      div.addEventListener("click", () => {
        socioSeleccionado = socio;
        input.value = `${socio.nombre} - ${socio.dni}`;
        mostrarInfoSocio(socio);
        resultadosBusqueda.innerHTML = '';
      });
      resultadosBusqueda.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
});

async function registrar() {
  resultado.textContent = "";
  resultado.className = "resultado";

  if (!socioSeleccionado) {
    resultado.textContent = "Seleccione un socio primero.";
    resultado.classList.add("warn");
    return;
  }

  if (asistenciasDisponibles !== null && asistenciasDisponibles <= 0) {
    resultado.textContent = "No quedan asistencias disponibles.";
    resultado.classList.add("warn");
    return;
  }

  try {
    const res = await authFetch(`/socios/${socioSeleccionado.dni}/asistencias`, {
      method: "POST"
    });

    if (!res.ok) {
      const mensaje = await res.text();

      if (res.status === 404) throw mensaje || "Socio no encontrado";
      if (res.status === 409) throw mensaje || "Operación no permitida";
      throw "Error al registrar asistencia";
}

    const data = await res.json();

    const fecha = new Date(data.fecha_hora).toLocaleDateString("es-AR");
    resultado.textContent = `✔ Asistencia registrada (${fecha})`;

    resultado.classList.add("ok");

    // actualizar info ANTES de limpiar
    await mostrarInfoSocio(socioSeleccionado);
    await mostrarInfoMembresia(socioSeleccionado);

    input.value = "";
    socioSeleccionado = null;
    resultadosBusqueda.innerHTML = '';

  } catch (err) {
    resultado.textContent = err;
    resultado.classList.add("warn");
  }
}


async function mostrarInfoSocio(socio) {
  const info = document.getElementById("infoSocio");
  info.textContent = "Cargando información...";

  try {
    const res = await authFetch(`/socios/${socio.dni}/asistencias-disponibles`);
    if (!res.ok) throw "No se pudo obtener asistencias disponibles";

    const disponibles = await res.json();
    asistenciasDisponibles = disponibles; 

    info.innerHTML = `
      <strong>${socio.nombre}</strong><br>
      DNI: ${socio.dni}<br>
      Asistencias disponibles: <strong>${disponibles}</strong>
    `;
  } catch (err) {
    asistenciasDisponibles = null;
    info.textContent = err;
  }
}

async function mostrarInfoMembresia(socio) {
  const info = document.getElementById("infoMembresia");
  info.textContent = "Cargando información...";

  try {
    const res = await authFetch(`/socios/${socio.dni}/membresia-vigente`);
    if (!res.ok) {
      const msg = await res.text();
      throw msg || "No se pudo obtener ninguna membresía";
      }


    const membresia = await res.json();

    info.innerHTML = `
      <strong>Membresía activa</strong><br>
      Tipo: ${membresia.tipo}<br>
      Vence: ${new Date(membresia.vencimiento).toLocaleDateString("es-AR")}<br>
    `;
  } catch (err) {
    info.textContent = typeof err === "string"
      ? err
      : "Error al cargar la membresía";
  }
}



function volverHome() {
  window.location.href = "home.html";
}
