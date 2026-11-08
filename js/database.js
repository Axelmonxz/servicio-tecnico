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
            .order("created_at", { ascending: false });
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

    // ---------- CONTADORES DEL DASHBOARD ----------
    async contar(tabla, filtroEstado) {
        let q = supabaseClient.from(tabla).select("*", { count: "exact", head: true });
        if (filtroEstado) q = q.eq("estado", filtroEstado);
        const { count, error } = await q;
        if (error) throw error;
        return count;
    }
};
