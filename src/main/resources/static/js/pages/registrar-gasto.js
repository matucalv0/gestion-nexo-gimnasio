import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();

document.addEventListener("DOMContentLoaded", async () => {

    await cargarMediosPago();

    btnHome.addEventListener("click", () => window.location.href = "home.html");
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
    limpiarAlertas();

    if (!categoria.value || !monto.value || !medioPago.value)
        return mostrarAlerta({
            mensaje: "Complete todos los campos obligatorios",
            tipo: "danger"
        });

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
            return mostrarAlerta({ mensaje, tipo: "danger" });
        }

        mostrarAlerta({
            mensaje: "Gasto registrado correctamente",
            tipo: "success"
        });

        gastoForm.reset();

    } catch {
        mostrarAlerta({
            mensaje: "No se pudo conectar con el servidor",
            tipo: "danger"
        });
    }
}
