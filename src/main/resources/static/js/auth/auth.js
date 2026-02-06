export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

export function checkAuth() {
  if (!getToken()) {
    window.location.href = "/login.html";
  }
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Map JWT claims to user object. Adjust keys based on your JWT structure.
    // Assuming backend sends: sub (username), rol (role), dni (dniEmpleado)
    return {
      username: payload.sub,
      rol: payload.rol || payload.authorities, // Spring Security often sends authorities
      empleadoDni: payload.dni || payload.empleadoDni // check how backend issues token
    };
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}

