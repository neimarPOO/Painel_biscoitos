import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = window.Project_URL;
const SUPABASE_KEY = window.API_anon_Key;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Supabase keys (Project_URL or API_anon_Key) not found in global scope. Authentication will not work.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
