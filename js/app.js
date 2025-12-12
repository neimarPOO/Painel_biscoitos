import { appData, fetchAndPopulateAppData, addMember as addMemberDB, updateMember as updateMemberDB, deleteMember as deleteMemberDB, addTask as addTaskDB, updateTask as updateTaskDB, deleteTask as deleteTaskDB, addIngredient as addIngredientDB, updateIngredient as updateIngredientDB, deleteIngredient as deleteIngredientDB, addExtraCost as addExtraCostDB, updateExtraCost as updateExtraCostDB, deleteExtraCost as deleteExtraCostDB, resetData as resetDataDB, saveUserSettings } from './data.js';
import { showConfirm, setupConfirmDialog, toggleTheme, loadTheme } from './utils.js';
import { renderTeam, renderProgress, renderTimeline, renderCalculator, updateCalculationUI } from './ui.js';
import { initAuth } from './auth.js';

// ==========================
// GLOBAL STATE & HANDLERS
// ==========================
let currentEditingTaskId = null;
let currentAddingPhaseId = null;

// ==========================
// INITIALIZATION
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupConfirmDialog();
    setupEventListeners();
    
    // Initialize Auth (which will load data and call renderApp)
    initAuth(renderApp);
    
    // Initial render (optimistic, using local data while auth checks)
    renderApp(); 
});

function setupEventListeners() {
    // Navbar buttons
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('reset-data-btn').addEventListener('click', async () => {
        showConfirm('Redefinir Dados?', 'Isso apagará todos os seus dados. Tem certeza?', async () => {
            await resetDataDB();
            await fetchAndPopulateAppData(renderApp); // Re-fetch default data and render
        });
    });

    // Tabs
    const tabs = document.querySelector('md-tabs');
    tabs.addEventListener('change', (event) => {
        const activeTab = event.target.activeTab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panelId = activeTab.getAttribute('aria-controls');
        document.getElementById(panelId).classList.add('active');
    });

    // Team
    document.getElementById('add-member-btn').addEventListener('click', addMember);

    // Task Modal
    document.querySelector('md-text-button[value="save"]').addEventListener('click', saveTask);

    // Calculator Inputs
    document.getElementById('meta-qtd').addEventListener('input', calculate);
    document.getElementById('margin-slider').addEventListener('input', calculate);
    document.getElementById('units-per-package').addEventListener('input', calculate);
    document.getElementById('units-sold').addEventListener('input', calculate);

    // Save Settings Buttons
    document.getElementById('save-meta-btn').addEventListener('click', () => saveSingleSetting('productionGoal', 'meta-qtd'));
    document.getElementById('save-package-btn').addEventListener('click', () => saveSingleSetting('unitsPerPackage', 'units-per-package'));
    document.getElementById('save-sold-btn').addEventListener('click', () => saveSingleSetting('unitsSold', 'units-sold'));

    // Calculator Add Buttons
    document.getElementById('add-ingredient-btn').addEventListener('click', addIngredient);
    document.getElementById('add-extracost-btn').addEventListener('click', addExtraCost);
}

function renderApp() {
    renderTeam();
    renderTimeline(openTaskModal);
    renderProgress();
    renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
    
    // Initialize inputs with data from DB/Local
    if (appData.settings) {
        document.getElementById('meta-qtd').value = appData.settings.productionGoal;
        document.getElementById('units-per-package').value = appData.settings.unitsPerPackage;
        document.getElementById('units-sold').value = appData.settings.unitsSold;
    }

    calculate();
}

async function saveSingleSetting(settingKey, inputId) {
    const rawValue = document.getElementById(inputId).value;
    const value = parseFloat(String(rawValue).replace(',', '.')) || 0;
    appData.settings[settingKey] = value;
    
    // Save to DB
    const success = await saveUserSettings(appData.settings);
    
    if (success) {
        // Visual feedback (simple console log for now, or maybe a toast if available)
        console.log(`Setting ${settingKey} saved: ${value}`);
        const btn = document.getElementById(inputId).nextElementSibling; // The button is next to input in the div
        if (btn && btn.tagName === 'MD-ICON-BUTTON') {
            const icon = btn.querySelector('md-icon');
            const originalIcon = icon.innerText;
            icon.innerText = 'check';
            setTimeout(() => icon.innerText = originalIcon, 2000);
        }
    }
}

