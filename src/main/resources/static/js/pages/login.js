document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorText = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorText.textContent = "";

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      errorText.textContent = "Complete todos los campos";
      return;
    }

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);

      window.location.href = "/home.html";

    } catch (err) {
      errorText.textContent = err.message;
    }
  });
});

