import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Debugging: Log the values we are trying to use
console.log("Supabase Client Init - Project_URL:", window.Project_URL);
console.log("Supabase Client Init - API_anon_Key:", window.API_anon_Key ? "Found (hidden)" : "Not Found");

const SUPABASE_URL = window.Project_URL;
const SUPABASE_KEY = window.API_anon_Key;

let client = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("CRITICAL: Supabase keys not found. Check Netlify Snippet Injection. Expected window.Project_URL and window.API_anon_Key.");
} else {
    try {
        client = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

export const supabase = client;
