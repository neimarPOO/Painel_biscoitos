import { supabase } from './supabase-client.js';

export const STORAGE_KEY_V5 = 'startup_natal_v5_data';

export const phasesConfig = [
    { id: 'p1', title: 'Semana 1: Ideação & Marca', dates: '18-24 Nov', icon: 'looks_one' },
    { id: 'p2', title: 'Semana 2: Finanças & Web', dates: '25-30 Nov', icon: 'looks_two' },
    { id: 'p3', title: 'Produção', dates: '01-10 Dez', icon: 'local_fire_department' },
    { id: 'p4', title: 'A Grande Feira', dates: '13 Dez', icon: 'star' }
];

export const defaultData = {
    members: [],
    tasks: [
        { id: 1, phaseId: 'p1', title: "Definir a Dupla & Persona", description: "", assignee: "Todos", status: "done" },
        { id: 2, phaseId: 'p1', title: "Criar Nome e Logo no Canva", description: "", assignee: "", status: "todo" },
        { id: 3, phaseId: 'p2', title: "Comprar Ingredientes", description: "", assignee: "", status: "todo" },
        { id: 4, phaseId: 'p2', title: "Criar página no Site", description: "", assignee: "", status: "todo" },
        { id: 5, phaseId: 'p3', title: "Assar primeira leva", description: "", assignee: "", status: "todo" },
        { id: 6, phaseId: 'p3', title: "Embalar produtos", description: "", assignee: "", status: "todo" }
    ],
    ingredients: [
        { id: 1, name: 'Farinha de Trigo', price: 5.00, grams: 300, source: 'startup' },
        { id: 2, name: 'Açúcar', price: 4.50, grams: 100, source: 'startup' },
        { id: 3, name: 'Manteiga/Marg.', price: 60.00, grams: 200, source: 'startup' }
    ],
    extraCosts: [
        { id: 1, name: 'Ingredientes Extras', cost: 0, source: 'startup' },
        { id: 2, name: 'Embalagens', cost: 0, source: 'startup' },
        { id: 3, name: 'Gás / Energia', cost: 5.00, source: 'proprio' }
    ]
};

// Initialize with local storage or default
export let appData = JSON.parse(localStorage.getItem(STORAGE_KEY_V5)) || JSON.parse(JSON.stringify(defaultData));

export async function loadDataFromCloud(renderCallback) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('user_data')
            .select('content')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error fetching data:', error);
            return;
        }

        if (data && data.content) {
            console.log('Data loaded from cloud');
            appData = data.content;
            // Update local storage to match cloud
            localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData));
        } else {
            // No data in cloud, assume new user or first sync.
            // Save current local data to cloud
            await saveDataToCloud();
        }
    } catch (e) {
        console.error("Unexpected error loading data", e);
    } finally {
        if (renderCallback) renderCallback();
    }
}

async function saveDataToCloud() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We need to upsert. The constraint is usually on the primary key (id), 
    // but we want one row per user. 
    // Our table RLS enforces user_id check.
    // We should first check if row exists to update, or just upsert if we had a unique constraint on user_id.
    // The current table setup: id is PK. user_id is FK.
    // Let's search by user_id.

    const { data: existing } = await supabase
        .from('user_data')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (existing) {
        await supabase
            .from('user_data')
            .update({ content: appData, updated_at: new Date() })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('user_data')
            .insert([{ user_id: user.id, content: appData }]);
    }
}

export function saveData(callback) {
    // 1. Save Local
    localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData));
    
    // 2. Trigger UI update immediately
    if (callback) callback();

    // 3. Sync Cloud in background
    saveDataToCloud().catch(err => console.error("Cloud sync failed:", err));
}

export function resetData(callback) {
    // Reset to default
    appData = JSON.parse(JSON.stringify(defaultData));
    
    // Save (handles both local and cloud reset)
    saveData(callback);
}