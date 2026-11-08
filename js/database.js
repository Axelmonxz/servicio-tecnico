const SUPABASE_URL = "https://vjuiosdotumyqwsmslvx.supabase.co";

const SUPABASE_KEY = "TU_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("TechFix conectado a Supabase");

async function probarConexion() {

    console.log("Probando consulta a equipos...");

    const { data, error } = await supabaseClient
        .from("equipos")
        .select("*");

    if (error) {
        console.error("ERROR SUPABASE:", error);
        return;
    }

    console.log("CONSULTA EXITOSA");
    console.table(data);
}

probarConexion();
