const SUPABASE_URL = "https://vjuiosdotumyqwsmslvx.supabase.co";

const SUPABASE_KEY = "sb_publishable_fJ2vLnDlVFaM-N_pIwlJPA_B2hI1MeP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("TechFix conectado a Supabase");
async function probarConexion() {
    const { data, error } = await supabaseClient
        .from("equipos")
        .select("*");

    if (error) {
        console.error("Error al consultar equipos:", error.message);
        return;
    }

    console.log("Conexión con la tabla equipos exitosa");
    console.log("Equipos registrados:", data);
}

probarConexion();
