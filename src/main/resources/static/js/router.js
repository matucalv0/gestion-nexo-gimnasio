import { checkAuthSync } from './auth/auth.js';

/**
 * router.js
 * Motor principal de enrutamiento hash de la SPA.
 */

// Mapa de rutas de la aplicación
const ROUTES = {
    'home': { fragment: 'fragments/home.html', module: './pages/home.js' },
    'asistencias': { fragment: 'fragments/asistencias.html', module: './pages/asistencias.js' },
    'socios': { fragment: 'fragments/socios.html', module: './pages/socios.js' },
    'socio-detalle': { fragment: 'fragments/socio-detalle.html', module: './pages/socio-detalle.js' },
    'registrar-socio': { fragment: 'fragments/registrar-socio.html', module: './pages/registrar-socio.js' },
    'editar-socio': { fragment: 'fragments/editar-socio.html', module: './pages/editar-socio.js' },
    'pagos': { fragment: 'fragments/pagos.html', module: './pages/pagos.js' },
    'registrar-pago': { fragment: 'fragments/registrar-pago.html', module: './pages/registrar-pago.js' },
    'finanzas': { fragment: 'fragments/finanzas.html', module: './pages/finanzas.js' },
    'registrar-gasto': { fragment: 'fragments/registrar-gasto.html', module: './pages/registrar-gasto.js' },
    'membresias': { fragment: 'fragments/membresias.html', module: './pages/membresias.js' },
    'registrar-membresia': { fragment: 'fragments/registrar-membresia.html', module: './pages/registrar-membresia.js' },
    'editar-membresia': { fragment: 'fragments/editar-membresia.html', module: './pages/editar-membresia.js' },
    'productos': { fragment: 'fragments/productos.html', module: './pages/productos.js' },
    'registrar-producto': { fragment: 'fragments/registrar-producto.html', module: './pages/registrar-producto.js' },
    'editar-producto': { fragment: 'fragments/editar-producto.html', module: './pages/editar-producto.js' },
    'rutinas': { fragment: 'fragments/rutinas.html', module: './pages/rutinas.js' },
    'registrar-rutina': { fragment: 'fragments/registrar-rutina.html', module: './pages/registrar-rutina.js' },
    'ver-rutina': { fragment: 'fragments/ver-rutina.html', module: './pages/ver-rutina.js' },
    'importar-rutina': { fragment: 'fragments/importar-rutina.html', module: './pages/importar-rutina.js' },
    'ejercicios': { fragment: 'fragments/ejercicios.html', module: './pages/ejercicios.js' },
    'descuentos': { fragment: 'fragments/descuentos.html', module: './pages/descuentos.js' },
};

const DEFAULT_ROUTE = 'home';
let currentModule = null;

// Elemento principal donde se inyectarán las vistas
let appContent = null;

export async function initRouter() {
    appContent = document.getElementById('app-content');

    if (!appContent) {
        console.error("Router error: No se encontró el elemento #app-content");
        return;
    }

    // Carga inicial y cambios de hash
    window.addEventListener('hashchange', handleRouteChange);

    // Si la URL inicial no tiene hash, redirigir al default
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        window.location.hash = `#/${DEFAULT_ROUTE}`;
    } else {
        // Ejecutar carga de ruta inicial (el handler de hashchange no se dispara en on load auto si ya tiene hash)
        handleRouteChange();
    }
}

async function handleRouteChange() {
    // 1. Validar sesión síncronamente rápida (si falla, manda a login localmente antes de hacer fetch)
    checkAuthSync();

    // 2. Extraer nombre de la ruta del hash
    // Ej: "#/socio-detalle?dni=123" -> routeId = "socio-detalle"
    const hash = window.location.hash;
    let routeId = hash.replace('#/', '').split('?')[0];

    if (!routeId) {
        routeId = DEFAULT_ROUTE;
    }

    const route = ROUTES[routeId];

    if (!route) {
        console.error(`Route no encontrada: ${routeId}`);
        appContent.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h2 class="text-2xl font-bold text-white mb-2">Página no encontrada</h2>
                <p class="text-gray-400 mb-6">La ruta a la que intentas acceder no existe en la aplicación.</p>
                <button onclick="window.location.hash='#/home'" class="btn-action-primary">Volver al inicio</button>
            </div>
        `;
        return;
    }

    try {
        // 3. Cleanup del módulo anterior si existe
        if (currentModule && typeof currentModule.destroy === 'function') {
            currentModule.destroy();
        }

        // 4. Hacer un fade-out rapido (opcional para UX, aquí simplificamos limpiando)
        appContent.innerHTML = '<div class="flex justify-center py-20"><div class="w-8 h-8 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin"></div></div>'; // Loader

        // 5. Fetch del fragmento HTML
        const response = await fetch(route.fragment);
        if (!response.ok) throw new Error(`HTTP error ${response.status} fetching ${route.fragment}`);
        const html = await response.text();

        // 6. Inyectar HTML
        appContent.innerHTML = html;

        // 7. Cargar y ejecutar módulo JS
        currentModule = await import(route.module + '?t=' + Date.now()); // cache busting temporal para dev, opcional

        if (typeof currentModule.init === 'function') {
            await currentModule.init();
        }

        // 8. Actualizar UI de active states (Sidebar)
        updateSidebarActiveState(routeId);

        // Scroll to top
        window.scrollTo(0, 0);

    } catch (err) {
        console.error("Error cargando ruta:", err);
        appContent.innerHTML = `
            <div class="p-6 bg-red-900/20 border border-red-500/50 rounded-xl m-6">
                <h3 class="text-xl font-bold text-red-500 mb-2">Error de carga</h3>
                <p class="text-red-300">Hubo un error al intentar cargar la vista solicitada. Inténtalo de nuevo.</p>
                <pre class="mt-4 p-4 bg-black/50 overflow-x-auto text-xs text-red-400 rounded">${err.message}</pre>
            </div>
        `;
    }
}

function updateSidebarActiveState(routeId) {
    // Si el sidebar existe en el DOM, actualizar la clase active manualmente
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => {
        item.classList.remove('active');
        const pagesAttr = item.getAttribute('data-pages');
        if (pagesAttr) {
            const pages = pagesAttr.split(',');
            if (pages.includes(routeId)) {
                item.classList.add('active');
            }
        }
    });
}
