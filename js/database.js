const SUPABASE_URL = "https://vjuiosdotumyqwsmslvx.supabase.co";
const SUPABASE_KEY = "sb_publishable_fJ2vLnDlVFaM-N_pIwlJPA_B2hI1MeP";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("TechFix conectado a Supabase");

const db = {

    // ---------- EQUIPOS (LISTA) ----------
    async listarEquipos() {
        const { data, error } = await supabaseClient
            .from("equipos")
            .select("*")
                        .order("codigo", { ascending: true });
        if (error) throw error;
        return data;
    },

    async crearEquipo({ tipo, marca, modelo, descripcion_problema }) {
        const { data: ultimo, error: e1 } = await supabaseClient
            .from("equipos")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);
        if (e1) throw e1;

        let numero = ultimo.length ? ultimo[0].id + 1 : 1;

        for (let intento = 0; intento < 3; intento++, numero++) {
            const codigo = "EQ-" + String(numero).padStart(4, "0");
            const { data, error } = await supabaseClient
                .from("equipos")
                .insert({ codigo, tipo, marca, modelo, descripcion_problema })
                .select()
                .single();

            if (!error) {
                await db.registrarHistorial("Registrar", "equipo", data.id,
                    `Se registró ${data.tipo} ${data.marca || ""} ${data.modelo || ""} (${data.codigo})`.replace(/\s+/g, " "));
                return data;
            }
            if (error.code !== "23505") throw error;
        }
        throw new Error("No se pudo generar un código único");
    },

    async eliminarEquipo(equipo) {
        const { error } = await supabaseClient.from("equipos").delete().eq("id", equipo.id);
        if (error) {
            if (error.code === "23503") {
                throw new Error("Este equipo tiene órdenes de servicio; elimina primero sus órdenes.");
            }
            throw error;
        }
        await db.registrarHistorial("Eliminar", "equipo", equipo.id, `Se eliminó el equipo ${equipo.codigo}`);
    },

    // ---------- HISTORIAL (PILA) ----------
        // ---------- ÓRDENES ----------
    // Devuelve las órdenes en orden de llegada (la más antigua primero)
    async listarOrdenes() {
        const { data, error } = await supabaseClient
            .from("ordenes")
            .select("*, equipos(codigo, tipo, marca, modelo), orden_servicios(cantidad, servicios(nombre))")
            .order("created_at", { ascending: true });
        if (error) throw error;
        return data;
    },

    async crearOrden({ equipo, prioridad, notas, servicios }) {
        // Costo = suma de cantidad x precio de cada servicio elegido
        const costo = servicios.reduce((t, s) => t + s.cantidad * s.precio_unitario, 0);

        const { data: orden, error } = await supabaseClient
            .from("ordenes")
            .insert({ equipo_id: equipo.id, prioridad, notas, costo })
            .select()
            .single();
        if (error) throw error;

        const filas = servicios.map(s => ({
            orden_id: orden.id,
            servicio_id: s.servicio_id,
            cantidad: s.cantidad,
            precio_unitario: s.precio_unitario
        }));
        const { error: e2 } = await supabaseClient.from("orden_servicios").insert(filas);
        if (e2) {
            await supabaseClient.from("ordenes").delete().eq("id", orden.id);  // deshacer
            throw e2;
        }

        await supabaseClient.from("equipos").update({ estado: "Pendiente" }).eq("id", equipo.id);
        await db.registrarHistorial("Crear orden", "orden", orden.id,
            `Orden #${orden.id} para ${equipo.codigo} (costo $${costo.toFixed(2)})`);
        return orden;
    },

    async cambiarEstadoOrden(orden, nuevoEstado) {
        const { error } = await supabaseClient
            .from("ordenes").update({ estado: nuevoEstado }).eq("id", orden.id);
        if (error) throw error;

        await supabaseClient.from("equipos").update({ estado: nuevoEstado }).eq("id", orden.equipo_id);
        await db.registrarHistorial("Cambiar estado", "orden", orden.id,
            `Orden #${orden.id}: ${orden.estado} → ${nuevoEstado}`);
    },

    async eliminarOrden(orden) {
        const { error } = await supabaseClient.from("ordenes").delete().eq("id", orden.id);
        if (error) throw error;   // orden_servicios se borra solo (ON DELETE CASCADE)

        await supabaseClient.from("equipos").update({ estado: "Registrado" }).eq("id", orden.equipo_id);
        await db.registrarHistorial("Eliminar", "orden", orden.id, `Se eliminó la orden #${orden.id}`);
    },
        // ---------- CATÁLOGO DE SERVICIOS (ARRAY) ----------
    async listarServicios() {
        const { data, error } = await supabaseClient
            .from("servicios")
            .select("*")
            .order("nombre", { ascending: true });
        if (error) throw error;
        return data;
    },

    async crearServicio({ nombre, descripcion, precio_estimado }) {
        const { data, error } = await supabaseClient
            .from("servicios")
            .insert({ nombre, descripcion, precio_estimado })
            .select()
            .single();
        if (error) {
            if (error.code === "23505") throw new Error("Ya existe un servicio con ese nombre.");
            throw error;
        }
        await db.registrarHistorial("Agregar", "servicio", data.id, `Se agregó el servicio "${data.nombre}"`);
        return data;
    },

    async cambiarActivoServicio(servicio) {
        const { error } = await supabaseClient
            .from("servicios")
            .update({ activo: !servicio.activo })
            .eq("id", servicio.id);
        if (error) throw error;
        await db.registrarHistorial(servicio.activo ? "Desactivar" : "Activar", "servicio", servicio.id,
            `Servicio "${servicio.nombre}" ${servicio.activo ? "desactivado" : "activado"}`);
    },

    async eliminarServicio(servicio) {
        const { error } = await supabaseClient.from("servicios").delete().eq("id", servicio.id);
        if (error) {
            if (error.code === "23503") {
                throw new Error("Este servicio ya se usó en órdenes; mejor desactívalo.");
            }
            throw error;
        }
        await db.registrarHistorial("Eliminar", "servicio", servicio.id, `Se eliminó el servicio "${servicio.nombre}"`);
    },
    async registrarHistorial(accion, entidad, entidad_id, detalle) {
        const { error } = await supabaseClient
            .from("historial")
            .insert({ accion, entidad, entidad_id, detalle });
        if (error) console.error("No se pudo guardar en historial:", error);
    },
    // Devuelve el historial con la acción más reciente primero (el tope de la pila)
    async listarHistorial(limite = 100) {
        const { data, error } = await supabaseClient
            .from("historial")
            .select("*")
            .order("id", { ascending: false })
            .limit(limite);
        if (error) throw error;
        return data;
    },

    // POP: quita la acción que está en el tope
    async quitarUltimoHistorial() {
        const { data, error } = await supabaseClient
            .from("historial")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);
        if (error) throw error;
        if (data.length === 0) return false;

        const { error: e2 } = await supabaseClient
            .from("historial").delete().eq("id", data[0].id);
        if (e2) throw e2;
        return true;
    },
    // ---------- CONTADORES DEL DASHBOARD ----------
    async contar(tabla, filtroEstado) {
        let q = supabaseClient.from(tabla).select("*", { count: "exact", head: true });
        if (filtroEstado) q = q.eq("estado", filtroEstado);
        const { count, error } = await q;
        if (error) throw error;
        return count;
    }
};
