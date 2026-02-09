/**
 * Renderiza controles de paginación simples: Anterior, Info Página, Siguiente.
 * @param {HTMLElement} container - Elemento contenedor donde se renderizará.
 * @param {number} currentPage - Página actual (0-indexada).
 * @param {number} totalPages - Total de páginas.
 * @param {Function} onPageChange - Callback(newPage) al cambiar de página.
 */
export function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (!container) return;
    container.innerHTML = "";

    if (totalPages <= 1) return;

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.className = `
    px-3 py-1 rounded text-sm font-medium transition
    ${currentPage > 0
            ? "bg-[#1a1a1a] text-[var(--beige)] hover:bg-[#252525] border border-[var(--input-border)]"
            : "bg-transparent text-gray-600 cursor-not-allowed"}
  `;
    btnPrev.disabled = currentPage === 0;
    btnPrev.onclick = () => {
        if (currentPage > 0) onPageChange(currentPage - 1);
    };

    const spanInfo = document.createElement("span");
    spanInfo.className = "text-sm text-gray-400";
    spanInfo.textContent = `Página ${currentPage + 1} de ${totalPages}`;

    const btnNext = document.createElement("button");
    btnNext.textContent = "Siguiente";
    btnNext.className = `
    px-3 py-1 rounded text-sm font-medium transition
    ${currentPage < totalPages - 1
            ? "bg-[#1a1a1a] text-[var(--beige)] hover:bg-[#252525] border border-[var(--input-border)]"
            : "bg-transparent text-gray-600 cursor-not-allowed"}
  `;
    btnNext.disabled = currentPage >= totalPages - 1;
    btnNext.onclick = () => {
        if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
    };

    const wrapper = document.createElement("div");
    wrapper.className = "flex items-center gap-4 mt-4 justify-end";

    wrapper.appendChild(btnPrev);
    wrapper.appendChild(spanInfo);
    wrapper.appendChild(btnNext);

    container.appendChild(wrapper);
}
