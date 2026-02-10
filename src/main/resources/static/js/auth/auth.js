export function getToken() {
  // Ya no usamos token en localStorage para Auth (se usa Cookie HttpOnly)
  return null;
}

export function logout() {
  localStorage.removeItem("user");
  // Idealmente llamar al backend para borrar cookie, pero por ahora redirect invalida la sesión UI
  document.cookie = "jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"; // Intentar borrar cookie desde JS (no funcionará si es HttpOnly, pero por si acaso)
  window.location.href = "/login.html";
}

export function checkAuth() {
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
  } catch (e) {
    console.error("Error saving session", e);
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

