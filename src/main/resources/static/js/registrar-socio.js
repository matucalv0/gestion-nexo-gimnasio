if (document.body.id === "registrarSocioPage") {
  const form = document.getElementById("registrarSocioForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const data = {
      nombre: document.getElementById("fullname").value,
      email: document.getElementById("email").value,
      telefono: document.getElementById("telefono").value,
      dni: document.getElementById("dni").value,
      fecha_nacimiento: document.getElementById("fechaNacimiento").value
    };

    try {
      const res = await authFetch("/socios", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("Error: " + (errorData.message || res.statusText));
        return;
      }

      const responseData = await res.json();
      alert("Socio registrado correctamente!");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Error al enviar los datos");
    }
  });
}
