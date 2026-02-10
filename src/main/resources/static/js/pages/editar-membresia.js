import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

const API_URL = "/membresias";

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editarMembresiaForm");
    const btnHome = document.getElementById("btnHome");
    const btnLogout = document.getElementById("btnLogout");

    btnHome.addEventListener("click", () => window.location.href = "membresias.html");
    btnLogout.addEventListener("click", logout);

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        Alerta.error("Plan inválido");
        return;
    }

    await cargarMembresia(id);

    form.addEventListener("submit", (e) => editarMembresia(e, id));

    async function cargarMembresia(id) {
        try {
            const res = await authFetch(`${API_URL}/${id}`);
            const m = await res.json();

            form.nombre.value = m.nombre;
            form.tipoMembresia.value = m.tipoMembresia;
            form.duracionDias.value = m.duracionDias;
            form.asistenciasPorSemana.value = m.asistenciasPorSemana ?? "";
            form.precioSugerido.value = m.precioSugerido;
        } catch {
            Alerta.error("Error al cargar plan");
        }
    }

    async function editarMembresia(e, id) {
        e.preventDefault();
        limpiarErrores();

        const data = {
            nombre: form.nombre.value.trim(),
            tipoMembresia: form.tipoMembresia.value,
            duracionDias: Number(form.duracionDias.value),
            asistenciasPorSemana: form.asistenciasPorSemana.value ? Number(form.asistenciasPorSemana.value) : null,
            precioSugerido: Number(form.precioSugerido.value)
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

            Alerta.success("Plan actualizado correctamente");

        } catch {
            Alerta.error("No se pudo conectar con el servidor");
        }
    }

    function manejarErrores(res, body) {
        if (res.status === 400 && body?.errors) {
            mostrarErroresPorCampo(body.errors);
            return;
        }

        const mensaje = body.message || "Error al editar plan";
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
