import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env para acessar variáveis.
// Elas DEVEM começar com VITE_ para estarem disponíveis aqui.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Client Init - URL:", SUPABASE_URL ? "Defined" : "Not Found");
console.log("Supabase Client Init - KEY:", SUPABASE_KEY ? "Defined" : "Not Found");

let client = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("CRITICAL: Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found.");
} else {
    try {
        client = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

export const supabase = client;