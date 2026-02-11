// Utilidades DOM para el módulo Finanzas (MPA)
// Objetivo: mantener IDs/rutas existentes y mejorar la mantenibilidad.

/** @param {string} id */
export function byId(id) {
  return document.getElementById(id);
}

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {NodeListOf<T>}
 */
export function qsa(selector, root = document) {
  return root.querySelectorAll(selector);
}

/**
 * Elimina todos los hijos que matchean un selector dentro de un root.
 * @param {ParentNode} root
 * @param {string} selector
 */
export function removeAll(root, selector) {
  root.querySelectorAll(selector).forEach((n) => n.remove());
}

/**
 * Alterna visibilidad con la clase `hidden`.
 * @param {HTMLElement | null} el
 * @param {boolean} visible
 */
export function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

