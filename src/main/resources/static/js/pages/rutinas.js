import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { parseDate, formatDate } from "../utils/date-utils.js";

document.addEventListener("DOMContentLoaded", () => {
    cargarRutinas();
});

// Keep cache for filtering
let rutinasCache = [];

// State
const state = {
    plantillas: { page: 0, size: 5, totalPages: 0 },
    asignadas: { page: 0, size: 5, totalPages: 0 }
};

export async function cargarRutinas() {
    // Initial Load
    cargarPlantillas();
    cargarAsignadas();
}

// --- PLANTILLAS ---
async function cargarPlantillas(page = 0) {
    state.plantillas.page = page;
    const tbody = document.getElementById("tablaPlantillasBody");
    tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">Cargando plantillas...</td></tr>`;

    try {
        const res = await authFetch(`/rutinas/plantillas?page=${page}&size=${state.plantillas.size}`);
        if (res.ok) {
            const data = await res.json();
            state.plantillas.totalPages = data.totalPages;
            renderPlantillas(data.content);
            renderPagination("paginacionPlantillas", state.plantillas, cargarPlantillas);
        } else {
            tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-red-500">Error cargando plantillas</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-red-500">Error de conexión</td></tr>`;
    }
}

function renderPlantillas(plantillas) {
    const tbody = document.getElementById("tablaPlantillasBody");
    tbody.innerHTML = "";

    if (!plantillas || plantillas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">No hay plantillas importadas.</td></tr>`;
        return;
    }

    plantillas.forEach(r => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-white/5 transition-colors group";
        tr.innerHTML = `
            <td class="px-6 py-4">
                <span class="text-[var(--orange)] font-bold text-base">${r.nombre}</span>
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">
                ${r.descripcion || '-'}
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    <button onclick="window.mostrarVistaPrevia(${r.idRutina})" 
                        class="p-1.5 text-gray-400 hover:text-white transition" title="Vista rápida">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                    <a href="registrar-rutina.html?id=${r.idRutina}" 
                        class="p-1.5 text-gray-400 hover:text-[var(--orange)] transition" title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </a>
                    <button onclick="window.duplicarPlantilla(${r.idRutina}, '${r.nombre}')" 
                        class="p-1.5 text-gray-400 hover:text-secondary-500 transition" title="Duplicar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                    <button onclick="window.verSociosAsignados(${r.idRutina}, '${r.nombre}')" 
                        class="text-xs bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition">
                        Ver Usos
                    </button>
                    <button onclick="window.asignarRutina(${r.idRutina}, '${r.nombre}')" 
                        class="text-xs bg-primary-600/20 text-[var(--orange)] hover:bg-primary-600/40 px-3 py-1.5 rounded border border-primary-500/30 hover:border-primary-500 transition font-bold flex items-center gap-1">
                        + Asignar
                    </button>
                    <button onclick="window.eliminarRutina(${r.idRutina}, '${r.nombre}')" 
                        class="p-1.5 text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// --- ASIGNADAS ---
async function cargarAsignadas(page = 0) {
    state.asignadas.page = page;
    const tbody = document.getElementById("tablaRutinasBody");
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Cargando rutinas...</td></tr>`;

    try {
        const res = await authFetch(`/rutinas/asignadas?page=${page}&size=${state.asignadas.size}`);
        if (res.ok) {
            const data = await res.json();
            state.asignadas.totalPages = data.totalPages;
            state.asignadasCache = data.content; // Cache for local filter if needed, though backend search is better
            renderAsignadas(data.content);
            renderPagination("paginacionAsignadas", state.asignadas, cargarAsignadas);
            setupFiltros(); // Re-bind filter input
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error cargando rutinas</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error de conexión</td></tr>`;
    }
}

function renderAsignadas(rutinas) {
    const tbody = document.getElementById("tablaRutinasBody");
    tbody.innerHTML = "";

    if (!rutinas || rutinas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No hay rutinas asignadas.</td></tr>`;
        return;
    }

    // Group routines by socio to identify the most recent one (active)
    const rutinasPorSocio = {};
    rutinas.forEach(r => {
        if (r.dniSocio) {
            if (!rutinasPorSocio[r.dniSocio]) {
                rutinasPorSocio[r.dniSocio] = [];
            }
            rutinasPorSocio[r.dniSocio].push(r);
        }
    });

    // Find the most recent routine for each socio
    const rutinasActivas = new Set();
    Object.values(rutinasPorSocio).forEach(rutinasDelSocio => {
        const masReciente = rutinasDelSocio.reduce((prev, current) => {
            const prevDate = parseDate(prev.fecha);
            const currentDate = parseDate(current.fecha);
            return currentDate > prevDate ? current : prev;
        });
        rutinasActivas.add(masReciente.idRutina);
    });

    rutinas.forEach(r => {
        const tr = document.createElement("tr");
        const esActiva = rutinasActivas.has(r.idRutina);
        tr.className = `hover:bg-white/5 transition-colors ${esActiva ? 'bg-primary-500/5' : ''}`;

        // Format date
        const fecha = formatDate(r.fecha);

        tr.innerHTML = `
            <td class="px-6 py-4">
                 <div class="flex flex-col">
                     <span class="text-white font-bold">${r.nombreSocio || 'Socio desconocido'}</span>
                     <span class="text-xs text-gray-500">${r.dniSocio || ''}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-gray-300">${r.nombre}</span>
                    ${esActiva ? '<span class="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">ACTIVA</span>' : ''}
                    ${r.personalizada ? '<span class="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">PERSONALIZADA</span>' : '<span class="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">ORIGINAL</span>'}
                </div>
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">
                ${fecha}
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">
                ${r.nombreEmpleado || '-'}
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="window.mostrarVistaPrevia(${r.idRutina})" class="text-gray-400 hover:text-white transition" title="Vista rápida">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                    <a href="registrar-rutina.html?id=${r.idRutina}" class="text-gray-400 hover:text-[var(--orange)] transition" title="Editar / Personalizar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </a>
                    <button onclick="window.eliminarRutina(${r.idRutina}, '${r.nombre} (de ${r.nombreSocio})')" class="text-gray-400 hover:text-red-500 transition" title="Eliminar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(containerId, pageState, loadCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (pageState.totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const { page, totalPages } = pageState;

    container.innerHTML = `
        <span class="text-sm text-gray-400">Página <span class="text-white font-bold">${page + 1}</span> de ${totalPages}</span>
        <div class="flex gap-2">
            <button id="prev-${containerId}" 
                class="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                ${page === 0 ? "disabled" : ""}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button id="next-${containerId}" 
                class="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                ${page >= totalPages - 1 ? "disabled" : ""}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </div>
    `;

    document.getElementById(`prev-${containerId}`).onclick = () => loadCallback(page - 1);
    document.getElementById(`next-${containerId}`).onclick = () => loadCallback(page + 1);
}

function setupFiltros() {
    const input = document.getElementById("busquedaRutina");
    if (!input) return;

    // Simple client-side filter for current page (NOTE: Ideally should be backend search)
    input.oninput = (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (!state.asignadasCache) return;

        const filtradas = state.asignadasCache.filter(r => {
            const nombreSocio = r.nombreSocio ? r.nombreSocio.toLowerCase() : "";
            const dniSocio = r.dniSocio ? r.dniSocio.toLowerCase() : "";
            return nombreSocio.includes(term) || dniSocio.includes(term);
        });
        renderAsignadas(filtradas);
    };
}

window.eliminarRutina = async (id, nombre) => {
    Alerta.confirm({
        titulo: "Eliminar Rutina",
        mensaje: `¿Estás seguro de eliminar la rutina "${nombre}"?\nEsta acción no se puede deshacer.`,
        textoConfirmar: "Eliminar",
        onConfirm: async () => {
            try {
                const res = await authFetch(`/rutinas/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Alerta.success("Rutina eliminada correctamente");
                    cargarRutinas();
                } else {
                    Alerta.error("Error al eliminar la rutina");
                }
            } catch (e) {
                console.error(e);
                Alerta.error("Error de conexión");
            }
        }
    });
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

window.asignarRutina = async (idRutina, nombreRutina) => {
    // 1. Create/Get Modal
    let modal = document.getElementById("modalAsignar");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalAsignar";
        modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300";
        modal.innerHTML = `
            <div class="bg-[#121212] border border-[var(--input-border)] rounded-xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform duration-300 flex flex-col max-h-[85vh]">
                <div class="p-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
                    <h3 class="text-lg font-bold text-white">Asignar Rutina</h3>
                    <button id="closeModalAsignar" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div class="p-4 border-b border-[#2a2a2a]">
                     <input type="text" id="searchSocioAsignar" placeholder="Buscar socio..."
                            class="w-full bg-[#1a1a1a] border border-[var(--input-border)] text-gray-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--orange)]">
                </div>

                <div class="p-5 overflow-y-auto flex-1" id="modalAsignarBody">
                    <p class="text-center text-gray-500">Cargando socios...</p>
                </div>

                <div class="p-5 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end gap-3">
                     <button id="btnCancelAsignar" class="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                     <button id="btnConfirmAsignar" class="btn-primary px-4 py-2 text-sm font-bold flex items-center gap-2">
                        Confirmar Asignación (<span id="countAsignar">0</span>)
                     </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Events
        const close = () => {
            modal.classList.add("hidden", "opacity-0");
            modal.querySelector("div").classList.add("scale-95");
        };
        modal.querySelector("#closeModalAsignar").onclick = close;
        modal.querySelector("#btnCancelAsignar").onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };
    }

    // 2. Show Modal
    modal.classList.remove("hidden");
    void modal.offsetWidth; // Force reflow
    modal.classList.remove("opacity-0");
    modal.querySelector("div").classList.remove("scale-95");

    const body = modal.querySelector("#modalAsignarBody");
    const countSpan = modal.querySelector("#countAsignar");
    const title = modal.querySelector("h3");
    const btnConfirm = modal.querySelector("#btnConfirmAsignar");
    const searchInput = modal.querySelector("#searchSocioAsignar");

    title.textContent = `Asignar "${nombreRutina}"`;
    body.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>';
    countSpan.textContent = "0";

    // Data Holders
    let allSocios = [];
    let selectedDnis = new Set();

    // 3. Fetch Socios
    try {
        const res = await authFetch("/socios?activo=true&size=100"); // Get Active Socios
        const data = await res.json();
        allSocios = data.content;

        renderSociosList(allSocios);

    } catch (e) {
        console.error(e);
        body.innerHTML = `<p class="text-red-500 text-center">Error cargando socios.</p>`;
    }

    // Render Logic
    function renderSociosList(socios) {
        if (socios.length === 0) {
            body.innerHTML = `<p class="text-gray-500 text-center">No se encontraron socios.</p>`;
            return;
        }

        body.innerHTML = `<div class="space-y-2">
            ${socios.map(s => `
                <label class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded hover:bg-[#252525] border border-transparent hover:border-gray-700 cursor-pointer transition">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" value="${s.dni}" class="form-checkbox h-5 w-5 text-[var(--orange)] rounded bg-gray-700 border-gray-600 focus:ring-0 focus:ring-offset-0"
                            ${selectedDnis.has(s.dni) ? 'checked' : ''}>
                        <div class="flex flex-col">
                            <span class="text-white font-medium">${s.nombre}</span>
                            <span class="text-xs text-gray-500">${s.dni}</span>
                        </div>
                    </div>
                </label>
            `).join('')}
        </div>`;

        // Re-attach listeners because innerHTML wiped them
        body.querySelectorAll("input[type='checkbox']").forEach(cb => {
            cb.addEventListener("change", (e) => {
                if (e.target.checked) selectedDnis.add(e.target.value);
                else selectedDnis.delete(e.target.value);
                countSpan.textContent = selectedDnis.size;
            });
        });
    }

    // Search Logic
    searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allSocios.filter(s => s.nombre.toLowerCase().includes(term) || s.dni.includes(term));
        renderSociosList(filtered);
    };

    // Confirm Logic
    btnConfirm.onclick = async () => {
        if (selectedDnis.size === 0) {
            Alerta.warning("Seleccione al menos un socio");
            return;
        }

        const btnText = btnConfirm.innerHTML;
        btnConfirm.innerHTML = `<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Asignando...`;
        btnConfirm.disabled = true;

        try {
            const dnis = Array.from(selectedDnis);
            const res = await authFetch(`/rutinas/${idRutina}/asignar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dnis)
            });

            if (res.ok) {
                Alerta.success("Rutina asignada exitosamente!");
                modal.classList.add("hidden"); // Close simple
                cargarRutinas(); // Reload lists
            } else {
                const errData = await res.json();
                Alerta.error("Error: " + (errData.error || errData.mensaje || "Falló la asignación"));
            }
        } catch (e) {
            console.error(e);
            Alerta.error("Error de conexión");
        } finally {
            btnConfirm.innerHTML = btnText;
            btnConfirm.disabled = false;
        }
    };
};

