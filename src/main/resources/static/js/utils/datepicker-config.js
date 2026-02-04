/**
 * Configuración centralizada de Flatpickr
 * Para date pickers consistentes en toda la aplicación
 */

// Locale español para Flatpickr
const Spanish = {
    weekdays: {
        shorthand: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        longhand: [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ],
    },
    months: {
        shorthand: [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
        ],
        longhand: [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
        ],
    },
    firstDayOfWeek: 1,
    ordinal: () => "º",
    rangeSeparator: " a ",
    weekAbbreviation: "Sem",
    scrollTitle: "Desplazar para aumentar",
    toggleTitle: "Hacer clic para cambiar",
    time_24hr: true,
};

/**
 * Configuración base para Flatpickr con tema oscuro personalizado
 */
export const flatpickrConfig = {
    locale: Spanish,
    dateFormat: "Y-m-d", // Formato ISO para backend
    altInput: true, // Muestra un input alternativo al usuario
    altFormat: "d/m/Y", // Formato visual para el usuario
    allowInput: true, // Permite escribir manualmente
    disableMobile: false, // Usa date picker nativo en móviles

    // Callback para aplicar estilos personalizados
    onReady: function (selectedDates, dateStr, instance) {
        // Aplicar tema oscuro personalizado
        const calendarContainer = instance.calendarContainer;
        calendarContainer.classList.add('flatpickr-dark-theme');
    }
};

/**
 * Configuración para fecha de nacimiento (limita fechas futuras)
 */
export const birthDateConfig = {
    ...flatpickrConfig,
    maxDate: "today", // No permite fechas futuras
    defaultDate: new Date(2000, 0, 1), // Fecha por defecto: 01/01/2000
};

/**
 * Configuración para filtros de rango de fechas
 */
export const dateRangeConfig = {
    ...flatpickrConfig,
    mode: "range",
    altFormat: "d/m/Y",
    conjunction: " a ", // Separador visual
};

/**
 * Inicializa Flatpickr en un input con configuración específica
 * @param {string} selector - Selector CSS del input
 * @param {object} config - Configuración de Flatpickr (opcional)
 * @returns {object} Instancia de Flatpickr
 */
export function initDatePicker(selector, config = flatpickrConfig) {
    const input = document.querySelector(selector);
    if (!input) {
        console.warn(`No se encontró el input: ${selector}`);
        return null;
    }

    // Importar Flatpickr dinámicamente desde CDN
    if (!window.flatpickr) {
        console.error('Flatpickr no está cargado. Asegúrate de incluir el CDN en el HTML.');
        return null;
    }

    return window.flatpickr(input, config);
}
