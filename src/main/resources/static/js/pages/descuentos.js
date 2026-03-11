import { checkAuth, logout } from "../auth/auth.js";
import { authFetch } from "../api/api.js";
import { Alerta } from "../ui/alerta.js";
import { navigateTo, getRouteParams } from "../utils/navigate.js";

checkAuth();

// ==========================
// STATE
// ==========================
let descuentos = [];

// ==========================
// DOM
// ==========================
let dom = {};

// ==========================
// INIT
// ==========================
export function init() {
  // Inicializar DOM refs AQUÍ, después de que el fragment se haya inyectado
  dom = {
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

  cargarDescuentos();
  initEventos();
}

function initEventos() {
  document
    .getElementById("btnHome")
    ?.addEventListener("click", () => history.back());

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
  // Limpiar cards existentes (excepto Empty State)
  const cards = dom.tablaBody.querySelectorAll(".coupon-card:not(#emptyState)");
  cards.forEach((card) => card.remove());

  if (descuentos.length === 0) {
    dom.emptyState.classList.remove("hidden");
    return;
  }

  dom.emptyState.classList.add("hidden");

  descuentos.forEach((d) => {
    const div = document.createElement("div");
    div.className =
      "coupon-card group flex flex-col bg-[#111] hover:bg-[#151515] border border-[#222] hover:border-[#333] rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 relative";

    const estadoColor = d.activo
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";
    const estadoText = d.activo ? "ACTIVO" : "INACTIVO";
    const estadoGlow = d.activo
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";

    div.innerHTML = `
            <!-- Perforaciones estilo ticket -->
            <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#050505] rounded-full border-r border-[#222] z-10"></div>
            <div class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#050505] rounded-full border-l border-[#222] z-10"></div>
            
            <div class="px-6 py-5 border-b border-dashed border-[#333] flex justify-between items-start relative z-0">
                <div>
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${estadoColor} mb-2">
                        <span class="w-1.5 h-1.5 rounded-full ${estadoGlow}"></span>
                        ${estadoText}
                    </span>
                    <h3 class="font-bold text-white text-lg tracking-tight group-hover:text-pink-400 transition-colors leading-tight">${d.nombre}</h3>
                </div>
            </div>
            <div class="px-6 py-6 flex justify-between items-end relative z-0">
                <div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bonificación</p>
                    <p class="text-4xl font-black font-mono text-white tracking-tighter">${d.porcentaje}<span class="text-2xl text-pink-500 ml-1">%</span></p>
                </div>
                <!-- Acción -->
                <button class="editarDescuento w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] hover:bg-pink-600 hover:border-pink-500 hover:text-white flex items-center justify-center text-gray-400 transition-all shadow-md group-hover:shadow-[0_0_15px_rgba(219,39,119,0.3)]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>
            </div>
        `;

    div.querySelector(".editarDescuento").addEventListener("click", () => {
      abrirModal(d);
    });

    dom.tablaBody.appendChild(div);
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
    activo: dom.activo.checked,
  };

  if (!data.nombre) return Alerta.warning("Ingrese un nombre");
  if (isNaN(data.porcentaje) || data.porcentaje < 0)
    return Alerta.warning("Porcentaje inválido");

  try {
    let res;
    let esNuevo = !id;

    if (esNuevo) {
      res = await authFetch("/descuentos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } else {
      // Para update necesitamos el ID
      res = await authFetch(`/descuentos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
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

export function destroy() {
  // Cleanup
}
