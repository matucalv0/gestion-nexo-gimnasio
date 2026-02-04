import { getToken, logout } from "../auth/auth.js";

const API_URL = "http://localhost:8080";

export async function authFetch(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(API_URL + endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
