/**
 * NEXO Sidebar Navigation Component
 * Auto-injects a collapsible sidebar into every page that includes this script.
 * Does NOT use ES modules — loaded as a regular <script> so it self-initializes.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'nexo-sidebar-collapsed';

    // Navigation items configuration
    const NAV_ITEMS = [
        {
            section: 'Principal',
            items: [
                { label: 'Panel', href: '/home.html', icon: 'home', pages: ['home.html'] },
                { label: 'Asistencia', href: '/asistencia.html', icon: 'check-circle', pages: ['asistencia.html'] },
            ]
        },
        {
            section: 'Gestión',
            items: [
                { label: 'Socios', href: '/socios.html', icon: 'users', pages: ['socios.html', 'socio-detalle.html', 'registrar-socio.html', 'editar-socio.html'] },
                { label: 'Pagos', href: '/pagos.html', icon: 'dollar', pages: ['pagos.html', 'registrar-pago.html'] },
                { label: 'Finanzas', href: '/finanzas.html', icon: 'chart', pages: ['finanzas.html', 'registrar-gasto.html'] },
            ]
        },
        {
            section: 'Configuración',
            items: [
                { label: 'Membresías', href: '/membresias.html', icon: 'card', pages: ['membresias.html', 'registrar-membresia.html', 'editar-membresia.html'] },
                { label: 'Productos', href: '/productos.html', icon: 'cube', pages: ['productos.html', 'registrar-producto.html', 'editar-producto.html'] },
                { label: 'Rutinas', href: '/rutinas.html', icon: 'clipboard', pages: ['rutinas.html', 'registrar-rutina.html', 'ver-rutina.html', 'importar-rutina.html'] },
                { label: 'Ejercicios', href: '/ejercicios.html', icon: 'dumbbell', pages: ['ejercicios.html'] },
            ]
        },
        {
            section: 'Estadísticas',
            items: [
                { label: 'Asistencias', href: '/asistencias.html', icon: 'bar-chart', pages: ['asistencias.html'] },
            ]
        }
    ];

    // SVG icons (stroke-based, 24x24 viewBox)
    const ICONS = {
        'home': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
        'check-circle': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        'users': '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
        'dollar': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        'chart': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
        'card': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>',
        'cube': '<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
        'clipboard': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
        'dumbbell': '<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h3m10 0h3M4 17h3m10 0h3M7 4v3m0 10v3m10-16v3m0 10v3M7 7h10v10H7z"/>',
        'bar-chart': '<path stroke-linecap="round" stroke-linejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
        'logout': '<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>',
        'collapse': '<path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>',
        'menu': '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>'
    };

    function svgIcon(name, cls) {
        return `<svg class="${cls || 'sidebar-item-icon'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${ICONS[name] || ''}</svg>`;
    }

    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return page;
    }

    function isActive(pages) {
        const current = getCurrentPage();
        return pages.includes(current);
    }

    function buildSidebarHTML() {
        const currentPage = getCurrentPage();
        let navHTML = '';

        NAV_ITEMS.forEach((section) => {
            navHTML += `<div class="sidebar-section">`;
            navHTML += `<div class="sidebar-section-label">${section.section}</div>`;

            section.items.forEach((item) => {
                const activeClass = isActive(item.pages) ? ' active' : '';
                navHTML += `
          <a href="${item.href}" class="sidebar-item${activeClass}" data-tooltip="${item.label}">
            ${svgIcon(item.icon)}
            <span class="sidebar-item-label">${item.label}</span>
          </a>`;
            });

            navHTML += `</div>`;
        });

        return `
      <!-- Mobile hamburger -->
      <button class="sidebar-hamburger" id="sidebarHamburger" aria-label="Abrir menú">
        ${svgIcon('menu', 'sidebar-hamburger-icon')}
      </button>

      <!-- Overlay for mobile -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>

      <!-- Sidebar -->
      <nav class="nexo-sidebar" id="nexoSidebar" role="navigation" aria-label="Navegación principal">
        <!-- Header -->
        <div class="sidebar-header">
          <img src="/assets/nexologo.png" alt="NEXO" class="sidebar-logo">
          <span class="sidebar-brand">NEXO</span>
        </div>

        <!-- Nav items -->
        <div class="sidebar-nav">
          ${navHTML}
        </div>

        <!-- Footer -->
        <div class="sidebar-footer">
          <button class="sidebar-item logout-item" id="sidebarLogout" data-tooltip="Cerrar sesión">
            ${svgIcon('logout')}
            <span class="sidebar-item-label">Cerrar sesión</span>
          </button>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Colapsar menú">
            ${svgIcon('collapse', 'sidebar-collapse-icon')}
            <span class="sidebar-collapse-label">Colapsar</span>
          </button>
        </div>
      </nav>`;
    }

    function init() {
        // Don't inject on login page
        const currentPage = getCurrentPage();
        if (currentPage === 'login.html' || currentPage === 'index.html') return;

        // Inject HTML
        const container = document.createElement('div');
        container.innerHTML = buildSidebarHTML();
        while (container.firstChild) {
            document.body.insertBefore(container.firstChild, document.body.firstChild);
        }

        // Add body class
        document.body.classList.add('has-sidebar');

        // Restore collapsed state
        const sidebar = document.getElementById('nexoSidebar');
        const isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
        }

        // Collapse toggle
        const collapseBtn = document.getElementById('sidebarCollapseBtn');
        collapseBtn.addEventListener('click', () => {
            const willCollapse = !sidebar.classList.contains('collapsed');
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem(STORAGE_KEY, willCollapse);
        });

        // Logout
        const logoutBtn = document.getElementById('sidebarLogout');
        logoutBtn.addEventListener('click', () => {
            // Clear cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_data'); // Matches auth.js

            window.location.href = '/login.html';
        });

        // Mobile hamburger
        const hamburger = document.getElementById('sidebarHamburger');
        const overlay = document.getElementById('sidebarOverlay');

        hamburger.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            overlay.style.display = 'block';
            requestAnimationFrame(() => overlay.classList.add('visible'));
        });

        function closeMobile() {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('visible');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }

        overlay.addEventListener('click', closeMobile);

        // Keyboard shortcut: Ctrl+B to toggle collapse
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                // On mobile, toggle mobile-open instead
                if (window.innerWidth <= 768) {
                    if (sidebar.classList.contains('mobile-open')) {
                        closeMobile();
                    } else {
                        hamburger.click();
                    }
                } else {
                    collapseBtn.click();
                }
            }
        });

        // Close mobile sidebar on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
                closeMobile();
            }
        });

        // Close mobile sidebar on link click
        sidebar.querySelectorAll('.sidebar-item[href]').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMobile();
                }
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
