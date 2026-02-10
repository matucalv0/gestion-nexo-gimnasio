/**
 * Sistema de alertas y notificaciones personalizadas para NEXO
 */
export const Alerta = {
  /**
   * Asegura que los contenedores necesarios existan en el DOM
   */
  _init() {
    // Contenedor de Toasts (Notificaciones)
    if (!document.getElementById("notification-container")) {
      const container = document.createElement("div");
      container.id = "notification-container";
      container.className = "fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none";
      document.body.appendChild(container);

      // Agregar estilos de animación si no existen
      if (!document.getElementById("alerta-styles")) {
        const style = document.createElement("style");
        style.id = "alerta-styles";
        style.textContent = `
                    @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
                    @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
                    .animate-fade-out { animation: fade-out 0.3s ease-out forwards; }
                    .animate-scale-up { animation: scale-up 0.2s ease-out forwards; }
                    #notification-container > * { pointer-events: auto; }
                `;
        document.head.appendChild(style);
      }
    }

    // Modal de Confirmación
    if (!document.getElementById("modalConfirmacion")) {
      const modal = document.createElement("div");
      modal.id = "modalConfirmacion";
      modal.className = "hidden fixed inset-0 bg-black/80 items-center justify-center z-[110] p-4 backdrop-blur-sm";
      modal.innerHTML = `
                <div class="bg-[#121212] rounded-2xl border border-gray-800 max-w-md w-full p-6 shadow-2xl animate-scale-up">
                    <div class="flex items-center gap-4 mb-4 text-[#FF6B2C]">
                        <div class="p-3 bg-[#FF6B2C]/10 rounded-full">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 id="confirmTitulo" class="text-xl font-bold text-white">Confirmar acción</h3>
                    </div>
                    <p id="confirmMensaje" class="text-gray-400 mb-8 leading-relaxed"></p>
                    <div class="flex gap-3">
                        <button id="btnCancelAction" class="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all border border-gray-700">Cancelar</button>
                        <button id="btnConfirmAction" class="flex-1 px-4 py-3 rounded-xl bg-[#FF6B2C] hover:bg-[#e85a1f] text-white font-bold transition-all shadow-lg shadow-[#FF6B2C]/20">Confirmar</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }
  },

  /**
   * Muestra un toast (notificación flotante)
   */
  mensaje(mensaje, tipo = "success") {
    this._init();
    const container = document.getElementById("notification-container");

    const toast = document.createElement("div");
    const colors = {
      success: "border-green-500/50 bg-green-500/10 text-green-400",
      error: "border-red-500/50 bg-red-500/10 text-red-400",
      warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
      info: "border-blue-500/50 bg-blue-500/10 text-blue-400"
    };

    toast.className = `flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-up mb-3 min-w-[300px] max-w-md ${colors[tipo] || colors.info}`;

    const icons = {
      success: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      error: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      warning: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      info: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
            <div class="flex-shrink-0">${icons[tipo] || icons.info}</div>
            <div class="flex-1 font-medium text-sm">${mensaje}</div>
            <button class="flex-shrink-0 hover:opacity-70 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;

    toast.querySelector("button").onclick = () => toast.remove();

    container.appendChild(toast);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("animate-fade-out");
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  },

  success(mensaje) { this.mensaje(mensaje, "success"); },
  error(mensaje) { this.mensaje(mensaje, "error"); },
  warning(mensaje) { this.mensaje(mensaje, "warning"); },
  info(mensaje) { this.mensaje(mensaje, "info"); },

  /**
   * Muestra un modal de confirmación
   */
  confirm({ titulo, mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", onConfirm }) {
    this._init();
    const modal = document.getElementById("modalConfirmacion");

    document.getElementById("confirmTitulo").textContent = titulo;
    document.getElementById("confirmMensaje").textContent = mensaje;

    const btnConfirm = document.getElementById("btnConfirmAction");
    const btnCancel = document.getElementById("btnCancelAction");

    btnConfirm.textContent = textoConfirmar;
    btnCancel.textContent = textoCancelar;

    // Resetear listeners
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    newBtnConfirm.onclick = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      if (onConfirm) onConfirm();
    };

    newBtnCancel.onclick = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    };
  }
};
