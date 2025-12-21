console.log("JS cargado");

document.getElementById("btnClick").addEventListener("click", () => {
    console.log("Botón clickeado");
    fetch("/socios", {
        headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
     }
    }
    )
        .then(res => {
            console.log("Response:", res);
            return res.json();
        })
        .then(data => {
            console.log("Data recibida:", data);
            const ul = document.getElementById("lista");
            ul.innerHTML = "";
            data.forEach(socio => {
                const li = document.createElement("li");
                li.textContent = `${socio.dni} - ${socio.nombre}`;
                ul.appendChild(li);
            });
        })
        .catch(err => console.error("Error fetch:", err));
});
