function getToken() {
  return localStorage.getItem("token");
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
