// Registrar Agora - conexão global com o Supabase
const SUPABASE_URL = "https://bdtswwyctsesszfyicoz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_68U0Spg3sOLRr9ZSiWALAg_jw0sihBF";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("Biblioteca do Supabase não foi carregada.");
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
