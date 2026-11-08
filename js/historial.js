let pila = [];   // PILA: el índice 0 es el tope (la acción más reciente)

const tbody     = document.getElementById("tablaHistorial");
const vacio     = document.getElementById("estadoVacio");
const tablaWrap = document.getElementById("tablaWrap");
const contador  = document.getElementById("contador");
const btnPop    = document.getElementById("btnPop");

function dibujarPila() {
    tbody.innerHTML = "";
    const hayDatos = pila.length > 0;
    vacio.classList.toggle("hidden", hayDatos);
    tablaWrap.classList.toggle("hidden", !hayDatos);
    btnPop.disabled = !hayDatos;
    contador.textContent = hayDatos ? `${pila.length} acciones (mostrando las últimas 100)` : "";

    pila.forEach((h, i) => {
        const tr = document.createElement("tr");
        tr.appendChild(celda(i === 0 ? "▶ Tope" : String(i + 1)));

        const tdAccion = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = h.accion;
        tdAccion.appendChild(badge);
        tr.appendChild(tdAccion);

        tr.appendChild(celda(h.entidad));
        tr.appendChild(celda(h.detalle));
        tr.appendChild(celda(formatearFecha(h.created_at)));
        tbody.appendChild(tr);
    });
}

async function cargarHistorial() {
    try {
        pila = await db.listarHistorial();
        dibujarPila();
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudo cargar el historial: " + e.message, true);
    }
}

btnPop.addEventListener("click", async () => {
    if (!confirm("¿Quitar la última acción del historial?")) return;
    try {
        await db.quitarUltimoHistorial();
        mostrarMensaje("Última acción eliminada (pop)");
        cargarHistorial();
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
});

cargarHistorial();
