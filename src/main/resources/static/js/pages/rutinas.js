import { authFetch } from "../api/api.js";

document.addEventListener("DOMContentLoaded", () => {
    cargarRutinas();
});

// Keep cache for filtering
let rutinasCache = [];

export async function cargarRutinas() {
    const tbody = document.getElementById("tablaRutinasBody");
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>`;

    try {
        const res = await authFetch("/rutinas");

        if (res.ok) {
            rutinasCache = await res.json();
            renderTabla(rutinasCache);
            setupFiltros();
        } else {
            const errorText = await res.text();
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Error ${res.status} cargando rutinas</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Error de conexión</td></tr>`;
    }
}

function setupFiltros() {
    const input = document.getElementById("busquedaRutina");
    if (!input) return;

    input.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtradas = rutinasCache.filter(r => {
            const nombreSocio = r.nombreSocio ? r.nombreSocio.toLowerCase() : "";
            const dniSocio = r.dniSocio ? r.dniSocio.toLowerCase() : "";
            // Search in Name OR DNI
            return nombreSocio.includes(term) || dniSocio.includes(term);
        });
        renderTabla(filtradas);
    });
}

function renderTabla(rutinas) {
    const tbody = document.getElementById("tablaRutinasBody");
    tbody.innerHTML = "";

    if (!rutinas || rutinas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <span class="text-gray-500 text-lg">No se encontraron rutinas</span>
                         <a href="registrar-rutina.html" class="text-primary-500 hover:text-primary-400 text-sm font-semibold mt-2">
                            + Crear nueva rutina
                        </a>
                    </div>
                </td>
            </tr>`;
        return;
    }

    rutinas.forEach(r => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-white/5 transition-colors";

        const btnAsignados = `<button onclick="window.verSociosAsignados(${r.idRutina}, '${r.nombre}')" 
            class="text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition">
            Ver Asignados
        </button>`;

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">
                ${r.nombre}
                <div class="text-xs text-gray-500 font-normal truncate max-w-xs">${r.descripcion || ''}</div>
            </td>
            <td class="px-6 py-4">
                ${btnAsignados}
            </td>
            <td class="px-6 py-4 text-gray-400">
                <div class="flex flex-col">
                     <span class="text-white font-medium">${r.nombreEmpleado || 'Desconocido'}</span>
                     <span class="text-xs text-gray-500">${r.dniEmpleado}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <a href="ver-rutina.html?id=${r.idRutina}" class="text-gray-400 hover:text-white transition" title="Ver detalle">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <a href="registrar-rutina.html?id=${r.idRutina}" class="text-gray-400 hover:text-[var(--orange)] transition" title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </a>
                    <button onclick="window.eliminarRutina(${r.idRutina}, '${r.nombre}')" class="text-gray-400 hover:text-red-500 transition" title="Eliminar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.eliminarRutina = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la rutina "${nombre}"?\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const res = await authFetch(`/rutinas/${id}`, { method: 'DELETE' });
        if (res.ok) {
            cargarRutinas();
        } else {
            alert("Error al eliminar la rutina");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    }
};

// Global modal function
window.verSociosAsignados = async (idRutina, nombreRutina) => {
    // 1. Create/Get Modal
    let modal = document.getElementById("modalSocios");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalSocios";
        modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300";
        modal.innerHTML = `
            <div class="bg-[#121212] border border-[var(--input-border)] rounded-xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform duration-300">
                <div class="p-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
                    <h3 class="text-lg font-bold text-white">Socios con Rutina</h3>
                    <button id="closeModalSocios" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div class="p-5 max-h-[60vh] overflow-y-auto" id="modalSociosBody">
                    <p class="text-center text-gray-500">Cargando...</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close logic
        const close = () => {
            modal.classList.add("hidden", "opacity-0");
            modal.querySelector("div").classList.add("scale-95");
        };
        modal.querySelector("#closeModalSocios").onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };
    }

    // 2. Show Modal
    modal.classList.remove("hidden");
    // Force reflow
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");
    modal.querySelector("div").classList.remove("scale-95");

    const body = modal.querySelector("#modalSociosBody");
    const title = modal.querySelector("h3");
    title.textContent = `Socios: ${nombreRutina}`;
    body.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>';

    // 3. Fetch Data
    try {
        const res = await authFetch(`/rutinas/${idRutina}/socios`);
        if (!res.ok) throw new Error("Error al cargar socios");
        const socios = await res.json();

        if (socios.length === 0) {
            body.innerHTML = `<div class="text-center text-gray-500 py-4">Esta rutina no está asignada a ningún socio.</div>`;
            return;
        }

        body.innerHTML = `<div class="flex flex-col gap-2">
            ${socios.map(s => `
                <a href="socio-detalle.html?dni=${s.dni}" class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a] border border-[#2a2a2a] transition group">
                    <div class="flex flex-col">
                        <span class="text-white font-medium group-hover:text-[var(--orange)] transition-colors">${s.nombre}</span>
                        <span class="text-xs text-gray-500">${s.dni}</span>
                    </div>
                    <svg class="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </a>
            `).join('')}
        </div>`;

    } catch (e) {
        console.error(e);
        body.innerHTML = `<div class="text-center text-red-500 py-4">No se pudo cargar la lista de socios.</div>`;
    }
};
