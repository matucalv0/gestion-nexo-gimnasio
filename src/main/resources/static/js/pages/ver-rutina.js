import { authFetch } from "../api/api.js";
import { checkAuth } from "../auth/auth.js";
import { Alerta } from "../ui/alerta.js";

checkAuth();

let rutinaActualId = null; // Variable global para el ID
window.rutinaActualId = rutinaActualId; // Exposer en window para acceso desde onclick

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        Alerta.warning("ID de rutina no especificado");
        setTimeout(() => window.location.href = "rutinas.html", 2000);
        return;
    }

    rutinaActualId = id; // Guardar el ID
    window.rutinaActualId = id; // Actualizar en window también

    await cargarRutina(id);

    // ESC to close modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("videoPreviewModal");
            if (!modal.classList.contains("hidden")) {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
                document.getElementById("videoFrameContainer").innerHTML = ""; // Stop video
            }
        }
    });
});

async function cargarRutina(id) {
    try {
        const res = await authFetch(`/rutinas/${id}`);
        if (res.ok) {
            const rutina = await res.json();
            renderRutina(rutina);
            document.getElementById("loadingState").classList.add("hidden");
        } else {
            document.getElementById("loadingState").innerHTML = `<p class="text-red-500">Error cargando rutina (${res.status})</p>`;
        }
    } catch (e) {
        console.error(e);
        document.getElementById("loadingState").innerHTML = `<p class="text-red-500">Error de conexión</p>`;
    }
}

let currentRutinaDetails = [];
let currentDayView = 1;
let daysAvailable = [];

function renderRutina(rutina) {
    document.title = `NEXO · ${rutina.nombre}`;

    // Header Info
    document.getElementById("rutinaNombre").textContent = rutina.nombre;
    document.getElementById("rutinaDescripcion").textContent = rutina.descripcion || "Sin descripción";
    document.getElementById("rutinaProfesor").textContent = rutina.nombreEmpleado ? `${rutina.nombreEmpleado} (${rutina.dniEmpleado})` : rutina.dniEmpleado;

    // Updated Socio Display
    const socioEl = document.getElementById("rutinaSocio");
    if (rutina.dniSocio) {
        socioEl.textContent = rutina.nombreSocio ? `${rutina.nombreSocio} (${rutina.dniSocio})` : rutina.dniSocio;
    } else {
        socioEl.textContent = "Sin asignar";
    }

    // Format Date
    if (rutina.fecha) {
        const date = new Date(rutina.fecha);
        document.getElementById("rutinaFecha").textContent = date.toLocaleDateString();
    }

    // PROCESS DETAILS
    if (!rutina.detalles || rutina.detalles.length === 0) {
        document.getElementById("ejerciciosContainer").innerHTML = `<div class="text-gray-500 italic text-center py-8">No hay ejercicios en esta rutina</div>`;
        return;
    }

    currentRutinaDetails = rutina.detalles;

    // Extract unique days
    const uniqueDays = new Set(rutina.detalles.map(d => d.dia || 1));
    daysAvailable = Array.from(uniqueDays).sort((a, b) => a - b);

    if (daysAvailable.length === 0) daysAvailable = [1];
    currentDayView = daysAvailable[0];

    renderTabs();
    renderExercisesForDay(currentDayView);
}

function renderTabs() {
    const container = document.getElementById("viewDaysTabs");
    container.innerHTML = "";

    daysAvailable.forEach(day => {
        const btn = document.createElement("button");
        const isActive = day === currentDayView;

        btn.className = isActive
            ? "px-4 py-2 bg-[var(--orange)] text-black font-bold rounded-t-lg text-sm transition border border-[var(--orange)]"
            : "px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-500 hover:text-gray-300 rounded-t-lg transition text-sm border border-transparent hover:border-[var(--input-border)]";

        btn.textContent = `Día ${day}`;
        btn.onclick = () => {
            currentDayView = day;
            renderTabs();
            renderExercisesForDay(day);
        };
        container.appendChild(btn);
    });
}

