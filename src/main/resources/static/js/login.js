document.getElementById("btnLogin").addEventListener("click", () =>{

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  document.getElementById("mensaje").textContent = "";

  fetch("/auth/login", {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
     },
     body: JSON.stringify({ username, password})
  }).then(res => {
    if (!res.ok) {
      throw new Error("Usuario o contraseña incorrectos")
    }
    return res.json();
  }).then(data => {
    localStorage.setItem("token", data.token);
    window.location.href = "/index.html";
  }).catch(err => {document.getElementById("mensaje").textContent = err.message;})


});