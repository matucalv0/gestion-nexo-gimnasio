import { authFetch } from "../api/api.js";
import { checkAuth } from "../auth/auth.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

let ejerciciosCache = [];
let gruposCache = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarGrupos();
    await cargarEjercicios();
    setupEventListeners();
});

function setupEventListeners() {
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
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state py-8"><p class="text-gray-500 text-sm">Cargando...</p></div></td></tr>`;

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
    const busqueda = document.getElementById("busquedaInput").value.toLowerCase();
    const grupoFiltro = document.getElementById("filtroGrupo").value;

    tbody.innerHTML = "";

    const filtrados = ejerciciosCache.filter(ej => {
        const matchNombre = ej.nombre.toLowerCase().includes(busqueda);
        const matchGrupo = grupoFiltro ? ej.idGrupoMuscular == grupoFiltro : true;
        return matchNombre && matchGrupo;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state py-8"><p class="text-gray-500 text-sm">No se encontraron ejercicios</p></div></td></tr>`;
        return;
    }

    filtrados.forEach(ej => {
        const tr = document.createElement("tr");

        const grupoNombre = gruposCache.find(g => g.idGrupo === ej.idGrupoMuscular)?.nombre || 'Desconocido';
        const videoLink = ej.video
            ? `<a href="${ej.video}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm">Ver Video</a>`
            : '<span class="text-gray-600 text-sm">—</span>';

        tr.innerHTML = `
            <td>
                <div class="font-medium">${ej.nombre}</div>
                ${ej.descripcion ? `<div class="text-xs text-gray-500 truncate max-w-xs mt-0.5">${ej.descripcion}</div>` : ''}
            </td>
            <td><span class="badge">${grupoNombre}</span></td>
            <td>${videoLink}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-edit table-action-btn" data-id="${ej.idEjercicio}" title="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                    <button class="btn-delete table-action-btn table-action-btn-danger" data-id="${ej.idEjercicio}" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        `;

        // Attach events directly to avoid delegation issues
        tr.querySelector(".btn-edit").addEventListener("click", () => abrirModal(ej));
        tr.querySelector(".btn-delete").addEventListener("click", () => confirmarEliminacion(ej.idEjercicio));

        tbody.appendChild(tr);
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
