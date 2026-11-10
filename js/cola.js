let pendientes = [];     // COLA: la primera es la que llegó antes (FIFO)
let enReparacion = [];

const tbodyCola = document.getElementById("tablaCola");
const tbodyRep  = document.getElementById("tablaReparacion");
const vacioCola = document.getElementById("vacioCola");
const vacioRep  = document.getElementById("vacioRep");
const wrapCola  = document.getElementById("wrapCola");
const wrapRep   = document.getElementById("wrapRep");
const btnAtender = document.getElementById("btnAtender");

function nombreEquipo(o) {
    if (o.equipo_nombre) return o.equipo_nombre;
    const e = o.equipos;
    return e ? `${e.codigo} · ${e.tipo} ${e.marca || ""} ${e.modelo || ""}`.trim() : "—";
}

function dibujarCola() {
    tbodyCola.innerHTML = "";
    vacioCola.classList.toggle("hidden", pendientes.length > 0);
    wrapCola.classList.toggle("hidden", pendientes.length === 0);
    btnAtender.disabled = pendientes.length === 0;

    pendientes.forEach((o, i) => {
        const tr = document.createElement("tr");
        tr.appendChild(celda(i === 0 ? "1 (siguiente)" : String(i + 1)));
        tr.appendChild(celda("#" + o.id));
        tr.appendChild(celda(nombreEquipo(o)));
        tr.appendChild(celda(o.prioridad));
        tr.appendChild(celda("$" + Number(o.costo).toFixed(2)));
        tr.appendChild(celda(formatearFecha(o.created_at)));
        tbodyCola.appendChild(tr);
    });
}

function dibujarReparacion() {
    tbodyRep.innerHTML = "";
    vacioRep.classList.toggle("hidden", enReparacion.length > 0);
    wrapRep.classList.toggle("hidden", enReparacion.length === 0);

    enReparacion.forEach(o => {
        const tr = document.createElement("tr");
        tr.appendChild(celda("#" + o.id));
        tr.appendChild(celda(nombreEquipo(o)));
        tr.appendChild(celda("$" + Number(o.costo).toFixed(2)));

        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.textContent = "Marcar terminado";
        btn.addEventListener("click", () => cambiar(o, "Terminado"));
        td.appendChild(btn);
        tr.appendChild(td);

        tbodyRep.appendChild(tr);
    });
}

async function cargar() {
    try {
        const todas = await db.listarOrdenes();   // ya vienen de la más antigua a la más nueva
        pendientes   = todas.filter(o => o.estado === "Pendiente");
        enReparacion = todas.filter(o => o.estado === "En reparación");
        dibujarCola();
        dibujarReparacion();
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudo cargar la cola: " + e.message, true);
    }
}

async function cambiar(orden, estado) {
    try {
        await db.cambiarEstadoOrden(orden, estado);
        await cargar();
        if (estado === "Terminado" && orden.equipo_id) {
            ofrecerEliminarEquipo(orden);
        } else {
            mostrarMensaje(`Orden #${orden.id}: ${estado}`);
        }
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
}
// Aviso temporal: durante 8 segundos se puede eliminar el equipo de la lista de Equipos
function ofrecerEliminarEquipo(orden) {
    let segundos = 8;

    const caja = document.createElement("div");
    caja.className = "toast toast-accion";

    const texto = document.createElement("span");
    texto.textContent = `Orden #${orden.id} terminada.`;

    const btn = document.createElement("button");
    btn.className = "btn-danger";
    const actualizar = () => { btn.textContent = `Eliminar equipo de Equipos (${segundos}s)`; };
    actualizar();

    const cerrar = () => { clearInterval(temporizador); caja.remove(); };

    const temporizador = setInterval(() => {
        segundos--;
        if (segundos <= 0) cerrar();
        else actualizar();
    }, 1000);

    btn.addEventListener("click", async () => {
        cerrar();
        try {
            await db.eliminarEquipoTerminado(orden);
            mostrarMensaje("Equipo eliminado de Equipos");
            cargar();
        } catch (e) {
            mostrarMensaje(e.message, true);
        }
    });

    caja.append(texto, btn);
    document.body.appendChild(caja);
}
// DESENCOLAR: solo se puede atender al que está al frente de la cola
btnAtender.addEventListener("click", () => {
    if (pendientes.length === 0) return;
    cambiar(pendientes[0], "En reparación");
});

cargar();
