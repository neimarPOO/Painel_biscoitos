import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = window.SUPABASE_CONFIG?.url;
const SUPABASE_KEY = window.SUPABASE_CONFIG?.key;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === "SUA_SUPABASE_URL_AQUI") {
    console.warn("Supabase keys not found in js/config.js. Authentication will not work.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
