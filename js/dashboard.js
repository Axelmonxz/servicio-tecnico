document.getElementById("btnNuevoEquipo").addEventListener("click", () => {
    window.location.href = "pages/equipos.html";
});

async function cargarContadores() {
    try {
        const [equipos, pendientes, reparacion, terminados] = await Promise.all([
            db.contar("equipos"),
            db.contar("ordenes", "Pendiente"),
            db.contar("ordenes", "En reparación"),
            db.contar("ordenes", "Terminado")
        ]);
        document.getElementById("totalEquipos").textContent = equipos;
        document.getElementById("totalPendientes").textContent = pendientes;
        document.getElementById("totalReparacion").textContent = reparacion;
        document.getElementById("totalTerminados").textContent = terminados;
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudieron cargar los datos: " + e.message, true);
    }
}

cargarContadores();
