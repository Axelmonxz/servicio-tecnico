const SUPABASE_URL = "https://vjuiosdotumyqwsmslvx.supabase.co";

const SUPABASE_KEY = "sb_publishable_";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("TechFix conectado a Supabase");
