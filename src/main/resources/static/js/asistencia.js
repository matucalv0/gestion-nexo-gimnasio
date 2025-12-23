checkAuth();

const input = document.getElementById("inputBusqueda");
const btn = document.getElementById("btnRegistrar");
const resultado = document.getElementById("resultado");
const resultadosBusqueda = document.getElementById("resultadosBusqueda");

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
      div.textContent = `${socio.dni} - ${socio.nombre}`;
      div.addEventListener("click", () => {
        socioSeleccionado = socio;
        input.value = `${socio.dni} - ${socio.nombre}`;
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

  try {
    const res = await authFetch(`/socios/${socioSeleccionado.dni}/asistencias`, {
      method: "POST"
    });

    if (res.status === 404) throw "Socio no encontrado";
    if (res.status === 409) throw "Membresía vencida";
    if (!res.ok) throw "Error al registrar asistencia";

    const data = await res.json();
    resultado.textContent = `✔ ${data.dniSocio} ${data.fecha_hora} — asistencia registrada`;
    resultado.classList.add("ok");
    input.value = "";
    socioSeleccionado = null;
    resultadosBusqueda.innerHTML = '';
  } catch (err) {
    resultado.textContent = err;
    resultado.classList.add("warn");
  }
}

function volverHome() {
  window.location.href = "home.html";
}
