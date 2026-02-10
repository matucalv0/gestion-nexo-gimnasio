import { authFetch } from "../api/api.js";
import { getCurrentUser, checkAuth } from "../auth/auth.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

document.addEventListener("DOMContentLoaded", () => {
    init();
});

async function init() {
    // Cargar empleados y socios
    await cargarEmpleados();
    await cargarSocios();

    // Event listeners
    document.getElementById("btnSeleccionar").addEventListener("click", () => {
        document.getElementById("fileInput").click();
    });

    document.getElementById("fileInput").addEventListener("change", onArchivoSeleccionado);
    document.getElementById("btnImportar").addEventListener("click", importarRutina);
}

async function cargarEmpleados() {
    try {
        const res = await authFetch("/empleados");
        if (res.ok) {
            const data = await res.json();
            const empleados = data.content || data;
            const select = document.getElementById("selectEmpleado");

            empleados.forEach(emp => {
                const opt = document.createElement("option");
                opt.value = emp.dni;
                opt.textContent = `${emp.nombre} (${emp.dni})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error cargando empleados", e);
        Alerta.error("Error al cargar empleados");
    }
}

async function cargarSocios() {
    try {
        const res = await authFetch("/socios");
        if (res.ok) {
            const data = await res.json();
            const socios = data.content || data;
            const select = document.getElementById("selectSocio");

            socios.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.dni;
                opt.textContent = `${s.nombre} (${s.dni})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error cargando socios", e);
    }
}

function onArchivoSeleccionado(e) {
    const file = e.target.files[0];
    const btn = document.getElementById("btnImportar");

    if (!file) {
        document.getElementById("filePreview").classList.add("hidden");
        btn.disabled = true;
        return;
    }

    // Validar extensión
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
        Alerta.warning("Solo se permiten archivos Excel (.xlsx, .xls)");
        document.getElementById("fileInput").value = "";
        btn.disabled = true;
        return;
    }

    // Mostrar preview
    document.getElementById("fileName").textContent = file.name;
    document.getElementById("filePreview").classList.remove("hidden");
    btn.disabled = false;
}

async function importarRutina() {
    const file = document.getElementById("fileInput").files[0];
    const dniEmpleado = document.getElementById("selectEmpleado").value;
    const dniSocio = document.getElementById("selectSocio").value || null;

    if (!file) {
        Alerta.warning("Selecciona un archivo Excel");
        return;
    }

    if (!dniEmpleado) {
        Alerta.warning("Selecciona un profesor");
        return;
    }

    // Mostrar loading
    const btn = document.getElementById("btnImportar");
    const textOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin">⏳</span> Importando...`;

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dniEmpleado", dniEmpleado);
        if (dniSocio) formData.append("dniSocio", dniSocio);

        const res = await authFetch("/rutinas/importar", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            Alerta.success(`Rutina importada correctamente (ID: ${data.idRutina})`);
            setTimeout(() => {
                window.location.href = "rutinas.html";
            }, 2000);
        } else {
            const err = await res.json();
            Alerta.error("Error: " + (err.error || "No se pudo importar"));
            btn.disabled = false;
            btn.innerHTML = textOriginal;
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
        btn.disabled = false;
        btn.innerHTML = textOriginal;
    }
}
