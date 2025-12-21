checkAuth();

document.getElementById("logoutBtn")
  .addEventListener("click", logout);

function irASocios() {
  window.location.href = "socios.html";
}

function registrarAsistencia() {
  window.location.href = "asistencia.html";
}

function irAPagos() {
  window.location.href = "pagos.html";
}

function irAMembresias() {
  window.location.href = "membresias.html";
}
