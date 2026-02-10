import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/productos";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("editarProductoForm");
  const btnHome = document.getElementById("btnHome");
  const btnLogout = document.getElementById("btnLogout");

  btnHome.addEventListener("click", () => window.location.href = "productos.html");
  btnLogout.addEventListener("click", logout);

  const params = new URLSearchParams(window.location.search);
  const idProducto = params.get("id");

  if (!idProducto) {
    Alerta.error("Producto inválido");
    return;
  }

  await cargarProducto(idProducto);

  form.addEventListener("submit", (e) => editarProducto(e, idProducto));

  /* ===== Funciones ===== */

  async function cargarProducto(id) {
    try {
      const res = await authFetch(`${API_URL}/${id}`);
      const producto = await res.json();

      form.nombre.value = producto.nombre;
      form.precioSugerido.value = producto.precioSugerido;
      form.stock.value = producto.stock;

    } catch {
      Alerta.error("Error al cargar producto");
    }
  }

  async function editarProducto(e, id) {
    e.preventDefault();

    limpiarErrores();

    const data = {
      nombre: form.nombre.value.trim(),
      precioSugerido: Number(form.precioSugerido.value),
      stock: Number(form.stock.value)
    };

    try {
      const res = await authFetch(`${API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });

      const body = await res.json();

      if (!res.ok) {
        manejarErrores(res, body);
        return;
      }

      Alerta.success("Producto actualizado correctamente");

    } catch {
      Alerta.error("No se pudo conectar con el servidor");
    }
  }

  function manejarErrores(res, body) {
    if (res.status === 400 && body?.errors) {
      mostrarErroresPorCampo(body.errors);
      return;
    }

    const mensaje = body.message || "Error al editar producto";
    if (res.status >= 500) Alerta.error(mensaje);
    else Alerta.warning(mensaje);
  }

  function limpiarErrores() {
    form.querySelectorAll(".error").forEach(e => e.textContent = "");
  }

  function mostrarErroresPorCampo(errors) {
    Object.entries(errors).forEach(([campo, mensaje]) => {
      const input = form.querySelector(`[name="${campo}"]`);
      if (!input) return;
      const span = input.nextElementSibling;
      if (span) span.textContent = mensaje;
    });
  }
});
