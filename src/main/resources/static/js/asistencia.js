checkAuth();

const input = document.getElementById("inputBusqueda");
const btn = document.getElementById("btnRegistrar");
const resultado = document.getElementById("resultado");

btn.addEventListener("click", registrar);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") registrar();
});

function registrar() {
  const valor = input.value.trim();
  resultado.textContent = "";
  resultado.className = "resultado";

  if (!valor) return;

  authFetch(`/socios/${valor}/asistencias`, {
    method: "POST"
  })
    .then(res => {
      if (res.status === 404) throw "Socio no encontrado";
      if (res.status === 409) throw "Membresía vencida";
      if (!res.ok) throw "Error al registrar asistencia";
      return res.json();
    })
    .then(data => {
      resultado.textContent = `✔ ${data.dniSocio} ${data.fecha_hora} — asistencia registrada`;
      resultado.classList.add("ok");
      input.value = "";
    })
    .catch(err => {
      resultado.textContent = err;
      resultado.classList.add("warn");
    });
}

function volverHome() {
  window.location.href = "home.html";
}
