import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";


checkAuth();

// ==========================
// STATE
// ==========================
let descuentos = [];

// ==========================
// DOM
// ==========================
const dom = {
    tablaBody: document.getElementById("tablaBody"),
    emptyState: document.getElementById("emptyState"),
    btnNuevo: document.getElementById("btnNuevo"),
    modal: document.getElementById("modalDescuento"),
    modalContent: document.getElementById("modalContent"),
    btnCerrarModal: document.getElementById("btnCerrarModal"),
    btnCancelarModal: document.getElementById("btnCancelarModal"),
    form: document.getElementById("formDescuento"),
    modalTitle: document.getElementById("modalTitle"),
    // Inputs
    id: document.getElementById("descuentoId"),
    nombre: document.getElementById("nombre"),
    porcentaje: document.getElementById("porcentaje"),
    activo: document.getElementById("activo"),
};

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    cargarDescuentos();
    initEventos();
});

function initEventos() {
    document.getElementById("btnHome")?.addEventListener("click", () => window.location.href = "/home.html");

    dom.btnNuevo.addEventListener("click", () => abrirModal());

    dom.btnCerrarModal.addEventListener("click", cerrarModal);
    dom.btnCancelarModal.addEventListener("click", cerrarModal);

    dom.form.addEventListener("submit", guardarDescuento);

    dom.modal.addEventListener("click", (e) => {
        if (e.target === dom.modal) cerrarModal();
    });
}

// ==========================
// LOGICA
// ==========================

async function cargarDescuentos() {
    try {
        // Usamos el endpoint raíz para traer todos (activos e inactivos)
        // El controller debe tener @GetMapping que retorne findAll()
        // Si el controller solo tenía /activos, necesitamos agregar el general.
        // Asumimos que agregamos @GetMapping al controller.
        const res = await authFetch("/descuentos");
        if (!res.ok) throw new Error("Error al cargar descuentos");

        descuentos = await res.json();
        render();
    } catch (error) {
        console.error(error);
        Alerta.error("No se pudieron cargar los descuentos");
    }
}

function render() {
    // Limpiar filas existentes (excepto Empty State)
    const rows = dom.tablaBody.querySelectorAll('tr:not(#emptyState)');
    rows.forEach(row => row.remove());

    if (descuentos.length === 0) {
        dom.emptyState.classList.remove("hidden");
        return;
    }

    dom.emptyState.classList.add("hidden");

    descuentos.forEach(d => {
        const tr = document.createElement("tr");

        // Estilo manual consistente con membresias.js
        tr.innerHTML = `
            <td class="font-medium text-[var(--beige)]">${d.nombre}</td>
            <td class="font-bold text-[var(--accent)]">${d.porcentaje}%</td>
            <td>
                <span class="badge ${d.activo ? 'badge-success' : 'badge-danger'}">
                    ${d.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td>
                <button class="editarDescuento table-action-btn text-gray-400 hover:text-white transition-colors" title="Editar">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>
            </td>
        `;

        // Evento click para editar
        tr.querySelector(".editarDescuento").addEventListener("click", () => {
            abrirModal(d);
        });

        dom.tablaBody.appendChild(tr);
    });


}

// ==========================
// MODAL
// ==========================

function abrirModal(descuento = null) {
    dom.form.reset();

    if (descuento) {
        dom.modalTitle.textContent = "Editar Descuento";
        dom.id.value = descuento.idDescuento;
        dom.nombre.value = descuento.nombre;
        dom.porcentaje.value = descuento.porcentaje;
        dom.activo.checked = descuento.activo;
    } else {
        dom.modalTitle.textContent = "Nuevo Descuento";
        dom.id.value = "";
        dom.activo.checked = true; // Por defecto activo
    }

    dom.modal.classList.remove("hidden");
    // Animation
    requestAnimationFrame(() => {
        dom.modalContent.classList.remove("scale-95", "opacity-0");
        dom.modalContent.classList.add("scale-100", "opacity-100");
    });
}

function cerrarModal() {
    dom.modalContent.classList.remove("scale-100", "opacity-100");
    dom.modalContent.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
        dom.modal.classList.add("hidden");
    }, 200);
}

async function guardarDescuento(e) {
    e.preventDefault();

    const id = dom.id.value;
    const data = {
        nombre: dom.nombre.value.trim(),
        porcentaje: Number(dom.porcentaje.value),
        activo: dom.activo.checked
    };

    if (!data.nombre) return Alerta.warning("Ingrese un nombre");
    if (isNaN(data.porcentaje) || data.porcentaje < 0) return Alerta.warning("Porcentaje inválido");

    try {
        let res;
        let esNuevo = !id;

        if (esNuevo) {
            res = await authFetch("/descuentos", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } else {
            // Para update necesitamos el ID
            res = await authFetch(`/descuentos/${id}`, {
                method: "PUT",
                body: JSON.stringify(data)
            });
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Error al guardar");
        }

        Alerta.success(esNuevo ? "Descuento creado" : "Descuento actualizado");
        cerrarModal();
        cargarDescuentos();

    } catch (error) {
        console.error(error);
        Alerta.error(error.message);
    }
}
