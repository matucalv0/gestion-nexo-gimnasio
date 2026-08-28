import { authFetch } from "../api/api.js";
import { checkAuth } from "../auth/auth.js";
import { Alerta } from "../ui/alerta.js";
import { renderMasterTable, createAvatarCell, createStatusBadge, ICONS } from "../ui/tabla.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

let ejerciciosCache = [];
let gruposCache = [];

export async function init() {
    await cargarGrupos();
    await cargarEjercicios();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById("btnHome")?.addEventListener("click", () => history.back());
    // Modal controls
    document.getElementById("btnNuevoEjercicio").addEventListener("click", () => abrirModal());
    document.getElementById("closeModalBtn").addEventListener("click", cerrarModal);
    document.getElementById("cancelBtn").addEventListener("click", cerrarModal);
    document.getElementById("saveBtn").addEventListener("click", guardarEjercicio);

    // Filters
    document.getElementById("busquedaInput").addEventListener("input", renderTabla);
    document.getElementById("filtroGrupo").addEventListener("change", renderTabla);
}

async function cargarGrupos() {
    try {
        const res = await authFetch("/grupos-musculares");
        if (res.ok) {
            gruposCache = await res.json();
            llenarSelectGrupos();
        }
    } catch (e) {
        console.error("Error cargando grupos", e);
    }
}

function llenarSelectGrupos() {
    const filtro = document.getElementById("filtroGrupo");
    const modalInput = document.getElementById("grupoInput");

    // Clear existing (except first for filter)
    filtro.innerHTML = '<option value="">Todos los grupos</option>';
    modalInput.innerHTML = '<option value="">-- Seleccionar --</option>';

    gruposCache.forEach(g => {
        // Filter option
        const opt1 = document.createElement("option");
        opt1.value = g.idGrupo;
        opt1.textContent = g.nombre;
        filtro.appendChild(opt1);

        // Modal option
        const opt2 = document.createElement("option");
        opt2.value = g.idGrupo;
        opt2.textContent = g.nombre;
        modalInput.appendChild(opt2);
    });
}

async function cargarEjercicios() {
    const tbody = document.getElementById("tablaEjerciciosBody");

    try {
        const res = await authFetch("/ejercicios");
        if (res.ok) {
            ejerciciosCache = await res.json();
            renderTabla();
        } else {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state py-8"><p class="text-red-400 text-sm">Error cargando datos</p></div></td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state py-8"><p class="text-red-400 text-sm">Error de conexión</p></div></td></tr>`;
    }
}

function renderTabla() {
    const tbody = document.getElementById("tablaEjerciciosBody");
    const emptyState = document.getElementById("emptyStateEjercicios");
    const busqueda = (document.getElementById("busquedaInput")?.value || "").toLowerCase();
    const grupoFiltro = document.getElementById("filtroGrupo")?.value;

    const filtrados = ejerciciosCache.filter(ej => {
        const matchNombre = (ej.nombre || "").toLowerCase().includes(busqueda);
        const matchGrupo = grupoFiltro ? ej.idGrupoMuscular == grupoFiltro : true;
        return matchNombre && matchGrupo;
    });

    renderMasterTable({
        tbody: tbody,
        emptyElement: emptyState,
        data: filtrados,
        columns: [
            {
                render: (ej) => {
                    return `
                        <div>
                            <span class="font-bold text-white tracking-tight group-hover:text-[var(--orange)] transition-colors">${ej.nombre}</span>
                            ${ej.descripcion ? `<div class="text-xs text-gray-500 truncate max-w-xs mt-0.5">${ej.descripcion}</div>` : ""}
                        </div>
                    `;
                }
            },
            {
                render: (ej) => {
                    const grupoNombre = gruposCache.find(g => g.idGrupo === ej.idGrupoMuscular)?.nombre || 'General';
                    return `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">${grupoNombre}</span>`;
                }
            },
            {
                render: (ej) => {
                    if (ej.video) {
                        return `<a href="${ej.video}" target="_blank" class="inline-flex items-center gap-1 text-xs text-[var(--orange)] hover:underline font-medium">Ver Video ↗</a>`;
                    }
                    return `<span class="text-gray-600 text-xs">—</span>`;
                }
            }
        ],
        actions: [
            {
                icon: "edit",
                type: "primary",
                title: "Editar Ejercicio",
                onClick: (ej) => abrirModal(ej)
            },
            {
                icon: "delete",
                type: "danger",
                title: "Eliminar Ejercicio",
                onClick: (ej) => confirmarEliminacion(ej.idEjercicio)
            }
        ]
    });
}

// Modal Logic
function abrirModal(ejercicio = null) {
    const modal = document.getElementById("modalEjercicio");
    const title = document.getElementById("modalTitle");
    const idInput = document.getElementById("ejercicioId");

    // Reset or Fill
    if (ejercicio) {
        title.innerHTML = `
    <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
    Editar Ejercicio
        `;
        idInput.value = ejercicio.idEjercicio;
        document.getElementById("nombreInput").value = ejercicio.nombre;
        document.getElementById("grupoInput").value = ejercicio.idGrupoMuscular;
        document.getElementById("videoInput").value = ejercicio.video || "";
        document.getElementById("descripcionInput").value = ejercicio.descripcion || "";
    } else {
        title.innerHTML = `
        <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
    Nuevo Ejercicio
        `;
        idInput.value = "";
        document.getElementById("nombreInput").value = "";
        document.getElementById("grupoInput").value = "";
        document.getElementById("videoInput").value = "";
        document.getElementById("descripcionInput").value = "";
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function cerrarModal() {
    const modal = document.getElementById("modalEjercicio");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function guardarEjercicio() {
    const id = document.getElementById("ejercicioId").value;
    const nombre = document.getElementById("nombreInput").value.trim();
    const idGrupo = document.getElementById("grupoInput").value;
    const video = document.getElementById("videoInput").value.trim();
    const descripcion = document.getElementById("descripcionInput").value.trim();

    if (!nombre) return Alerta.warning("El nombre es obligatorio");
    if (!idGrupo) return Alerta.warning("El grupo muscular es obligatorio");

    const payload = {
        nombre,
        idGrupoMuscular: parseInt(idGrupo),
        video: video || null,
        descripcion: descripcion || null
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/ejercicios/${id}` : "/ejercicios";

    try {
        const res = await authFetch(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Alerta.success(id ? "Actualizado correctamente" : "Creado correctamente");
            cerrarModal();
            cargarEjercicios(); // Reload list
        } else {
            const txt = await res.text();
            Alerta.error("Error: " + txt);
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
    }
}

async function confirmarEliminacion(id) {
    Alerta.confirm({
        titulo: "¿Eliminar ejercicio?",
        mensaje: "No podrás revertir esto si ya está asignado a rutinas históricas podría causar inconsistencias visuales.",
        textoConfirmar: "Sí, eliminar",
        onConfirm: async () => {
            try {
                const res = await authFetch(`/ejercicios/${id}`, { method: "DELETE" });
                if (res.ok) {
                    Alerta.success("Eliminado correctamente");
                    cargarEjercicios();
                } else {
                    Alerta.error("No se pudo eliminar (quizás tiene dependencias)");
                }
            } catch (e) {
                Alerta.error("Error de conexión");
            }
        }
    });
}
