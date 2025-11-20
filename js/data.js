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

export let appData = JSON.parse(localStorage.getItem(STORAGE_KEY_V5)) || JSON.parse(JSON.stringify(defaultData));

export function saveData(callback) {
    localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(appData));
    if (callback) callback();
}

export function resetData(callback) {
    localStorage.removeItem(STORAGE_KEY_V5);
    appData = JSON.parse(JSON.stringify(defaultData));
    saveData(callback);
}

// Helper to update appData reference if needed (though exporting let allows mutation, 
// importing modules get a live binding, so direct mutation on appData property works if we export the object wrapper, 
// but here we exported 'let appData'. 
// To be safe with module bindings, we can just mutate the properties of appData if it was a const object, 
// but since we might replace the whole object on reset, we need to be careful.
// Actually, 'resetData' above reassigns 'appData'. In ES modules, reassigning an exported 'let' variable 
// inside the module updates the value for importers. So this is fine.
