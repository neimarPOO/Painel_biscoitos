import { supabase } from './supabase-client.js';

export const phasesConfig = [
    { id: 'p1', title: 'Semana 1: Ideação & Marca', dates: '18-24 Nov', icon: 'looks_one' },
    { id: 'p2', title: 'Semana 2: Finanças & Web', dates: '25-30 Nov', icon: 'looks_two' },
    { id: 'p3', title: 'Produção', dates: '01-10 Dez', icon: 'local_fire_department' },
    { id: 'p4', title: 'A Grande Feira', dates: '13 Dez', icon: 'star' }
];

export const defaultData = {
    members: [],
    tasks: [
        { id: 1, phase_id: 'p1', title: "Definir a Dupla & Persona", description: "", assignee: "Todos", status: "done" },
        { id: 2, phase_id: 'p1', title: "Criar Nome e Logo no Canva", description: "", assignee: "", status: "todo" },
        { id: 3, phase_id: 'p2', title: "Comprar Ingredientes", description: "", assignee: "", status: "todo" },
        { id: 4, phase_id: 'p2', title: "Criar página no Site", description: "", assignee: "", status: "todo" },
        { id: 5, phase_id: 'p3', title: "Assar primeira leva", description: "", assignee: "", status: "todo" },
        { id: 6, phase_id: 'p3', title: "Embalar produtos", description: "", assignee: "Todos", status: "todo" }
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
    ],
    settings: {
        productionGoal: 50,
        unitsPerPackage: 6,
        unitsSold: 0
    }
};

// Initialize appData with default values. It will be populated from Supabase if logged in.
export let appData = JSON.parse(JSON.stringify(defaultData));

// Placeholder for localStorage key (now only for caching/fallback)
const STORAGE_KEY_V5 = 'startup_natal_v5_data';

export async function fetchAndPopulateAppData(renderCallback) {
    if (!supabase) {
        console.warn("Supabase client not initialized. Using local storage for data.");
        const localData = localStorage.getItem(STORAGE_KEY_V5);
        if (localData) {
            appData = JSON.parse(localData);
            if (!appData.settings) appData.settings = defaultData.settings; // Ensure settings exist
        } else {
            appData = JSON.parse(JSON.stringify(defaultData));
        }
        if (renderCallback) renderCallback();
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        const localData = localStorage.getItem(STORAGE_KEY_V5);
        if (localData) {
            appData = JSON.parse(localData);
            if (!appData.settings) appData.settings = defaultData.settings;
        } else {
            appData = JSON.parse(JSON.stringify(defaultData));
        }
        if (renderCallback) renderCallback();
        return;
    }

    try {
        const userId = user.id;

        const [
            { data: members, error: membersError },
            { data: tasks, error: tasksError },
            { data: ingredients, error: ingredientsError },
            { data: extraCosts, error: extraCostsError },
            { data: settingsData, error: settingsError }
        ] = await Promise.all([
            supabase.from('members').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('ingredients').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('extra_costs').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('user_settings').select('*').eq('user_id', userId).single()
        ]);

        if (membersError) console.error("Error fetching members:", membersError);
        if (tasksError) console.error("Error fetching tasks:", tasksError);
        if (ingredientsError) console.error("Error fetching ingredients:", ingredientsError);
        if (extraCostsError) console.error("Error fetching extra costs:", extraCostsError);
        // settingsError is expected if row doesn't exist yet (PGRST116)

        appData.members = members || [];
        appData.tasks = tasks || [];
        appData.ingredients = ingredients || [];
        appData.extraCosts = extraCosts || [];
        
        if (settingsData) {
            appData.settings = {
                productionGoal: parseFloat(settingsData.production_goal) || 50,
                unitsPerPackage: parseFloat(settingsData.units_per_package) || 6,
                unitsSold: parseFloat(settingsData.units_sold) || 0
            };
        } else {
            // No settings found. Check if EVERYTHING is empty (new user)
            const isNewUser = (!members || members.length === 0) &&
                              (!tasks || tasks.length === 0) &&
                              (!ingredients || ingredients.length === 0) &&
                              (!extraCosts || extraCosts.length === 0);
            
            if (isNewUser) {
                await populateDefaultDataForUser(userId);
                // Recursively call to fetch the newly created data
                return fetchAndPopulateAppData(renderCallback);
            }

            appData.settings = JSON.parse(JSON.stringify(defaultData.settings));
        }

        localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData));
        console.log('Data loaded from cloud');
    } catch (e) {
        console.error("Unexpected error loading data from cloud", e);
        const localData = localStorage.getItem(STORAGE_KEY_V5);
        if (localData) appData = JSON.parse(localData);
        else appData = JSON.parse(JSON.stringify(defaultData));
    } finally {
        if (renderCallback) renderCallback();
    }
}