function renderExercisesForDay(day) {
    const container = document.getElementById("ejerciciosContainer");
    container.innerHTML = "";

    const details = currentRutinaDetails.filter(d => (d.dia || 1) === day);
    const sorted = details.sort((a, b) => a.orden - b.orden);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-gray-500 italic text-center py-8 text-sm">No hay ejercicios registrados para este día</div>`;
        return;
    }

    // Crear tabla
    const table = document.createElement("div");
    table.className = "overflow-x-auto border border-[#2a2a2a] rounded-lg";

    // Encabezado
    let html = `
        <div class="bg-[#1a1a1a] border-b border-[#2a2a2a] grid grid-cols-12 gap-3 p-3 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0">
            <div class="col-span-1">#</div>
            <div class="col-span-4">Ejercicio</div>
            <div class="col-span-1">Series</div>
            <div class="col-span-1">Reps</div>
            <div class="col-span-3">Cargas (kg)</div>
            <div class="col-span-2">Acciones</div>
        </div>
    `;

    // Filas
    sorted.forEach(dt => {
        const cargasText = dt.cargas && dt.cargas.length > 0
            ? dt.cargas.join(' • ')
            : '—';

        let acciones = `
            <button class="text-blue-400 hover:text-blue-300 font-semibold text-xs btn-editar-cargas" data-id-detalle="${dt.idDetalle}" data-nombre-ejercicio="${dt.nombreEjercicio}" data-cargas="${dt.cargas ? dt.cargas.join(', ') : ''}">
                Editar
            </button>
        `;

        if (dt.videoUrl) {
            acciones += ` <button class="text-[var(--orange)] hover:text-orange-400 font-semibold text-xs btn-ver-video" data-video-url="${dt.videoUrl}">
                Video
            </button>`;
        }

        html += `
            <div class="border-b border-[#2a2a2a] grid grid-cols-12 gap-3 p-3 hover:bg-[#1a1a1a]/50 transition items-center">
                <div class="col-span-1 text-gray-500 font-mono text-sm">${dt.orden}</div>
                <div class="col-span-4">
                    <p class="font-semibold text-[var(--beige)] text-sm">${dt.nombreEjercicio}</p>
                    <p class="text-xs text-gray-500">${dt.grupoMuscular || '—'}</p>
                </div>
                <div class="col-span-1 text-[var(--orange)] font-bold text-sm text-center">${dt.series || '—'}</div>
                <div class="col-span-1 text-[var(--orange)] font-bold text-sm text-center">${dt.repeticiones || '—'}</div>
                <div class="col-span-3 font-mono text-sm">
                    <span class="inline-block px-2 py-1 bg-[#121212] rounded border border-[#2a2a2a] text-gray-300">${cargasText}</span>
                </div>
                <div class="col-span-2 flex gap-2 text-xs">
                    ${acciones}
                </div>
            </div>
        `;
    });

    table.innerHTML = html;
    container.appendChild(table);

    // Agregar event listeners a los botones
    table.querySelectorAll('.btn-editar-cargas').forEach(btn => {
        btn.addEventListener('click', function () {
            const idDetalle = parseInt(this.dataset.idDetalle);
            const nombreEjercicio = this.dataset.nombreEjercicio;
            const cargas = this.dataset.cargas;
            abrirEditarCargas(idDetalle, nombreEjercicio, cargas);
        });
    });

    table.querySelectorAll('.btn-ver-video').forEach(btn => {
        btn.addEventListener('click', function () {
            const videoUrl = this.dataset.videoUrl;
            verVideo(videoUrl);
        });
    });

    // Observaciones si existen
    const tieneObs = sorted.some(d => d.observacion);
    if (tieneObs) {
        const obsDiv = document.createElement("div");
        obsDiv.className = "mt-4 p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]";
        obsDiv.innerHTML = `
            <p class="text-xs font-bold text-gray-400 uppercase mb-2">Observaciones / RPE:</p>
            <div class="space-y-1">
                ${sorted.filter(d => d.observacion).map(d => `
                    <p class="text-xs text-gray-400"><span class="font-semibold text-gray-300">${d.nombreEjercicio}:</span> ${d.observacion}</p>
                `).join('')}
            </div>
        `;
        container.appendChild(obsDiv);
    }
}

// Variables globales para el modal de edición
let detalleEnEdicion = null;