// 🆕 VISTA PREVIA RÁPIDA
window.mostrarVistaPrevia = async function (idRutina) {
    const modal = document.getElementById("modalVistaPrevia");
    const titulo = document.getElementById("modalRutinaNombre");
    const descripcion = document.getElementById("modalRutinaDescripcion");
    const contenido = document.getElementById("modalVistaContenido");

    modal.classList.remove("hidden");
    contenido.innerHTML = '<div class="text-center text-gray-500">Cargando...</div>';

    try {
        const res = await authFetch(`/rutinas/${idRutina}`);
        if (!res.ok) throw new Error("No se pudo cargar la rutina");

        const rutina = await res.json();

        titulo.textContent = rutina.nombre;
        descripcion.textContent = rutina.descripcion || "Sin descripción";

        // Agrupar ejercicios por día
        const ejerciciosPorDia = {};
        rutina.detalles.forEach(detalle => {
            const dia = detalle.dia || 1;
            if (!ejerciciosPorDia[dia]) ejerciciosPorDia[dia] = [];
            ejerciciosPorDia[dia].push(detalle);
        });

        // Renderizar
        contenido.innerHTML = Object.entries(ejerciciosPorDia)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([dia, ejercicios]) => `
                <div class="mb-6">
                    <h4 class="text-[var(--orange)] font-bold mb-3 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Día ${dia}
                    </h4>
                    <div class="space-y-3">
                        ${ejercicios.map((ej, idx) => `
                            <div class="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                                <div class="flex items-start gap-3">
                                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--orange)]/20 text-[var(--orange)] text-xs flex items-center justify-center font-bold">
                                        ${idx + 1}
                                    </span>
                                    <div class="flex-1">
                                        <h5 class="font-bold text-white">${ej.nombreEjercicio}</h5>
                                        <div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                            ${ej.series ? `<span>📊 ${ej.series} series</span>` : ''}
                                            ${ej.repeticiones ? `<span>🔢 ${ej.repeticiones} reps</span>` : ''}
                                            ${ej.carga ? `<span>💪 ${ej.carga} kg</span>` : ''}
                                            ${ej.descanso ? `<span>⏱️ ${ej.descanso} seg</span>` : ''}
                                        </div>
                                        ${ej.observacion ? `<p class="mt-2 text-xs text-gray-500 italic">${ej.observacion}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

    } catch (error) {
        console.error(error);
        contenido.innerHTML = '<div class="text-center text-red-500">Error al cargar la rutina</div>';
    }
};

window.cerrarVistaPrevia = function () {
    document.getElementById("modalVistaPrevia").classList.add("hidden");
};

// 🆕 DUPLICAR PLANTILLA
window.duplicarPlantilla = async function (idRutina, nombre) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("User object:", user); // Debug

    const dniEmpleado = user.empleadoDni || user.dni;

    Alerta.confirm({
        titulo: "Duplicar Plantilla",
        mensaje: `¿Duplicar la plantilla "${nombre}"?\n\nSe creará una copia que podrás editar independientemente.`,
        textoConfirmar: "Duplicar",
        onConfirm: async () => {
            try {
                const url = dniEmpleado
                    ? `/rutinas/${idRutina}/duplicar?dniEmpleado=${dniEmpleado}`
                    : `/rutinas/${idRutina}/duplicar`;

                const res = await authFetch(url, {
                    method: "POST"
                });

                if (res.ok) {
                    const data = await res.json();
                    Alerta.success(`Plantilla duplicada: "${data.nombre}"`);
                    cargarRutinas(); // Reload lists
                } else {
                    const error = await res.json();
                    Alerta.error("❌ Error: " + (error.error || "No se pudo duplicar"));
                }
            } catch (error) {
                console.error(error);
                Alerta.error("Error de conexión");
            }
        }
    });
};
