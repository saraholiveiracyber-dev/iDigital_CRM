// =========================================================
// iDIGITAL CRM
// SUPABASE
// =========================================================

const SUPABASE_URL =
    "https://uylyraizkncpmpczziif.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_23P9NZuFROn1CGp7kXJNMA_XzmXLgmG";

if (!window.supabase) {

    console.error(
        "Biblioteca Supabase não carregada."
    );

} else {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

    console.log(
        "Supabase conectado:",
        SUPABASE_URL
    );
}