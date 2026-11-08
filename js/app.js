document.addEventListener("DOMContentLoaded", () => {
    console.log("TechFix iniciado correctamente");
});

function mostrarMensaje(texto, esError = false) {
    const t = document.createElement("div");
    t.className = "toast" + (esError ? " error" : "");
    t.textContent = texto;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function celda(texto) {
    const td = document.createElement("td");
    td.textContent = texto ?? "—";
    return td;
}

function formatearFecha(iso) {
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}
