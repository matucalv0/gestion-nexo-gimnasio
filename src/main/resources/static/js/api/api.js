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
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    }
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error("Unauthorized");
  }

  return response;
}
