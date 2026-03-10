/**
 * navigate.js
 * Utilidades para navegación programática y manejo de la URL en la SPA.
 */

/**
 * Navega a una ruta específica cambiando el hash.
 * 
 * @param {string} route - Nombre de la ruta (e.g., 'socios', 'socio-detalle')
 * @param {Object} params - Objeto con parámetros clave-valor (e.g., { dni: '123' })
 */
export function navigateTo(route, params = {}) {
    let hash = `#/${route}`;

    // Convertir objeto de params a query string
    if (Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        hash += `?${query}`;
    }

    window.location.hash = hash;
}

/**
 * Obtiene los parámetros de la URL actual desde el hash.
 * Reemplaza el uso de new URLSearchParams(window.location.search) en la SPA.
 * 
 * @returns {URLSearchParams} - Objeto con los parámetros parseados
 */
export function getRouteParams() {
    const hash = window.location.hash; // Ej: "#/socio-detalle?dni=123"
    const parts = hash.split('?');

    if (parts.length > 1) {
        return new URLSearchParams(parts[1]);
    }

    return new URLSearchParams();
}
