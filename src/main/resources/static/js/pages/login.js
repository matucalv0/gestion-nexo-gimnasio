import { saveSession } from "../auth/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");
  const errorText = document.getElementById("loginErrorText");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnArrow = document.getElementById("btnArrow");
  const btnSpinner = document.getElementById("btnSpinner");

  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const eyeIconOpen = document.getElementById("eyeIconOpen");
  const eyeIconClosed = document.getElementById("eyeIconClosed");

  // Toggle Password Visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");
      if (eyeIconOpen && eyeIconClosed) {
        eyeIconOpen.classList.toggle("hidden", isPassword);
        eyeIconClosed.classList.toggle("hidden", !isPassword);
      }
      passwordInput.focus();
    });
  }

  function showError(message) {
    if (errorText && errorBox) {
      errorText.textContent = message;
      errorBox.classList.add("visible");
    }
  }

  function clearError() {
    if (errorText && errorBox) {
      errorText.textContent = "";
      errorBox.classList.remove("visible");
    }
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (btnText) btnText.textContent = isLoading ? "Ingresando..." : "Ingresar";
    if (btnArrow) btnArrow.classList.toggle("hidden", isLoading);
    if (btnSpinner) btnSpinner.classList.toggle("hidden", !isLoading);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      showError("Complete todos los campos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (res.status === 429) {
        throw new Error("Demasiados intentos. Esperá unos minutos antes de intentar de nuevo.");
      }

      if (!res.ok) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const data = await res.json();

      // Guardar sesión (el servidor envía user info, el token va solo en cookie HttpOnly)
      saveSession(data);

      window.location.href = "/index.html#/home";

    } catch (err) {
      showError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  });
});
