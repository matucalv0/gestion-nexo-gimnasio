document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault(); 

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  document.getElementById("loginError").textContent = "";

  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Usuario o contraseña incorrectos");
      }
      return res.json();
    })
    .then(data => {
      localStorage.setItem("token", data.token);
      window.location.href = "/home.html";
    })
    .catch(err => {
      document.getElementById("loginError").textContent = err.message;
    });
});
