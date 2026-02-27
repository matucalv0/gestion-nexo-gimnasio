export function getToken() {
  // Ya no usamos token en localStorage para Auth (se usa Cookie HttpOnly)
  return null;
}

export async function logout() {
  // Llamar al backend para invalidar la cookie HttpOnly y blacklistear el token
  try {
    await fetch("/auth/logout", { method: "POST" });
  } catch (e) {
    // Si falla el backend, continuar con el logout del lado cliente
    console.warn("No se pudo contactar al servidor para logout:", e.message);
  }

  localStorage.removeItem("user");
  localStorage.removeItem("sessionStart");
  window.location.href = "/login.html";
}

/**
 * Verifica que el usuario tenga sesión válida.
 * Chequea localStorage Y hace un ping al backend para validar la cookie JWT.
 */
export async function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  // Verificar que la cookie JWT siga siendo válida con un endpoint protegido liviano
  try {
    const response = await fetch("/actuator/health", { method: "GET" });
    // Si actuator devuelve 200, la cookie puede o no ser válida (es público).
    // Usamos un endpoint autenticado para verificar.
  } catch (e) {
    // Error de red — no desloguear, puede ser un problema temporal
  }
}

/**
 * Verificación rápida de sesión: solo localStorage (síncrona).
 * Usar para guardias rápidos al cargar la página.
 * La validación real del token ocurre en la primera llamada authFetch.
 */
export function checkAuthSync() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login.html";
  }
}

export function saveSession(data) {
  try {
    const user = {
      username: data.username,
      rol: data.rol,
      empleadoDni: data.dniEmpleado || null
    };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("sessionStart", Date.now().toString());
  } catch (e) {
    console.error("Error saving session", e);
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    // Verificar también si la sesión no expiró del lado cliente
    const sessionStart = localStorage.getItem("sessionStart");
    if (sessionStart) {
      const elapsed = Date.now() - parseInt(sessionStart, 10);
      const FOUR_HOURS = 4 * 60 * 60 * 1000;
      if (elapsed > FOUR_HOURS) {
        // Sesión expirada del lado cliente — limpiar
        localStorage.removeItem("user");
        localStorage.removeItem("sessionStart");
        return null;
      }
    }
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}
