let ordenes = [];
let equiposLibres = [];

const ESTADOS = ["Pendiente", "En reparación", "Terminado"];

const modal      = document.getElementById("modalOrden");
const formulario = document.getElementById("formOrden");
const tbody      = document.getElementById("tablaOrdenes");
const vacio      = document.getElementById("estadoVacio");
const tablaWrap  = document.getElementById("tablaWrap");
const selEquipo  = document.getElementById("equipo_id");
const lista      = document.getElementById("listaServicios");

function cerrarModal() { modal.classList.add("hidden"); }

function calcularTotal() {
    let total = 0;
    lista.querySelectorAll("input:checked").forEach(c => total += parseFloat(c.dataset.precio));
    document.getElementById("totalOrden").textContent = "$" + total.toFixed(2);
}
function mostrarProblema() {
    const eq = equiposLibres.find(e => e.id === Number(selEquipo.value));
    document.getElementById("problemaEquipo").textContent = eq ? eq.descripcion_problema : "—";
}

async function abrirModal() {
    try {
        const [equipos, servicios] = await Promise.all([db.listarEquipos(), db.listarServicios()]);

        // Solo equipos que todavía no tienen orden
        equiposLibres = equipos.filter(e => e.estado === "Registrado");
        if (equiposLibres.length === 0) {
            mostrarMensaje("No hay equipos sin orden. Registra un equipo primero.", true);
            return;
        }
        const activos = servicios.filter(s => s.activo);
        if (activos.length === 0) {
            mostrarMensaje("No hay servicios activos en el catálogo.", true);
            return;
        }

        formulario.reset();

        selEquipo.innerHTML = "";
        equiposLibres.forEach(e => {
            const op = document.createElement("option");
            op.value = e.id;
            op.textContent = `${e.codigo} - ${e.tipo} ${e.marca || ""} ${e.modelo || ""}`.trim();
            selEquipo.appendChild(op);
        });
 mostrarProblema();
        lista.innerHTML = "";
        activos.forEach(s => {
            const fila = document.createElement("label");
            fila.className = "check-row";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.value = s.id;
            chk.dataset.precio = s.precio_estimado;
            chk.addEventListener("change", calcularTotal);

            const nombre = document.createElement("span");
            nombre.textContent = s.nombre;

            const precio = document.createElement("span");
            precio.className = "precio";
            precio.textContent = "$" + Number(s.precio_estimado).toFixed(2);

            fila.append(chk, nombre, precio);
            lista.appendChild(fila);
        });

        calcularTotal();
        modal.classList.remove("hidden");
    } catch (e) {
        console.error(e);
        mostrarMensaje("Error: " + e.message, true);
    }
}

function dibujarTabla() {
    tbody.innerHTML = "";
    const hayDatos = ordenes.length > 0;
    vacio.classList.toggle("hidden", hayDatos);
    tablaWrap.classList.toggle("hidden", !hayDatos);

    // Más recientes arriba
    [...ordenes].reverse().forEach(o => {
        const tr = document.createElement("tr");
        tr.appendChild(celda("#" + o.id));

                const eq = o.equipos;
        tr.appendChild(celda(o.equipo_nombre ||
            (eq ? `${eq.codigo} · ${eq.tipo} ${eq.marca || ""} ${eq.modelo || ""}`.trim() : "—")));

        const nombres = (o.orden_servicios || []).map(x => x.servicios.nombre).join(", ");
        tr.appendChild(celda(nombres));

        tr.appendChild(celda(o.prioridad));
        tr.appendChild(celda("$" + Number(o.costo).toFixed(2)));

        const tdEstado = document.createElement("td");
        const sel = document.createElement("select");
        sel.style.width = "auto";
        ESTADOS.forEach(e => {
            const op = document.createElement("option");
            op.textContent = e;
            op.selected = e === o.estado;
            sel.appendChild(op);
        });
        sel.addEventListener("change", () => cambiarEstado(o, sel.value));
        tdEstado.appendChild(sel);
        tr.appendChild(tdEstado);

        tr.appendChild(celda(formatearFecha(o.created_at)));

        const tdAcc = document.createElement("td");
        const btn = document.createElement("button");
        btn.className = "btn-danger";
        btn.textContent = "Eliminar";
        btn.addEventListener("click", () => eliminar(o));
        tdAcc.appendChild(btn);
        tr.appendChild(tdAcc);

        tbody.appendChild(tr);
    });
}

async function cargarOrdenes() {
    try {
        ordenes = await db.listarOrdenes();
        dibujarTabla();
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudieron cargar las órdenes: " + e.message, true);
    }
}

async function cambiarEstado(o, nuevo) {
    try {
        await db.cambiarEstadoOrden(o, nuevo);
        mostrarMensaje(`Orden #${o.id}: ${nuevo}`);
        cargarOrdenes();
    } catch (e) {
        mostrarMensaje(e.message, true);
        cargarOrdenes();
    }
}

async function eliminar(o) {
    if (!confirm(`¿Eliminar la orden #${o.id}?`)) return;
    try {
        await db.eliminarOrden(o);
        mostrarMensaje("Orden eliminada");
        cargarOrdenes();
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
}

formulario.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const elegidos = [...lista.querySelectorAll("input:checked")].map(c => ({
        servicio_id: Number(c.value),
        cantidad: 1,
        precio_unitario: parseFloat(c.dataset.precio)
    }));
    if (elegidos.length === 0) {
        mostrarMensaje("Elige al menos un servicio", true);
        return;
    }

    const equipo = equiposLibres.find(e => e.id === Number(selEquipo.value));
    const btn = formulario.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
        const orden = await db.crearOrden({
            equipo,
            prioridad: formulario.prioridad.value,
            notas: formulario.notas.value.trim() || null,
            servicios: elegidos
        });
        cerrarModal();
        mostrarMensaje(`Orden #${orden.id} creada`);
        cargarOrdenes();
    } catch (e) {
        console.error(e);
        mostrarMensaje("Error al crear la orden: " + e.message, true);
    } finally {
        btn.disabled = false;
    }
});

document.getElementById("btnNuevaOrden").addEventListener("click", abrirModal);
document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
selEquipo.addEventListener("change", mostrarProblema);
cargarOrdenes();
