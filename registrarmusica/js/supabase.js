// ==========================================================
// REGISTRAR AGORA
// Configuração Global do Supabase
// ==========================================================

// URL do seu projeto
const SUPABASE_URL = "https://bdtswwyctsesszfyicoz.supabase.co";

// Cole abaixo a sua Publishable Key do Supabase
const SUPABASE_ANON_KEY = "sb_publishable_68U0Spg3sOLRr9ZSiWALAg_jw0sihBF";

// Verifica se a biblioteca do Supabase foi carregada
if (typeof window.supabase === "undefined") {
    throw new Error("Biblioteca do Supabase não encontrada.");
}

// Cria uma única conexão para todo o sistema
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Disponibiliza globalmente
window.supabase = supabase;

// ==========================================================
// Funções auxiliares
// ==========================================================

// Gera protocolos
window.gerarProtocolo = function(prefixo = "SUP") {

    const agora = new Date();

    const data =
        agora.getFullYear().toString() +
        String(agora.getMonth() + 1).padStart(2, "0") +
        String(agora.getDate()).padStart(2, "0");

    const random =
        Math.floor(Math.random() * 999999)
            .toString()
            .padStart(6, "0");

    return `${prefixo}-${data}-${random}`;

};

// Formata datas
window.formatarData = function(data){

    return new Date(data).toLocaleString("pt-BR");

};
