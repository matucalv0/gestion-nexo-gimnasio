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

