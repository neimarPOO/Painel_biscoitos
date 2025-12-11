import { appData, fetchAndPopulateAppData, addMember as addMemberDB, updateMember as updateMemberDB, deleteMember as deleteMemberDB, addTask as addTaskDB, updateTask as updateTaskDB, deleteTask as deleteTaskDB, addIngredient as addIngredientDB, updateIngredient as updateIngredientDB, deleteIngredient as deleteIngredientDB, addExtraCost as addExtraCostDB, updateExtraCost as updateExtraCostDB, deleteExtraCost as deleteExtraCostDB, resetData as resetDataDB } from './data.js';
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

    // Calculator Add Buttons
    document.getElementById('add-ingredient-btn').addEventListener('click', addIngredient);
    document.getElementById('add-extracost-btn').addEventListener('click', addExtraCost);
}

function renderApp() {
    renderTeam();
    renderTimeline(openTaskModal);
    renderProgress();
    renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
    calculate();
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
        opt.value = m.name; // Use m.name as value, since m is now an object {id, name}
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
    const taskStatusSelect = document.getElementById('modal-task-status'); // Corrected from `document = document.getElementById(...)`
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
    const newIngredient = { name: 'Novo Ingrediente', price: 0, grams: 0, source: 'startup' };
    await addIngredientDB(newIngredient);
    await fetchAndPopulateAppData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
    calculate();
}

async function updateIngredient(id, field, value) {
    // Note: The UI element itself passes the raw value
    let updates = { [field]: value };
    // Handle price and grams parsing here before sending to DB
    if (field === 'price' || field === 'grams') {
        updates[field] = parseFloat(value.toString().replace(',', '.')) || 0;
    }
    await updateIngredientDB(id, updates);
    // After update, re-fetch data for the item being updated or calculate immediately if local appData is sufficient.
    // For simplicity, we directly call calculate, assuming appData is updated directly or will be consistent.
    // If we wanted strict consistency, we would fetchAndPopulateAppData after each update.
    calculate();
}

async function deleteIngredient(id) {
    showConfirm('Excluir Ingrediente?', 'Tem certeza?', async () => {
        await deleteIngredientDB(id);
        await fetchAndPopulateAppData(() => {
            renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
            calculate();
        });
    });
}

async function addExtraCost() {
    const newExtraCost = { name: 'Novo Custo', cost: 0, source: 'startup' };
    await addExtraCostDB(newExtraCost);
    await fetchAndPopulateAppData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
    calculate();
}

async function updateExtraCost(id, field, value) {
    let updates = { [field]: value };
    if (field === 'cost') {
        updates[field] = parseFloat(value.toString().replace(',', '.')) || 0;
    }
    await updateExtraCostDB(id, updates);
    calculate();
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
    const quantity = parseFloat(document.getElementById('meta-qtd').value.replace(',', '.')) || 1;
    const unitsSold = parseFloat(document.getElementById('units-sold').value.replace(',', '.')) || 0;

    // 1. Custo por unidade
    const unitCost = isFinite(totalCost / quantity) ? totalCost / quantity : 0;

    // 2. Preço de Equilíbrio (para cobrir os custos TOTAIS com as unidades vendidas)
    // This is the "suggested price" the user was missing.
    const suggestedPrice = (unitsSold > 0) ? (totalCost / unitsSold) : 0;

    // 3. Preço Final (baseado no custo unitário + margem de lucro)
    const margin = document.getElementById('margin-slider').value;
    const finalPrice = unitCost * (1 + (margin / 100));

    // 4. Lucros (usando o Preço Final)
    const profit = finalPrice - unitCost; // Lucro por unidade vendida
    const netProfit = (finalPrice * unitsSold) - totalCost; // Lucro líquido total

    const unitsPerPackage = parseFloat(document.getElementById('units-per-package').value) || 1;
    const packagePrice = finalPrice * unitsPerPackage;

    const totalRevenue = finalPrice * unitsSold;
    const chartData = { totalCost, totalRevenue, netProfit };

    updateCalculationUI(totalStartup, totalOwn, unitCost, margin, finalPrice, packagePrice, profit, netProfit, suggestedPrice, chartData);
}
