let catalogo = [];   // ARRAY con todos los servicios

const modal      = document.getElementById("modalServicio");
const formulario = document.getElementById("formServicio");
const tbody      = document.getElementById("tablaServicios");
const vacio      = document.getElementById("estadoVacio");
const tablaWrap  = document.getElementById("tablaWrap");
const buscador   = document.getElementById("buscador");

function abrirModal()  { formulario.reset(); modal.classList.remove("hidden"); formulario.nombre.focus(); }
function cerrarModal() { modal.classList.add("hidden"); }

function dibujarTabla(servicios) {
    tbody.innerHTML = "";
    const hayDatos = servicios.length > 0;
    vacio.classList.toggle("hidden", hayDatos);
    tablaWrap.classList.toggle("hidden", !hayDatos);

    servicios.forEach(s => {
        const tr = document.createElement("tr");
        tr.appendChild(celda(s.nombre));
        tr.appendChild(celda(s.descripcion));
        tr.appendChild(celda("$" + Number(s.precio_estimado).toFixed(2)));

        const tdEstado = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = s.activo ? "Activo" : "Inactivo";
        tdEstado.appendChild(badge);
        tr.appendChild(tdEstado);

        const tdAcc = document.createElement("td");

        const btnToggle = document.createElement("button");
        btnToggle.className = "btn-secondary";
        btnToggle.style.marginRight = "6px";
        btnToggle.textContent = s.activo ? "Desactivar" : "Activar";
        btnToggle.addEventListener("click", () => cambiarActivo(s));

        const btnDel = document.createElement("button");
        btnDel.className = "btn-danger";
        btnDel.textContent = "Eliminar";
        btnDel.addEventListener("click", () => eliminar(s));

        tdAcc.appendChild(btnToggle);
        tdAcc.appendChild(btnDel);
        tr.appendChild(tdAcc);

        tbody.appendChild(tr);
    });
}

async function cargarCatalogo() {
    try {
        catalogo = await db.listarServicios();
        filtrar();
    } catch (e) {
        console.error(e);
        mostrarMensaje("No se pudo cargar el catálogo: " + e.message, true);
    }
}

function filtrar() {
    const q = buscador.value.trim().toLowerCase();
    const resultado = !q ? catalogo : catalogo.filter(s =>
        [s.nombre, s.descripcion].some(c => (c || "").toLowerCase().includes(q)));
    dibujarTabla(resultado);
}

async function cambiarActivo(s) {
    try {
        await db.cambiarActivoServicio(s);
        cargarCatalogo();
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
}

async function eliminar(s) {
    if (!confirm(`¿Eliminar el servicio "${s.nombre}"?`)) return;
    try {
        await db.eliminarServicio(s);
        mostrarMensaje("Servicio eliminado");
        cargarCatalogo();
    } catch (e) {
        mostrarMensaje(e.message, true);
    }
}

formulario.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const datos = {
        nombre: formulario.nombre.value.trim(),
        descripcion: formulario.descripcion.value.trim() || null,
        precio_estimado: parseFloat(formulario.precio_estimado.value)
    };
    if (!datos.nombre || isNaN(datos.precio_estimado) || datos.precio_estimado < 0) {
        mostrarMensaje("Escribe un nombre y un precio válido", true);
        return;
    }
    const btn = formulario.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
        await db.crearServicio(datos);
        cerrarModal();
        mostrarMensaje("Servicio agregado");
        cargarCatalogo();
    } catch (e) {
        mostrarMensaje(e.message, true);
    } finally {
        btn.disabled = false;
    }
});

document.getElementById("btnNuevoServicio").addEventListener("click", abrirModal);
document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
buscador.addEventListener("input", filtrar);

cargarCatalogo();
