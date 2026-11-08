let listaEquipos = [];

const modal      = document.getElementById("modalEquipo");
const formulario = document.getElementById("formEquipo");
const tbody      = document.getElementById("tablaEquipos");
const vacio      = document.getElementById("estadoVacio");
const tablaWrap  = document.getElementById("tablaWrap");
const buscador   = document.getElementById("buscador");

function abrirModal()  { formulario.reset(); modal.classList.remove("hidden"); formulario.tipo.focus(); }
function cerrarModal() { modal.classList.add("hidden"); }

function dibujarTabla(equipos) {
    tbody.innerHTML = "";
    const hayDatos = equipos.length > 0;
    vacio.classList.toggle("hidden", hayDatos);
    tablaWrap.classList.toggle("hidden", !hayDatos);

    equipos.forEach(eq => {
        const tr = document.createElement("tr");
        tr.appendChild(celda(eq.codigo));
        tr.appendChild(celda(eq.tipo));
        tr.appendChild(celda(`${eq.marca || ""} ${eq.modelo || ""}`.trim() || "—"));
        tr.appendChild(celda(eq.descripcion_problema));

        const tdEstado = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = eq.estado;
        tdEstado.appendChild(badge);
        tr.appendChild(tdEstado);

        tr.appendChild(celda(formatearFecha(eq.created_at)));

        const tdAcc = document.createElement("td");
        const btn = document.createElement("button");
        btn.className = "btn-danger";
        btn.textContent = "Eliminar";
        btn.addEventListener("click", () => eliminar(eq));
        tdAcc.appendChild(btn);
        tr.appendChild(tdAcc);

        tbody.appendChild(tr);
    });
}

async function cargarEquipos() {
    try {
        listaEquipos = await db.listarEquipos();
        filtrar();
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudieron cargar los equipos: " + e.message, true);
    }
}

function filtrar() {
    const q = buscador.value.trim().toLowerCase();
    const resultado = !q ? listaEquipos : listaEquipos.filter(eq =>
        [eq.codigo, eq.tipo, eq.marca, eq.modelo, eq.descripcion_problema]
            .some(c => (c || "").toLowerCase().includes(q)));
    dibujarTabla(resultado);
}

async function eliminar(eq) {
    if (!confirm(`¿Eliminar el equipo ${eq.codigo}?`)) return;
    try {
        await db.eliminarEquipo(eq);
        mostrarMensaje("Equipo eliminado");
        cargarEquipos();
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
}

formulario.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const datos = {
        tipo: formulario.tipo.value,
        marca: formulario.marca.value.trim() || null,
        modelo: formulario.modelo.value.trim() || null,
        descripcion_problema: formulario.descripcion_problema.value.trim()
    };
    if (!datos.descripcion_problema) {
        mostrarMensaje("Describe el problema del equipo", true);
        return;
    }
    const btn = formulario.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
        const nuevo = await db.crearEquipo(datos);
        cerrarModal();
        mostrarMensaje(`Equipo ${nuevo.codigo} registrado`);
        cargarEquipos();
    } catch (e) {
        console.error(e);
        mostrarMensaje("Error al registrar: " + e.message, true);
    } finally {
        btn.disabled = false;
    }
});

document.getElementById("btnNuevoEquipo").addEventListener("click", abrirModal);
document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
buscador.addEventListener("input", filtrar);

cargarEquipos();
