import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { mostrarAlerta, limpiarAlertas } from "../ui/alerta.js";

checkAuth();
const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const dni = params.get("dni");

    if (!dni) {
        mostrarAlerta({ mensaje: "Socio inválido", tipo: "danger" });
        return;
    }

    cargarKPIs(dni);
    cargarSocio(dni);
    cargarMembresiaVigente(dni);

    // Botones
    document.getElementById("btnVolver").addEventListener("click", () => window.location.href = "socios.html");
    document.getElementById("btnEditar").addEventListener("click", () => window.location.href = `editar-socio.html?dni=${dni}`);
    document.getElementById("btnRegistrarPago").addEventListener("click", () => window.location.href = `registrar-pago.html?dni=${dni}&cuota=true`);
});

async function cargarKPIs(dni) {
    try {
        const resSocio = await authFetch(`${API_URL}/${dni}`);
        const socio = await resSocio.json();

        const estadoEl = document.getElementById("kpiEstado").querySelector("p:nth-child(2)");
        estadoEl.textContent = socio.activo ? "Activo" : "Inactivo";
        estadoEl.className = `text-lg font-bold ${socio.activo ? 'text-green-500' : 'text-red-500'}`;

        const resVisitas = await authFetch(`/asistencias/estadisticas/semana-actual?q=${dni}`);
        const visitas = await resVisitas.json();
        document.getElementById("kpiVisitas").querySelector("p:nth-child(2)").textContent = visitas ?? 0;

        // Membresía y vencimiento
        try {
            const resMembresia = await authFetch(`${API_URL}/${dni}/membresia-vigente`);
            if (resMembresia.status === 409) throw { status: 409 }; // lanzamos objeto controlado
            const m = await resMembresia.json();

            document.getElementById("kpiMembresia").querySelector("p:nth-child(2)").textContent = m.tipo;

            const resVencimiento = await authFetch(`${API_URL}/dias-para-vencer-membresiavigente?q=${dni}`);
            const dias = await resVencimiento.json();
            document.getElementById("kpiVencimiento").querySelector("p:nth-child(2)").textContent = dias + ' dias';
            document.getElementById("kpiVencimiento").style.display = "block";

        } catch (err) {
            if (err.status === 409) { // ahora sí lo detectamos
                document.getElementById("kpiMembresia").querySelector("p:nth-child(2)").textContent = "Vencida";
                document.getElementById("kpiVencimiento").style.display = "none";
            } else {
                console.error("Error al cargar KPIs de membresía:", err);
            }
        }

    } catch (err) {
        console.error("Error al cargar KPIs:", err);
    }
}

async function cargarMembresiaVigente(dni) {
    limpiarAlertas();
    const container = document.getElementById("membresiaContainer");
    container.innerHTML = "";

    try {
        const res = await authFetch(`${API_URL}/${dni}/membresia-vigente`);
        if (res.status === 409) throw { status: 409 };
        const m = await res.json();

        renderMembresiaCard(container, m.tipo, m.tipoMembresia, "Vigente",
            m.vencimiento ? m.vencimiento : "-"
        );

    } catch (err) {
        if (err.status === 409) {
            mostrarAlerta({
                mensaje: "La membresía del socio está vencida.",
                tipo: "warning",
                contenedor: document.getElementById("alert-container")
            });
        } else {
            console.error("Error al cargar la membresía:", err);
            mostrarAlerta({ mensaje: "Error al cargar la membresía", tipo: "danger" });
        }
    }
}


function renderMembresiaCard(container, nombre, tipo, estado, vencimiento) {
    const campos = [
        { label: "Nombre", valor: nombre || "—" },
        { label: "Tipo", valor: tipo || "—" },
        { label: "Estado", valor: estado },
        { label: "Vencimiento", valor: vencimiento }
    ];

    campos.forEach(c => {
        const card = document.createElement("div");
        card.className = `
            border border-[var(--input-border)]
            bg-[#121212]
            rounded-lg
            p-4
            hover:border-[var(--orange)]
            transition
        `;
        card.innerHTML = `
            <p class="text-xs text-gray-400">${c.label}</p>
            <p class="text-lg font-bold text-[var(--beige)]">${c.valor}</p>
        `;
        container.appendChild(card);
    });
}




/* ===== DETALLES SOCIO Y MEMBRESÍA ===== */
async function cargarSocio(dni) {
    limpiarAlertas();
    const container = document.getElementById("infoSocio");
    container.innerHTML = "";

    try {
        const res = await authFetch(`${API_URL}/${dni}`);
        const socio = await res.json();

        const campos = [
            { label: "Nombre", valor: socio.nombre },
            { label: "DNI", valor: socio.dni },
            { label: "Teléfono", valor: socio.telefono ?? "-" },
            { label: "Email", valor: socio.email ?? "-" },
            { label: "Estado", valor: socio.activo ? "Activo" : "Inactivo" },
        ];

        campos.forEach(c => {
            const card = document.createElement("div");
            card.className = `
        border border-[var(--input-border)]
        bg-[#121212]
        rounded-lg
        p-4
        hover:border-[var(--orange)]
        transition
      `;
            card.innerHTML = `
        <p class="text-xs text-gray-400">${c.label}</p>
        <p class="text-lg font-bold text-[var(--beige)]">${c.valor}</p>
      `;
            container.appendChild(card);
        });

    } catch {
        mostrarAlerta({ mensaje: "Error al cargar los datos del socio", tipo: "danger" });
    }
}




