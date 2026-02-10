import { checkAuth } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();
const API_URL = "/socios";

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const dni = params.get("dni");

    if (!dni) {
        Alerta.error("Socio inválido");
        return;
    }

    cargarKPIs(dni);
    cargarSocio(dni);
    cargarMembresiaVigente(dni);
    cargarRutinaActiva(dni);

    // Botones
    document.getElementById("btnVolver").addEventListener("click", () => window.location.href = "socios.html");
    document.getElementById("btnEditar").addEventListener("click", () => window.location.href = `editar-socio.html?dni=${dni}`);
    document.getElementById("btnRegistrarPago").addEventListener("click", () => window.location.href = `registrar-pago.html?dni=${dni}&cuota=true`);
    document.getElementById("btnRegistrarAsistencia").addEventListener("click", () => { window.location.href = `asistencia.html?dni=${dni}&asistencia=true`; });

});

async function cargarKPIs(dni) {
    try {
        const resSocio = await authFetch(`${API_URL}/${dni}`);
        const socio = await resSocio.json();

        const activoRes = await authFetch(`${API_URL}/activo-mes?dni=${dni}`);
        const activo = await activoRes.json();

        const estadoEl = document.getElementById("kpiEstado").querySelector("p:nth-child(2)");
        estadoEl.textContent = activo ? "Activo" : "Inactivo";
        estadoEl.className = `text-lg font-bold ${activo ? 'text-green-500' : 'text-red-500'}`;

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
            Alerta.warning("La membresía del socio está vencida.");
        } else {
            console.error("Error al cargar la membresía:", err);
            Alerta.error("Error al cargar la membresía");
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

async function cargarRutinaActiva(dni) {
    const container = document.getElementById("rutinaContainer");
    container.innerHTML = "";

    try {
        const res = await authFetch(`${API_URL}/${dni}/rutina-activa`);
        if (!res.ok) {
            container.innerHTML = '<p class="text-gray-500">No hay rutina activa asignada</p>';
            return;
        }

        const rutina = await res.json();

        // Si solo retorna un mensaje, no hay rutina
        if (rutina.mensaje) {
            container.innerHTML = '<p class="text-gray-500">' + rutina.mensaje + '</p>';
            return;
        }

        const campos = [
            { label: "Nombre", valor: rutina.nombre || "—" },
            { label: "Profesor", valor: rutina.nombreEmpleado || "—" },
            { label: "Fecha", valor: rutina.fecha ? new Date(rutina.fecha).toLocaleDateString() : "—" },
            { label: "Descripción", valor: rutina.descripcion || "—" },
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

        // Botón para ver detalles
        const btnContainer = document.createElement("div");
        btnContainer.className = "col-span-full";
        btnContainer.innerHTML = `
            <button onclick="window.location.href='ver-rutina.html?id=${rutina.idRutina}'" 
                class="w-full bg-[var(--orange)] hover:bg-orange-600 text-black font-semibold px-4 py-2 rounded-md">
                Ver rutina completa
            </button>
        `;
        container.appendChild(btnContainer);

    } catch (err) {
        console.error("Error al cargar la rutina activa:", err);
        container.innerHTML = '<p class="text-gray-500">Error al cargar la rutina</p>';
    }
}




/* ===== DETALLES SOCIO Y MEMBRESÍA ===== */
async function cargarSocio(dni) {
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
        Alerta.error("Error al cargar los datos del socio");
    }
}




