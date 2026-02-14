import { authFetch } from "../api/api.js";
import { getCurrentUser, checkAuth } from "../auth/auth.js";
import { Alerta } from "../ui/alerta.js";


checkAuth();

document.addEventListener("DOMContentLoaded", () => {
    init();
});

// ESTADO GLOBAL
let ejerciciosCache = [];
let daysData = { 1: [] }; // Stores rows for each day: { 1: [...], 2: [...] }
let currentDay = 1;
let rowsData = []; // Acts as "Current View Buffer"
let clipboard = null; // Para copiar/pegar
let undoStack = []; // Para Ctrl+Z
let currentRutinaId = null; // Para modo edición

async function init() {
    await cargarEjercicios();
    await cargarEmpleados();
    await cargarSocios(); // Wait for this too to ensure selects are ready

    // CHECK EDIT MODE
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        currentRutinaId = id;
        const titleEl = document.querySelector(".page-header-title");
        if (titleEl) titleEl.textContent = "Editar Rutina";
        await cargarRutina(id);
    } else {
        // Initial Row for Day 1 (Only if new)
        if (!daysData[1].length) {
            agregarFila(); // Adds to rowsData
            guardarEstadoDia(); // Persist to daysData
        }
        renderTabs();
    }

    // Eventos principales
    document.getElementById("btnGuardarRutina").addEventListener("click", guardarRutina);
    document.getElementById("btnAddEjercicio").addEventListener("click", () => agregarFila());
    document.getElementById("btnDuplicarEjercicio").addEventListener("click", duplicarFilaSeleccionada);
    document.getElementById("btnImportarExcel").addEventListener("click", mostrarImportarExcel);

    // Modal Video - Cerrar
    const closeModal = () => {
        document.getElementById("videoModal").classList.add("hidden");
        document.getElementById("videoModal").classList.remove("flex");
    };
    document.getElementById("closeVideoModal").addEventListener("click", closeModal);
    document.getElementById("cancelVideoBtn").addEventListener("click", closeModal);

    // Modal Nuevo Ejercicio
    cargarGruposMusculares();
    document.getElementById("btnCrearEjercicio").addEventListener("click", abrirModalNuevoEjercicio);
    document.getElementById("closeNewExerciseModal").addEventListener("click", cerrarModalNuevoEjercicio);
    document.getElementById("cancelNewExerciseBtn").addEventListener("click", cerrarModalNuevoEjercicio);
    document.getElementById("saveNewExerciseBtn").addEventListener("click", guardarNuevoEjercicio);
}

async function cargarEjercicios() {
    try {
        console.log("Cargando ejercicios...");
        const res = await authFetch("/ejercicios");

        if (res.ok) {
            const data = await res.json();
            ejerciciosCache = Array.isArray(data) ? data : (data.content || []);
            console.log("Ejercicios cargados:", ejerciciosCache.length);
        } else {
            const errorText = await res.text();
            console.error("Error al cargar ejercicios:", res.status, errorText);
            Alerta.error(`Error al cargar ejercicios: ${res.status}`);
        }
    } catch (e) {
        console.error("Error cargando ejercicios", e);
        Alerta.error("Error de conexión al cargar ejercicios");
    }
}

