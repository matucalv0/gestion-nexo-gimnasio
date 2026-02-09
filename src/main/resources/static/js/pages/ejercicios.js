import { authFetch } from "../api/api.js";
import { checkAuth } from "../auth/auth.js";
import { mostrarAlerta } from "../ui/alerta.js";

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
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8">Cargando...</td></tr>`;

    try {
        const res = await authFetch("/ejercicios");
        if (res.ok) {
            ejerciciosCache = await res.json();
            renderTabla();
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">Error cargando datos</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">Error de conexión</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No se encontraron ejercicios</td></tr>`;
        return;
    }

    filtrados.forEach(ej => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-white/5 transition-colors group";

        const grupoNombre = gruposCache.find(g => g.idGrupo === ej.idGrupoMuscular)?.nombre || 'Desconocido';
        const videoLink = ej.video
            ? `<a href="${ej.video}" target="_blank" class="text-secondary-400 hover:text-secondary-300 underline text-xs">Ver Video</a>`
            : '<span class="text-gray-600 text-xs">-</span>';

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-200">
                ${ej.nombre}
                ${ej.descripcion ? `<div class="text-xs text-gray-500 truncate max-w-xs mt-0.5">${ej.descripcion}</div>` : ''}
            </td>
            <td class="px-6 py-4">
                <span class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700">
                    ${grupoNombre}
                </span>
            </td>
            <td class="px-6 py-4">${videoLink}</td>
            <td class="px-6 py-4 text-right">
                <button class="btn-edit text-gray-400 hover:text-white mr-2 transition" data-id="${ej.idEjercicio}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button class="btn-delete text-gray-400 hover:text-red-500 transition" data-id="${ej.idEjercicio}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
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

    if (!nombre) return mostrarAlerta({ mensaje: "El nombre es obligatorio", tipo: "warning" });
    if (!idGrupo) return mostrarAlerta({ mensaje: "El grupo muscular es obligatorio", tipo: "warning" });

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
            mostrarAlerta({ mensaje: id ? "Actualizado correctamente" : "Creado correctamente", tipo: "success" });
            cerrarModal();
            cargarEjercicios(); // Reload list
        } else {
            const txt = await res.text();
            mostrarAlerta({ mensaje: "Error: " + txt, tipo: "danger" });
        }
    } catch (e) {
        console.error(e);
        mostrarAlerta({ mensaje: "Error de conexión", tipo: "danger" });
    }
}

async function confirmarEliminacion(id) {
    const result = await Swal.fire({
        title: '¿Eliminar ejercicio?',
        text: "No podrás revertir esto si ya está asignado a rutinas históricas podría causar inconsistencias visuales.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1f2937',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            const res = await authFetch(`/ejercicios/${id}`, { method: "DELETE" });
            if (res.ok) {
                mostrarAlerta({ mensaje: "Eliminado correctamente", tipo: "success" });
                cargarEjercicios();
            } else {
                mostrarAlerta({ mensaje: "No se pudo eliminar (quizás tiene dependencias)", tipo: "danger" });
            }
        } catch (e) {
            mostrarAlerta({ mensaje: "Error de conexión", tipo: "danger" });
        }
    }
}