// --- CRUD Operations ---

export async function saveUserSettings(settings) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dbSettings = {
        user_id: user.id,
        production_goal: settings.productionGoal,
        units_per_package: settings.unitsPerPackage,
        units_sold: settings.unitsSold
    };

    const { error } = await supabase
        .from('user_settings')
        .upsert(dbSettings)
        .select()
        .single();

    if (error) console.error("Error saving user settings:", error);
    return !error;
}

export async function addMember(name) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('members')
        .insert({ user_id: user.id, name: name })
        .select()
        .single();
    if (error) console.error("Error adding member:", error);
    return data;
}

export async function updateMember(id, name) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('members')
        .update({ name: name })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    if (error) console.error("Error updating member:", error);
    return data;
}

export async function deleteMember(id) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) console.error("Error deleting member:", error);
    return !error;
}


export async function addTask(task) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, ...task })
        .select()
        .single();
    if (error) console.error("Error adding task:", error);
    return data;
}

export async function updateTask(id, updates) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    if (error) console.error("Error updating task:", error);
    return data;
}

export async function deleteTask(id) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) console.error("Error deleting task:", error);
    return !error;
}


export async function addIngredient(ingredient) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('ingredients')
        .insert({ user_id: user.id, ...ingredient })
        .select()
        .single();
    if (error) console.error("Error adding ingredient:", error);
    return data;
}

export async function updateIngredient(id, updates) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    if (error) console.error("Error updating ingredient:", error);
    return data;
}

export async function deleteIngredient(id) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) console.error("Error deleting ingredient:", error);
    return !error;
}


export async function addExtraCost(extraCost) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('extra_costs')
        .insert({ user_id: user.id, ...extraCost })
        .select()
        .single();
    if (error) console.error("Error adding extra cost:", error);
    return data;
}

export async function updateExtraCost(id, updates) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('extra_costs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    if (error) console.error("Error updating extra cost:", error);
    return data;
}

export async function deleteExtraCost(id) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('extra_costs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) console.error("Error deleting extra cost:", error);
    return !error;
}

async function populateDefaultDataForUser(userId) {
    console.log("Populating default data for new user...");
    const promises = [];

    // Tasks
    const tasksToInsert = defaultData.tasks.map(t => ({
        user_id: userId,
        phase_id: t.phase_id,
        title: t.title,
        description: t.description || "",
        assignee: t.assignee || "",
        status: t.status || "todo"
    }));
    if (tasksToInsert.length > 0) promises.push(supabase.from('tasks').insert(tasksToInsert));

    // Ingredients
    const ingredientsToInsert = defaultData.ingredients.map(i => ({
        user_id: userId,
        name: i.name,
        price: i.price,
        grams: i.grams,
        source: i.source
    }));
    if (ingredientsToInsert.length > 0) promises.push(supabase.from('ingredients').insert(ingredientsToInsert));

    // Extra Costs
    const extraCostsToInsert = defaultData.extraCosts.map(e => ({
        user_id: userId,
        name: e.name,
        cost: e.cost,
        source: e.source
    }));
    if (extraCostsToInsert.length > 0) promises.push(supabase.from('extra_costs').insert(extraCostsToInsert));

    // Settings
    const settingsToInsert = {
        user_id: userId,
        production_goal: defaultData.settings.productionGoal,
        units_per_package: defaultData.settings.unitsPerPackage,
        units_sold: defaultData.settings.unitsSold
    };
    promises.push(supabase.from('user_settings').insert(settingsToInsert));

    await Promise.all(promises);
    console.log("Default data populated.");
}


export async function resetData() {
    if (!supabase) {
        console.warn("Supabase client not initialized. Cannot reset cloud data.");
        appData = JSON.parse(JSON.stringify(defaultData));
        localStorage.removeItem(STORAGE_KEY_V5);
        return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("Not logged in. Cannot reset cloud data.");
        appData = JSON.parse(JSON.stringify(defaultData));
        localStorage.removeItem(STORAGE_KEY_V5);
        return;
    }

    const userId = user.id;

    try {
        await Promise.all([
            supabase.from('members').delete().eq('user_id', userId),
            supabase.from('tasks').delete().eq('user_id', userId),
            supabase.from('ingredients').delete().eq('user_id', userId),
            supabase.from('extra_costs').delete().eq('user_id', userId),
            supabase.from('user_settings').delete().eq('user_id', userId)
        ]);
        console.log("User data reset in cloud.");
    } catch (e) {
        console.error("Error resetting user data in cloud:", e);
    } finally {
        appData = JSON.parse(JSON.stringify(defaultData));
        localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData)); // Reset local cache too
    }
}

// Dummy saveData for compatibility
export function saveData(callback) {
    localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData));
    if (callback) callback();
}