async function cargarSocios() {
    const select = document.getElementById("selectSocio");
    try {
        const res = await authFetch("/socios");
        if (res.ok) {
            const data = await res.json();
            const socios = data.content || data;
            socios.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.dni;
                opt.textContent = `${s.nombre} (${s.dni})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error cargando socios", e);
    }
}

async function cargarEmpleados() {
    const select = document.getElementById("selectEmpleado");
    try {
        const res = await authFetch("/empleados");
        if (res.ok) {
            const data = await res.json();
            const empleados = data.content || data;
            empleados.forEach(emp => {
                const opt = document.createElement("option");
                opt.value = emp.dni;
                opt.textContent = `${emp.nombre} (${emp.dni})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error cargando empleados", e);

    }
}


async function cargarRutina(id) {
    try {
        const res = await authFetch(`/rutinas/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la rutina");

        const data = await res.json();

        // Metadata
        document.getElementById("nombreRutina").value = data.nombre;
        document.getElementById("descripcionRutina").value = data.descripcion || "";
        document.getElementById("selectEmpleado").value = data.dniEmpleado;
        // Wait for socios to load if not ready, but we awaited in init so it should be fine
        if (data.dniSocio) document.getElementById("selectSocio").value = data.dniSocio;

        // Ejercicios / Detalles
        daysData = {}; // Clear default

        if (data.detalles && data.detalles.length > 0) {
            data.detalles.forEach(d => {
                const dia = d.dia || 1;
                if (!daysData[dia]) daysData[dia] = [];
                daysData[dia].push({
                    idDetalle: d.idDetalle, // NEW: Capture ID for smart update
                    idEjercicio: d.idEjercicio,
                    series: d.series,
                    repeticiones: d.repeticiones,
                    carga: d.carga,
                    descanso: d.descanso,
                    rpe: null,
                    observacion: d.observacion
                });
            });
        }

        // Ensure at least day 1 exists
        if (Object.keys(daysData).length === 0) {
            daysData[1] = [];
            agregarFila(null); // Add empty row to day 1
            daysData[1] = [...rowsData];
        }

        // Setup Init View
        const days = Object.keys(daysData).map(Number).sort((a, b) => a - b);
        currentDay = days[0];
        rowsData = [...daysData[currentDay]];

        renderTabs();
        recargarTabla();

    } catch (e) {
        console.error(e);
        Alerta.error("Error cargando datos de la rutina");
    }
}

// ==========================================
// LOGICA DE TABS Y DIAS
// ==========================================
function renderTabs() {
    const container = document.getElementById("daysTabsContainer");
    container.innerHTML = "";

    const days = Object.keys(daysData).map(Number).sort((a, b) => a - b);

    days.forEach(day => {
        const btn = document.createElement("button");
        const isActive = day === currentDay;

        // ESTILOS STANDARDIZADOS
        if (isActive) {
            btn.className = "px-4 py-2 bg-[var(--orange)] text-black font-bold rounded-t-lg text-sm transition border border-[var(--orange)]";
        } else {
            btn.className = "px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-500 hover:text-gray-300 rounded-t-lg transition text-sm border border-transparent hover:border-[var(--input-border)]";
        }

        // Label logic
        btn.innerHTML = `Día ${day}`;
        if (days.length > 1) {
            // Delete button for day (small x)
            const close = document.createElement("span");
            close.className = "ml-2 text-xs opacity-50 hover:opacity-100 hover:text-black font-bold";
            close.textContent = "×";
            close.onclick = (e) => {
                e.stopPropagation();
                eliminarDia(day);
            };
            btn.appendChild(close);
        }

        btn.onclick = () => switchDay(day);
        container.appendChild(btn);
    });

    // Button to add new day
    const btnAdd = document.createElement("button");
    btnAdd.className = "px-3 py-2 bg-[#1a1a1a] hover:bg-gray-800 text-[var(--orange)] font-bold rounded-lg transition text-lg flex items-center justify-center border border-dashed border-[var(--input-border)]";
    btnAdd.textContent = "+";
    btnAdd.title = "Agregar día";
    btnAdd.onclick = agregarDia;
    container.appendChild(btnAdd);
}

function switchDay(newDay) {
    if (newDay === currentDay) return;

    // 1. Save current state
    guardarEstadoDia();

    // 2. Switch context
    currentDay = newDay;

    // 3. Load new state
    rowsData = [...(daysData[currentDay] || [])];
    // ...

    renderTabs();
    recargarTabla();
}

function agregarDia() {
    guardarEstadoDia();
    const days = Object.keys(daysData).map(Number);
    const nextDay = Math.max(...days) + 1;
    daysData[nextDay] = []; // Init empty

    // Switch to new day
    currentDay = nextDay;
    rowsData = [];
    agregarFila(); // Start with 1 row

    renderTabs();
    recargarTabla();
}

function eliminarDia(dayToDelete) {
    if (Object.keys(daysData).length <= 1) return; // Don't delete last day

    Alerta.confirm({
        titulo: "Eliminar Día",
        mensaje: `¿Eliminar todo el contenido del Día ${dayToDelete}?`,
        textoConfirmar: "Eliminar",
        onConfirm: () => {
            delete daysData[dayToDelete];

            const newDaysData = {};
            let newIndex = 1;
            Object.keys(daysData).sort((a, b) => a - b).forEach(d => {
                newDaysData[newIndex] = daysData[d];
                newIndex++;
            });
            daysData = newDaysData;

            // Reset view
            const days = Object.keys(daysData).map(Number);
            if (!days.includes(currentDay)) {
                currentDay = days[0];
            } else {
                currentDay = 1;
            }

            rowsData = daysData[currentDay];
            renderTabs();
            recargarTabla();
        }
    });
}

function guardarEstadoDia() {
    // Save rowsData (buffer) to daysData
    daysData[currentDay] = [...rowsData];
}

function agregarFila(data = null) {
    const tbody = document.getElementById("ejerciciosTableBody");
    const rowIndex = rowsData.length;

    // Datos por defecto
    const rowData = data || {
        idDetalle: null, // Default new
        idEjercicio: "",
        series: "",
        repeticiones: "",
        carga: "",
        descanso: "",
        rpe: "",
        observacion: ""
    };

    rowsData.push(rowData);
    agregarFilaConIndice(rowIndex, rowData);
}

function crearInputNumerico(field, rowData, tr) {
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("table-input");
    input.placeholder = field === "series" ? "4" : field === "repeticiones" ? "6-10" : "100";
    input.value = rowData[field] || "";

    input.addEventListener("change", (e) => {
        rowData[field] = e.target.value;
        validarCelda(input, field, e.target.value);
        guardarEstadoDia(); // Persist changes
    });

    input.addEventListener("keydown", (e) => manejadorTablaKeydown(e, tr));

    input.addEventListener("blur", () => {
        validarCelda(input, field, input.value);
        guardarEstadoDia();
    });

    return input;
}

function validarCelda(input, field, value) {
    input.classList.remove("invalid", "warning");

    if (!value) return; // No validar vacío

    if (field === "series" && !isNaN(value)) {
        const num = parseInt(value);
        if (num < 1) input.classList.add("invalid");
        else if (num > 10) input.classList.add("warning");
    }

    if (field === "repeticiones" && !isNaN(value)) {
        const num = parseInt(value);
        if (num < 1) input.classList.add("invalid");
        else if (num > 30) input.classList.add("warning");
    }

    if (field === "carga" && !isNaN(value)) {
        const num = parseFloat(value);
        if (num < 0) input.classList.add("warning"); // Asistencia
    }
}

function manejadorTablaKeydown(e, tr) {
    const rowIndex = parseInt(tr.dataset.rowIndex);
    const inputs = Array.from(tr.querySelectorAll("input, select"));
    const currentIndex = inputs.indexOf(e.target);

    if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
            // Shift+Tab = anterior
            if (currentIndex > 0) {
                inputs[currentIndex - 1].focus();
            } else if (rowIndex > 0) {
                const prevRow = document.querySelector(`tr[data-row-index="${rowIndex - 1}"]`);
                const prevInputs = Array.from(prevRow.querySelectorAll("input, select"));
                prevInputs[prevInputs.length - 1].focus();
            }
        } else {
            // Tab = siguiente
            if (currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else {
                // Última columna = nueva fila
                agregarFila();
                setTimeout(() => {
                    const newRow = document.querySelector(`tr[data-row-index="${rowsData.length - 1}"]`);
                    const newInputs = Array.from(newRow.querySelectorAll("input, select"));
                    newInputs[1].focus(); // Enfoque en Ejercicio de nueva fila
                }, 50);
            }
        }
    }

    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        // Enter = siguiente fila
        if (rowIndex < rowsData.length - 1) {
            const nextRow = document.querySelector(`tr[data-row-index="${rowIndex + 1}"]`);
            const nextInputs = Array.from(nextRow.querySelectorAll("input, select"));
            nextInputs[1].focus();
        } else {
            agregarFila();
            setTimeout(() => {
                const newRow = document.querySelector(`tr[data-row-index="${rowIndex - 1}"]`);
                const newInputs = Array.from(newRow.querySelectorAll("input, select"));
                newInputs[1].focus();
            }, 50);
        }
    }

    // Ctrl+C = copiar fila
    if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        copiarFila(rowIndex);
    }

    // Ctrl+V = pegar fila
    if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        pegarFila(rowIndex);
    }

    // Ctrl+D = duplicar fila
    if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        duplicarFila(rowIndex);
    }

    // Ctrl+↑ = mover arriba
    if (e.ctrlKey && e.key === "ArrowUp") {
        e.preventDefault();
        moverFilaArriba(rowIndex);
    }

    // Ctrl+↓ = mover abajo
    if (e.ctrlKey && e.key === "ArrowDown") {
        e.preventDefault();
        moverFilaAbajo(rowIndex);
    }

    // Ctrl+Z = deshacer
    if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        deshacer();
    }

    // Delete = eliminar
    if (e.key === "Delete") {
        e.preventDefault();
        eliminarFila(rowIndex);
    }
}

function copiarFila(rowIndex) {
    clipboard = { ...rowsData[rowIndex] };
    Alerta.success("Fila copiada ✓");
}

function pegarFila(rowIndex) {
    if (!clipboard) {
        Alerta.warning("Portapapeles vacío");
        return;
    }
    // Insertar después de la fila actual
    const newData = { ...clipboard };
    rowsData.splice(rowIndex + 1, 0, newData);
    recargarTabla();
    Alerta.success("Fila pegada ✓");
}

function duplicarFila(rowIndex) {
    const rowData = rowsData[rowIndex];
    const newData = { ...rowData };
    rowsData.splice(rowIndex + 1, 0, newData);
    recargarTabla();
    Alerta.success("Fila duplicada ✓");
}

function duplicarFilaSeleccionada() {
    const tbody = document.getElementById("ejerciciosTableBody");
    const selectedRow = tbody.querySelector("tr.selected");
    if (!selectedRow) {
        Alerta.warning("Selecciona una fila primero");
        return;
    }
    const rowIndex = parseInt(selectedRow.dataset.rowIndex);
    duplicarFila(rowIndex);
}

function moverFilaArriba(rowIndex) {
    if (rowIndex === 0) return;
    [rowsData[rowIndex - 1], rowsData[rowIndex]] = [rowsData[rowIndex], rowsData[rowIndex - 1]];
    recargarTabla();
}

function moverFilaAbajo(rowIndex) {
    if (rowIndex === rowsData.length - 1) return;
    [rowsData[rowIndex], rowsData[rowIndex + 1]] = [rowsData[rowIndex + 1], rowsData[rowIndex]];
    recargarTabla();
}

function eliminarFila(rowIndex) {
    if (rowsData.length === 1) {
        Alerta.warning("Debe haber al menos una fila");
        return;
    }
    rowsData.splice(rowIndex, 1);
    recargarTabla();
    Alerta.success("Fila eliminada ✓");
}

function agregarFilaConIndice(rowIndex, data) {
    const tbody = document.getElementById("ejerciciosTableBody");

    // Crear fila de la tabla
    const tr = document.createElement("tr");
    tr.dataset.rowIndex = rowIndex;
    tr.className = "hover:bg-gray-800 transition-colors";

    // Celda de número de fila
    const tdNum = document.createElement("td");
    tdNum.className = "cell-number text-center text-gray-500 font-mono";
    tdNum.textContent = rowIndex + 1;
    tr.appendChild(tdNum);

    // Celda de Ejercicio (select)
    const tdEjercicio = document.createElement("td");
    const selectEjercicio = document.createElement("select");
    selectEjercicio.className = "table-input cursor-pointer";
    selectEjercicio.innerHTML = '<option value="">-- Seleccionar --</option>';

    if (Array.isArray(ejerciciosCache) && ejerciciosCache.length > 0) {
        ejerciciosCache.forEach(ej => {
            const opt = document.createElement("option");
            opt.value = ej.idEjercicio || ej.id || "";
            opt.textContent = ej.nombre || ej.name || "";
            selectEjercicio.appendChild(opt);
        });
    }

    if (data.idEjercicio) {
        // Verificar si el ejercicio existe en el cache
        const exists = ejerciciosCache.some(e => (e.idEjercicio || e.id) == data.idEjercicio);

        if (!exists) {
            // Agregar opción temporal para ejercicio no encontrado
            const opt = document.createElement("option");
            opt.value = data.idEjercicio;
            opt.textContent = `⚠️ NO DISPONIBLE (ID: ${data.idEjercicio})`;
            opt.classList.add("bg-red-900", "text-white");
            selectEjercicio.appendChild(opt);
        }
        selectEjercicio.value = data.idEjercicio;
    }

    selectEjercicio.addEventListener("change", (e) => {
        data.idEjercicio = e.target.value;
        guardarEstadoDia();
    });
    selectEjercicio.addEventListener("keydown", (e) => manejadorTablaKeydown(e, tr));

    tdEjercicio.appendChild(selectEjercicio);
    tr.appendChild(tdEjercicio);

    // Series
    const tdSeries = document.createElement("td");
    const inputSeries = crearInputNumerico("series", data, tr);
    inputSeries.classList.add("text-center");
    tdSeries.appendChild(inputSeries);
    tr.appendChild(tdSeries);

    // Reps
    const tdReps = document.createElement("td");
    const inputReps = crearInputNumerico("repeticiones", data, tr);
    inputReps.classList.add("text-center");
    tdReps.appendChild(inputReps);
    tr.appendChild(tdReps);

    // Carga
    const tdCarga = document.createElement("td");
    const inputCarga = crearInputNumerico("carga", data, tr);
    inputCarga.classList.add("text-center");
    tdCarga.appendChild(inputCarga);
    tr.appendChild(tdCarga);

    // Descanso
    const tdDescanso = document.createElement("td");
    const inputDescanso = document.createElement("input");
    inputDescanso.type = "text";
    inputDescanso.className = "table-input text-center";
    inputDescanso.placeholder = "60s";
    inputDescanso.value = data.descanso || "";
    inputDescanso.addEventListener("change", (e) => {
        data.descanso = e.target.value;
    });
    inputDescanso.addEventListener("keydown", (e) => manejadorTablaKeydown(e, tr));
    tdDescanso.appendChild(inputDescanso);
    tr.appendChild(tdDescanso);

    // RPE
    const tdRPE = document.createElement("td");
    const inputRPE = document.createElement("input");
    inputRPE.type = "text";
    inputRPE.className = "table-input text-center";
    inputRPE.placeholder = "7";
    inputRPE.value = data.rpe || "";
    inputRPE.addEventListener("change", (e) => {
        data.rpe = e.target.value;
    });
    inputRPE.addEventListener("keydown", (e) => manejadorTablaKeydown(e, tr));
    tdRPE.appendChild(inputRPE);
    tr.appendChild(tdRPE);

    // Notas
    const tdNotas = document.createElement("td");
    const inputNotas = document.createElement("input");
    inputNotas.type = "text";
    inputNotas.className = "table-input";
    inputNotas.placeholder = "Notas...";
    inputNotas.value = data.observacion || "";
    inputNotas.addEventListener("change", (e) => {
        data.observacion = e.target.value;
    });
    inputNotas.addEventListener("keydown", (e) => manejadorTablaKeydown(e, tr));
    tdNotas.appendChild(inputNotas);
    tr.appendChild(tdNotas);

    // Acciones
    const tdAcciones = document.createElement("td");
    const divAcciones = document.createElement("div");
    divAcciones.style.display = "flex";
    divAcciones.style.gap = "0.25rem";
    divAcciones.className = "justify-center";

    const btnMover = document.createElement("button");
    btnMover.type = "button";
    btnMover.className = "text-gray-500 hover:text-white hover:bg-gray-700 p-1 rounded transition";
    btnMover.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>`;
    btnMover.title = "Mover (Ctrl+↑/↓)";
    btnMover.addEventListener("click", (e) => {
        e.preventDefault();
        tr.classList.toggle("selected");
    });
    divAcciones.appendChild(btnMover);

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "text-gray-500 hover:text-red-500 hover:bg-gray-700 p-1 rounded transition";
    btnDelete.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
    btnDelete.title = "Eliminar (Delete)";
    btnDelete.addEventListener("click", (e) => {
        e.preventDefault();
        eliminarFila(rowIndex);
    });
    divAcciones.appendChild(btnDelete);

    tdAcciones.appendChild(divAcciones);
    tr.appendChild(tdAcciones);

    // Agregar a tabla
    tbody.appendChild(tr);

    // Retornar tr para focus si necesario
    return tr;
}

function recargarTabla() {
    const tbody = document.getElementById("ejerciciosTableBody");
    tbody.innerHTML = "";
    rowsData = rowsData.filter(d => d); // Limpiar nulls
    rowsData.forEach((data, idx) => {
        agregarFilaConIndice(idx, data);
    });
}

function deshacer() {
    // Implementar con stack de cambios
    Alerta.info("Deshacer no implementado aún");
}

function mostrarImportarExcel() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Alerta.warning("Importar Excel: funcionalidad en desarrollo");
        // TODO: Implementar parseador de Excel
    });
    input.click();
}