// Funciones para editar cargas
window.abrirEditarCargas = (idDetalle, nombreEjercicio, cargas) => {
    detalleEnEdicion = idDetalle;
    document.getElementById('tituloEditarCargas').textContent = nombreEjercicio;
    document.getElementById('inputCargas').value = cargas;

    // Mostrar vista previa inicial
    actualizarVistaPreviaCargas();

    document.getElementById('modalEditarCargas').classList.remove('hidden');
    document.getElementById('modalEditarCargas').classList.add('flex');
};

// Actualizar vista previa al escribir
document.addEventListener('DOMContentLoaded', () => {
    const inputCargas = document.getElementById('inputCargas');
    if (inputCargas) {
        inputCargas.addEventListener('input', actualizarVistaPreviaCargas);
    }
});

function actualizarVistaPreviaCargas() {
    const inputText = document.getElementById('inputCargas').value.trim();
    const cargas = inputText
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0 && !isNaN(c));

    const previewContent = document.getElementById('cargasPreviewContent');

    if (cargas.length === 0) {
        previewContent.innerHTML = '<p class="text-xs text-gray-600 italic">Ingresa las cargas para verlas aquí...</p>';
        return;
    }

    previewContent.innerHTML = cargas.map((carga, i) => `
        <div class="flex items-center gap-1 px-3 py-2 rounded-lg ${i === 0 ? 'bg-[var(--orange)]/20 border border-[var(--orange)]/50' : 'bg-gray-800/50 border border-gray-700'}">
            <span class="font-mono font-bold ${i === 0 ? 'text-[var(--orange)]' : 'text-gray-300'}">${carga}</span>
            <span class="text-xs text-gray-500">kg</span>
            ${i === 0 ? '<span class="text-xs text-[var(--orange)] font-semibold ml-1">(base)</span>' : ''}
        </div>
    `).join('');
}

window.cerrarModalEditarCargas = () => {
    document.getElementById('modalEditarCargas').classList.add('hidden');
    document.getElementById('modalEditarCargas').classList.remove('flex');
    detalleEnEdicion = null;
};

