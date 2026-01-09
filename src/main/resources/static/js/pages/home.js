import { checkAuth, logout } from "../auth/auth.js";

checkAuth();

document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btnLogout");
  const btnSocios = document.getElementById("btnSocios");
  const btnAsistencias = document.getElementById("btnAsistencias");
  const btnPagos = document.getElementById("btnPagos");
  const btnMembresias = document.getElementById("btnMembresias");

  btnLogout.addEventListener("click", logout);

  btnSocios.addEventListener("click", () => {
    window.location.href = "socios.html";
  });

  btnAsistencias.addEventListener("click", () => {
    window.location.href = "asistencias.html";
  });

  btnPagos.addEventListener("click", () => {
    window.location.href = "pagos.html";
  });

  btnMembresias.addEventListener("click", () => {
    window.location.href = "membresias.html";
  });
});

