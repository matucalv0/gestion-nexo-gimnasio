import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

document.addEventListener("DOMContentLoaded", async () => {

    await cargarMediosPago();

    btnHome.addEventListener("click", () => history.back());
    btnLogout.addEventListener("click", logout);

    gastoForm.addEventListener("submit", registrarGasto);
});

/* ================== CARGAS ================== */
async function cargarMediosPago() {
    const res = await authFetch("/mediosdepago");
    const data = await res.json();

    medioPago.innerHTML = `<option value="">Seleccione...</option>`;
    data.forEach(mp =>
        medioPago.innerHTML += `<option value="${mp.idMedioPago}">${mp.nombre}</option>`
    );
}


/* ================== SUBMIT ================== */
async function registrarGasto(e) {
    e.preventDefault();

    if (!categoria.value || !monto.value || !medioPago.value)
        return Alerta.warning("Complete todos los campos obligatorios");

    const data = {
        categoria: categoria.value,
        monto: Number(monto.value),
        proveedor: descripcion.value || null,
        idMedioPago: Number(medioPago.value)
    };

    try {
        const res = await authFetch("/gastos", {
            method: "POST",
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            let mensaje = "Error al registrar gasto";
            try {
                const err = await res.json();
                mensaje = err.message || mensaje;
            } catch { }
            return Alerta.error(mensaje);
        }

        Alerta.success("Gasto registrado correctamente");

        gastoForm.reset();

    } catch {
        Alerta.error("No se pudo conectar con el servidor");
    }
}