window.guardarCargas = async () => {
    const inputText = document.getElementById('inputCargas').value.trim();
    const cargas = inputText
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    if (cargas.length === 0) {
        Alerta.warning("Ingresa al menos una carga");
        return;
    }

    try {
        const detalle = currentRutinaDetails.find(d => d.idDetalle === detalleEnEdicion);
        if (!detalle) {
            Alerta.error("Ejercicio no encontrado");
            return;
        }

        const updateDTO = {
            idDetalle: detalleEnEdicion,
            series: detalle.series,
            repeticiones: detalle.repeticiones,
            carga: cargas[0],
            cargas: cargas
        };

        const res = await authFetch(`/rutinas/detalles/${detalleEnEdicion}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateDTO)
        });

        if (res.ok) {
            const actualizado = await res.json();
            // Actualizar en el array local
            const idx = currentRutinaDetails.findIndex(d => d.idDetalle === detalleEnEdicion);
            if (idx >= 0) {
                currentRutinaDetails[idx] = actualizado;
            }
            cerrarModalEditarCargas();
            renderExercisesForDay(currentDayView);
            Alerta.success(`✓ Cargas actualizadas: ${cargas.join(', ')} kg`);
        } else {
            const err = await res.json().catch(() => ({}));
            Alerta.error("Error al actualizar cargas: " + (err.error || err.mensaje || "Error desconocido"));
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
    }
}

// Global for inline onclick
window.verVideo = (url) => {
    if (!url) return;

    // Simple youtube conversion for embed
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("v=")[1].split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    const modal = document.getElementById("videoPreviewModal");
    const container = document.getElementById("videoFrameContainer");

    container.innerHTML = `<iframe class="w-full h-full" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
};

// Variables globales para asignación
let rutinaActualParaAsignar = null;
let sociosDisponibles = [];

// Funciones para el modal de asignar
window.abrirModalAsignar = async (idRutina) => {
    rutinaActualParaAsignar = idRutina;

    // Cargar socios disponibles
    try {
        const res = await authFetch('/socios');
        if (res.ok) {
            const data = await res.json();
            console.log('Respuesta de API /socios:', data);

            // Manejar tanto si retorna directamente un array como si retorna un objeto
            sociosDisponibles = Array.isArray(data) ? data : (data.socios || data.data || data.content || []);

            console.log('Socios disponibles procesados:', sociosDisponibles);

            if (!Array.isArray(sociosDisponibles) || sociosDisponibles.length === 0) {
                console.warn('No hay socios o formato inválido:', sociosDisponibles);
                Alerta.warning("No hay socios disponibles");
                return;
            }

            // Verificar estructura de datos
            if (sociosDisponibles.length > 0) {
                console.log('Estructura del primer socio:', Object.keys(sociosDisponibles[0]));
            }

            renderizarListaSocios();
            document.getElementById('modalAsignarSocios').classList.remove('hidden');
            document.getElementById('modalAsignarSocios').classList.add('flex');

            // Configurar búsqueda después de que el modal esté visible
            const inputBuscar = document.getElementById('buscarSocio');
            if (inputBuscar) {
                inputBuscar.addEventListener('input', renderizarListaSocios);
            }
        } else {
            Alerta.error("Error al cargar socios");
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
    }
};

window.cerrarModalAsignar = () => {
    document.getElementById('modalAsignarSocios').classList.add('hidden');
    document.getElementById('modalAsignarSocios').classList.remove('flex');
    rutinaActualParaAsignar = null;
};

function renderizarListaSocios() {
    const listaSocios = document.getElementById('listaSocios');
    if (!listaSocios) return;

    const inputBuscar = document.getElementById('buscarSocio');
    const textoBuscar = inputBuscar ? inputBuscar.value.toLowerCase() : '';

    console.log('Renderizando socios, cantidad:', sociosDisponibles.length);

    const sociosFiltrados = Array.isArray(sociosDisponibles) ? sociosDisponibles.filter(s => {
        // Intentar acceder a las propiedades de diferentes formas
        const nombre = (s.nombreSocio || s.nombre || s.name || '').toString().toLowerCase();
        const dni = (s.dniSocio || s.dni || s.id || '').toString().toLowerCase();
        return nombre.includes(textoBuscar) || dni.includes(textoBuscar);
    }) : [];

    console.log('Socios filtrados:', sociosFiltrados.length);

    listaSocios.innerHTML = sociosFiltrados.map(socio => {
        const nombre = socio.nombreSocio || socio.nombre || socio.name || 'Sin nombre';
        const dni = socio.dniSocio || socio.dni || socio.id || 'Sin DNI';
        return `
            <label class="flex items-center px-4 py-3 hover:bg-[#252525] cursor-pointer border-b border-[#2a2a2a]">
                <input type="checkbox" class="socio-checkbox w-4 h-4 rounded bg-[#121212] border-gray-600" value="${dni}">
                <div class="ml-3">
                    <p class="font-semibold text-[var(--beige)]">${nombre}</p>
                    <p class="text-xs text-gray-500">${dni}</p>
                </div>
            </label>
        `;
    }).join('');

    if (sociosFiltrados.length === 0) {
        listaSocios.innerHTML = '<p class="px-4 py-3 text-gray-500 text-sm">No se encontraron socios</p>';
    }
}

// Configurar búsqueda en tiempo real
// Nota: Se configura dinámicamente en abrirModalAsignar()

window.asignarSociosSeleccionados = async () => {
    const seleccionados = Array.from(document.querySelectorAll('.socio-checkbox:checked'))
        .map(cb => cb.value);

    if (seleccionados.length === 0) {
        Alerta.warning("Selecciona al menos un socio");
        return;
    }

    try {
        const res = await authFetch(`/rutinas/${rutinaActualParaAsignar}/asignar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(seleccionados)
        });

        if (res.ok) {
            const resultado = await res.json();
            Alerta.success(resultado.mensaje);
            cerrarModalAsignar();
        } else {
            const err = await res.json();
            Alerta.error("Error: " + (err.error || "No se pudo asignar"));
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
    }
};
// Exportar a PDF
window.exportarPDF = () => {
    const nombreRutina = document.getElementById("rutinaNombre")?.textContent || "Rutina";

    // Crear un elemento temporal con el contenido a exportar
    const content = document.querySelector("article");
    if (!content) {
        Alerta.warning("No hay contenido para exportar");
        return;
    }

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${nombreRutina}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: 'avoid-all', before: '.break-page' }
    };

    html2pdf().set(opt).from(content).save().then(() => {
        Alerta.success("✓ PDF generado correctamente");
    }).catch(err => {
        console.error(err);
        Alerta.error("Error al generar PDF");
    });
};