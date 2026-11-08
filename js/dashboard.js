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

async function cargarActividad() {
    try {
        const ultimas = await db.listarHistorial(5);   // los 5 elementos del tope de la pila
        const tbody = document.getElementById("tablaActividad");
        tbody.innerHTML = "";
        document.getElementById("vacioActividad").classList.toggle("hidden", ultimas.length > 0);
        document.getElementById("wrapActividad").classList.toggle("hidden", ultimas.length === 0);

        ultimas.forEach(h => {
            const tr = document.createElement("tr");
            tr.appendChild(celda(h.accion));
            tr.appendChild(celda(h.detalle));
            tr.appendChild(celda(formatearFecha(h.created_at)));
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}

cargarContadores();
cargarActividad();