function manejadorAtajosTeclado(e) {
    // Ctrl+Z global
    if (e.ctrlKey && e.key === "z" && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") {
        e.preventDefault();
        deshacer();
    }
}

async function guardarRutina() {
    const nombre = document.getElementById("nombreRutina").value.trim();
    const desc = document.getElementById("descripcionRutina").value.trim();
    const empleadoSeleccionado = document.getElementById("selectEmpleado").value.trim();
    const socio = document.getElementById("selectSocio").value.trim();

    if (!nombre) {
        Alerta.warning("Por favor ingresa un nombre de rutina");
        return;
    }

    if (!empleadoSeleccionado) {
        Alerta.warning("Por favor selecciona un empleado");
        return;
    }

    // Validar y consoldiar ejercicios de TODOS los días
    guardarEstadoDia(); // Ensure current buffer is saved
    const detalles = [];
    let invalidExercises = false;

    Object.keys(daysData).forEach(dayNum => {
        const rows = daysData[dayNum];
        rows.forEach((data, idx) => {
            // VALIDATION: Check for "NO DISPONIBLE" exercises
            if (data.idEjercicio && data.idEjercicio !== "" && !isNaN(data.idEjercicio)) {
                const exists = ejerciciosCache.some(e => (e.idEjercicio || e.id) == data.idEjercicio);
                if (!exists) {
                    invalidExercises = true;
                    return;
                }

                detalles.push({
                    idDetalle: data.idDetalle || null, // Send ID if exists
                    idEjercicio: parseInt(data.idEjercicio),
                    orden: detalles.length + 1,
                    dia: parseInt(dayNum),
                    series: data.series || null,
                    repeticiones: data.repeticiones || null,
                    carga: data.carga || null,
                    descanso: data.descanso || null,
                    observacion: data.observacion || null
                });
            }
        });
    });

    if (invalidExercises) {
        Alerta.error("Hay ejercicios 'NO DISPONIBLES'. Por favor corrígelos o elimínalos antes de guardar.");
        return;
    }

    if (detalles.length === 0) {
        Alerta.warning("Agrega al menos un ejercicio en algún día");
        return;
    }

    const payload = {
        nombre: nombre,
        descripcion: desc || null,
        dniEmpleado: empleadoSeleccionado,
        dniSocio: socio || null,
        detalles: detalles
    };

    console.log("Payload que se envía:", JSON.stringify(payload, null, 2));

    try {
        const url = currentRutinaId ? `/rutinas/${currentRutinaId}` : "/rutinas";
        const method = currentRutinaId ? "PUT" : "POST";

        if (currentRutinaId) {
            payload.idRutina = parseInt(currentRutinaId);
        }

        const res = await authFetch(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Alerta.success("Rutina guardada correctamente ✓");
            setTimeout(() => window.location.href = "rutinas.html", 2000);
        } else {
            const err = await res.text();
            console.error("Error al guardar:", err);
            Alerta.error("No se pudo guardar: " + err);
        }
    } catch (e) {
        console.error("Error de conexión:", e);
        Alerta.error("Error de conexión al guardar");
    }
}