// ==========================
// TEAM LOGIC
// ==========================
async function addMember() {
    const memberNameInput = document.getElementById('new-member-name');
    const name = memberNameInput.value.trim();
    if (!name) return;
    
    await addMemberDB(name); // Add to DB
    memberNameInput.value = '';
    await fetchAndPopulateAppData(renderTeam); // Re-fetch and render team
}

// ==========================
// TASK LOGIC
// ==========================
function openTaskModal(phaseId = null, taskId = null) {
    const taskDialog = document.getElementById('task-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const taskTitleInput = document.getElementById('modal-task-title');
    const taskDescriptionInput = document.getElementById('modal-task-description');
    const taskAssigneeSelect = document.getElementById('modal-task-assignee');
    const statusWrapper = document.getElementById('modal-status-wrapper');
    const taskStatusSelect = document.getElementById('modal-task-status');

    taskAssigneeSelect.innerHTML = '<md-select-option value=""><div slot="headline">Ninguém</div></md-select-option>';
    appData.members?.forEach(m => {
        const opt = document.createElement('md-select-option');
        opt.value = m.name; 
        opt.innerHTML = `<div slot="headline">${m.name}</div>`;
        taskAssigneeSelect.appendChild(opt);
    });

    if (taskId) {
        const task = appData.tasks.find(t => t.id === taskId);
        currentEditingTaskId = taskId;
        currentAddingPhaseId = null;
        dialogTitle.innerText = "Editar Tarefa";
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description || "";
        taskAssigneeSelect.value = task.assignee || "";
        statusWrapper.style.display = 'block';
        taskStatusSelect.value = task.status;
    } else {
        currentEditingTaskId = null;
        currentAddingPhaseId = phaseId;
        dialogTitle.innerText = "Nova Tarefa";
        taskTitleInput.value = "";
        taskDescriptionInput.value = "";
        taskAssigneeSelect.value = "";
        statusWrapper.style.display = 'none';
    }
    taskDialog.show();
}

async function saveTask() {
    const taskTitleInput = document.getElementById('modal-task-title');
    const taskDescriptionInput = document.getElementById('modal-task-description');
    const taskAssigneeSelect = document.getElementById('modal-task-assignee');
    const taskStatusSelect = document.getElementById('modal-task-status');
    const taskDialog = document.getElementById('task-dialog');

    const title = taskTitleInput.value.trim();
    if (!title) return;
    const description = taskDescriptionInput.value.trim();
    const assignee = taskAssigneeSelect.value;
    const status = taskStatusSelect.value;

    if (currentEditingTaskId) {
        const updates = { title, description, assignee, status };
        await updateTaskDB(currentEditingTaskId, updates);
    } else {
        const newTask = {
            phase_id: currentAddingPhaseId, // Use phase_id as per DB schema
            title,
            description,
            assignee,
            status: status || 'todo'
        };
        await addTaskDB(newTask);
    }
    await fetchAndPopulateAppData(() => {
        renderTimeline(openTaskModal);
        renderProgress();
    });
    taskDialog.close();
}

// ==========================
// CALCULATOR LOGIC
// ==========================
async function addIngredient() {
    try {
        const newIngredient = { name: 'Novo Ingrediente', price: 0, grams: 0, source: 'startup' };
        await addIngredientDB(newIngredient);
        await fetchAndPopulateAppData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
        calculate();
    } catch (error) {
        console.error("Error adding ingredient:", error);
    }
}

async function updateIngredient(id, field, value) {
    // 1. Optimistic Update
    const item = appData.ingredients.find(i => i.id === id);
    if (item) {
        let parsedValue = value;
        if (field === 'price' || field === 'grams') {
            parsedValue = parseFloat(value.toString().replace(',', '.')) || 0;
        }
        item[field] = parsedValue;
    }

    // 2. Recalculate totals immediately
    calculate();

    // 3. Send update to DB in background
    try {
        let updates = { [field]: item[field] };
        await updateIngredientDB(id, updates);
    } catch (error) {
        console.error("Failed to update ingredient in DB:", error);
    }
}

async function deleteIngredient(id) {
    showConfirm('Excluir Ingrediente?', 'Tem certeza?', async () => {
        try {
            await deleteIngredientDB(id);
            await fetchAndPopulateAppData(() => {
                renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
                calculate();
            });
        } catch (error) {
            console.error("Error deleting ingredient:", error);
        }
    });
}

async function addExtraCost() {
    try {
        const newExtraCost = { name: 'Novo Custo', cost: 0, source: 'startup' };
        await addExtraCostDB(newExtraCost);
        await fetchAndPopulateAppData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
        calculate();
    } catch (error) {
        console.error("Error adding extra cost:", error);
    }
}

async function updateExtraCost(id, field, value) {
    // 1. Optimistic Update
    const item = appData.extraCosts.find(i => i.id === id);
    if (item) {
        let parsedValue = value;
        if (field === 'cost') {
            parsedValue = parseFloat(value.toString().replace(',', '.')) || 0;
        }
        item[field] = parsedValue;
    }

    // 2. Recalculate
    calculate();

    // 3. DB Update
    try {
        let updates = { [field]: item[field] };
        await updateExtraCostDB(id, updates);
    } catch (error) {
        console.error("Failed to update extra cost in DB:", error);
    }
}

async function deleteExtraCost(id) {
    showConfirm('Excluir Custo?', 'Tem certeza?', async () => {
        await deleteExtraCostDB(id);
        await fetchAndPopulateAppData(() => {
            renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
            calculate();
        });
    });
}

function calculate() {
    let totalStartup = 0;
    let totalOwn = 0;
    appData.ingredients.forEach(item => {
        const cost = (parseFloat(item.price) / 1000) * parseFloat(item.grams);
        if (item.source === 'startup') totalStartup += cost;
        else totalOwn += cost;
    });
    appData.extraCosts.forEach(item => {
        const cost = parseFloat(item.cost);
        if (item.source === 'startup') totalStartup += cost;
        else totalOwn += cost;
    });

    const totalCost = totalStartup + totalOwn;
    
    // Read from DOM, but these should be pre-filled by renderApp
    const quantity = parseFloat(String(document.getElementById('meta-qtd').value).replace(',', '.')) || 1;
    const unitsSold = parseFloat(String(document.getElementById('units-sold').value).replace(',', '.')) || 0;

    // Update appData local state just in case (though save button handles DB)
    if (appData.settings) {
        appData.settings.productionGoal = quantity;
        appData.settings.unitsSold = unitsSold;
        appData.settings.unitsPerPackage = parseFloat(String(document.getElementById('units-per-package').value).replace(',', '.')) || 1;
    }

    // 1. Custo por unidade
    const unitCost = isFinite(totalCost / quantity) ? totalCost / quantity : 0;

    // 2. Preço de Equilíbrio
    const suggestedPrice = (unitsSold > 0) ? (totalCost / unitsSold) : 0;

    // 3. Preço Final
    const margin = document.getElementById('margin-slider').value;
    const finalPrice = unitCost * (1 + (margin / 100));

    // 4. Lucros
    const profit = finalPrice - unitCost; 
    const netProfit = (finalPrice * unitsSold) - totalCost; 

    const unitsPerPackage = parseFloat(document.getElementById('units-per-package').value.replace(',', '.')) || 1;
    const packagePrice = finalPrice * unitsPerPackage;

    const totalRevenue = finalPrice * unitsSold;
    const chartData = { totalCost, totalRevenue, netProfit };

    updateCalculationUI(totalStartup, totalOwn, unitCost, margin, finalPrice, packagePrice, profit, netProfit, suggestedPrice, chartData);
}