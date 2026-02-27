import { getToken, logout } from "../auth/auth.js";

const API_URL = "";

export async function authFetch(endpoint, options = {}) {
  const token = getToken();

  // No setear Content-Type si el body es FormData (el navegador lo hace automáticamente)
  const isFormData = options.body instanceof FormData;

  const response = await fetch(API_URL + endpoint, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      // Authorization header removed (using Cookies now)
      ...(options.headers || {})
    }
  });

  if (response.status === 401 || response.status === 403) {
    await logout();
    console.error("Error de autenticación/autorización en:", endpoint, "Status:", response.status);
    throw new Error("Unauthorized");
  }

  return response;
}

