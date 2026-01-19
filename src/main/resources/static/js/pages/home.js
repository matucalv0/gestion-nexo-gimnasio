import { checkAuth, logout } from "../auth/auth.js";

checkAuth();

document.addEventListener("DOMContentLoaded", () => {
  const go = page => window.location.href = page;

  document.getElementById("btnLogout").addEventListener("click", logout);

  document.getElementById("btnSocios").onclick = () => go("socios.html");
  document.getElementById("btnAsistencias").onclick = () => go("asistencias.html");
  document.getElementById("btnPagos").onclick = () => go("pagos.html");
  document.getElementById("btnMembresias").onclick = () => go("membresias.html");
  document.getElementById("btnProductos").onclick = () => go("productos.html");

  // Accesos rápidos
  document.getElementById("quickAsistencia").onclick = () => go("asistencia.html");
  document.getElementById("quickSocio").onclick = () => go("registrar-socio.html");
  document.getElementById("quickPago").onclick = () => go("registrar-pago.html");
});