// ==========================================
// NUEVO EJERCICIO LOGIC
// ==========================================
let gruposMuscularesCache = [];

async function cargarGruposMusculares() {
    try {
        const res = await authFetch("/grupos-musculares");
        if (res.ok) {
            gruposMuscularesCache = await res.json();
        }
    } catch (e) {
        console.error("Error cargando grupos musculares", e);
    }
}

function abrirModalNuevoEjercicio() {
    const modal = document.getElementById("newExerciseModal");
    const select = document.getElementById("neGrupo");

    // Reset fields
    document.getElementById("neNombre").value = "";
    document.getElementById("neVideo").value = "";
    document.getElementById("neDescripcion").value = "";

    // Populate Groups
    select.innerHTML = '<option value="">-- Seleccionar --</option>';
    gruposMuscularesCache.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.idGrupo;
        opt.textContent = g.nombre;
        select.appendChild(opt);
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex"); // Ensure flex display for standard modal behavior
}

function cerrarModalNuevoEjercicio() {
    const modal = document.getElementById("newExerciseModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function guardarNuevoEjercicio() {
    const nombre = document.getElementById("neNombre").value.trim();
    const idGrupo = document.getElementById("neGrupo").value;
    const video = document.getElementById("neVideo").value.trim();
    const descripcion = document.getElementById("neDescripcion").value.trim();

    if (!nombre) return Alerta.warning("El nombre es obligatorio");
    if (!idGrupo) return Alerta.warning("El grupo muscular es obligatorio");

    // Payload matches EjercicioDTO
    const payload = {
        nombre,
        idGrupoMuscular: parseInt(idGrupo),
        video: video || null,
        descripcion: descripcion || null
    };

    try {
        const res = await authFetch("/ejercicios", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const nuevoEj = await res.json();
            Alerta.success("Ejercicio creado con éxito ✓");

            // Update Cache
            ejerciciosCache.push(nuevoEj);

            // Refresh all select inputs in table rows
            recargarSelectoresEjercicios();

            cerrarModalNuevoEjercicio();
        } else {
            const txt = await res.text();
            Alerta.error("Error al crear: " + txt);
        }
    } catch (e) {
        console.error(e);
        Alerta.error("Error de conexión");
    }
}

function recargarSelectoresEjercicios() {
    const selects = document.querySelectorAll("select.table-input");
    selects.forEach(sel => {
        const currentVal = sel.value;
        // Keep options but add new one? Or rebuild? 
        // Rebuilding is safer to sort/ensure consistency
        sel.innerHTML = '<option value="">-- Seleccionar --</option>';

        // Sort alphabetically
        const sorted = [...ejerciciosCache].sort((a, b) => a.nombre.localeCompare(b.nombre));

        sorted.forEach(ej => {
            const opt = document.createElement("option");
            opt.value = ej.idEjercicio || ej.id;
            opt.textContent = ej.nombre;
            sel.appendChild(opt);
        });

        // Restaurar valor previo (incluso si es huérfano)
        if (currentVal) {
            const exists = sorted.some(e => (e.idEjercicio || e.id) == currentVal);
            if (!exists) {
                const opt = document.createElement("option");
                opt.value = currentVal;
                opt.textContent = `⚠️ NO DISPONIBLE (ID: ${currentVal})`;
                opt.classList.add("bg-red-900", "text-white");
                sel.appendChild(opt);
            }
        }
        sel.value = currentVal;
    });
}
