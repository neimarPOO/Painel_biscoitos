import { appData, saveData, resetData } from './data.js';
import { showConfirm, setupConfirmDialog, toggleTheme, loadTheme } from './utils.js';
import { renderTeam, renderProgress, renderTimeline, renderCalculator, updateCalculationUI } from './ui.js';

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
    renderApp();
});

function setupEventListeners() {
    // Navbar buttons
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.querySelector('md-icon-button[onclick="resetData()"]').onclick = null; // Remove inline
    document.querySelector('md-icon-button[onclick="resetData()"]').addEventListener('click', () => resetData(renderApp));

    // Tabs
    const tabs = document.querySelector('md-tabs');
    tabs.addEventListener('change', (event) => {
        const activeTab = event.target.activeTab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panelId = activeTab.getAttribute('aria-controls');
        document.getElementById(panelId).classList.add('active');
    });

    // Team
    document.querySelector('md-filled-button[onclick="addMember()"]').onclick = null;
    document.querySelector('md-filled-button[onclick="addMember()"]').addEventListener('click', addMember);

    // Task Modal
    document.querySelector('md-text-button[value="save"]').onclick = null;
    document.querySelector('md-text-button[value="save"]').addEventListener('click', saveTask);

    // Calculator Inputs
    document.getElementById('meta-qtd').addEventListener('input', calculate);
    document.getElementById('margin-slider').addEventListener('input', calculate);
    document.getElementById('units-per-package').addEventListener('input', calculate);

    // Calculator Add Buttons
    document.querySelector('md-text-button[onclick="addIngredient()"]').onclick = null;
    document.querySelector('md-text-button[onclick="addIngredient()"]').addEventListener('click', addIngredient);

    document.querySelector('md-text-button[onclick="addExtraCost()"]').onclick = null;
    document.querySelector('md-text-button[onclick="addExtraCost()"]').addEventListener('click', addExtraCost);
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
function addMember() {
    const memberNameInput = document.getElementById('new-member-name');
    const name = memberNameInput.value.trim();
    if (!name) return;
    if (!appData.members) appData.members = [];
    appData.members.push(name);
    memberNameInput.value = '';
    saveData(renderTeam);
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
        opt.value = m;
        opt.innerHTML = `<div slot="headline">${m}</div>`;
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

function saveTask() {
    const taskTitleInput = document.getElementById('modal-task-title');
    const taskDescriptionInput = document.getElementById('modal-task-description');
    const taskAssigneeSelect = document.getElementById('modal-task-assignee');
    const taskStatusSelect = document.getElementById('modal-task-status');
    const taskDialog = document.getElementById('task-dialog');

    const title = taskTitleInput.value.trim();
    if (!title) return;
    const description = taskDescriptionInput.value.trim();

    if (currentEditingTaskId) {
        const task = appData.tasks.find(t => t.id === currentEditingTaskId);
        task.title = title;
        task.description = description;
        task.assignee = taskAssigneeSelect.value;
        task.status = taskStatusSelect.value;
    } else {
        appData.tasks.push({
            id: Date.now(),
            phaseId: currentAddingPhaseId,
            title,
            description,
            assignee: taskAssigneeSelect.value,
            status: 'todo'
        });
    }
    saveData(() => {
        renderTimeline(openTaskModal);
        renderProgress();
    });
    taskDialog.close();
}

// ==========================
// CALCULATOR LOGIC
// ==========================
function addIngredient() {
    appData.ingredients.push({ id: Date.now(), name: 'Novo Ingrediente', price: 0, grams: 0, source: 'startup' });
    saveData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
}

function updateIngredient(id, field, value) {
    const item = appData.ingredients.find(i => i.id === id);
    if (field === 'price' || field === 'grams') value = parseFloat(value) || 0;
    item[field] = value;
    saveData(null); // No re-render needed for simple input update, but we need to recalc
    calculate();
}

function deleteIngredient(id) {
    showConfirm('Excluir Ingrediente?', 'Tem certeza?', () => {
        appData.ingredients = appData.ingredients.filter(i => i.id !== id);
        saveData(() => {
            renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost);
            calculate();
        });
    });
}

function addExtraCost() {
    appData.extraCosts.push({ id: Date.now(), name: 'Novo Custo', cost: 0, source: 'startup' });
    saveData(() => renderCalculator(updateIngredient, deleteIngredient, updateExtraCost, deleteExtraCost));
}

function updateExtraCost(id, field, value) {
    const item = appData.extraCosts.find(i => i.id === id);
    if (field === 'cost') value = parseFloat(value) || 0;
    item[field] = value;
    saveData(null);
    calculate();
}

function deleteExtraCost(id) {
    showConfirm('Excluir Custo?', 'Tem certeza?', () => {
        appData.extraCosts = appData.extraCosts.filter(i => i.id !== id);
        saveData(() => {
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
    const quantity = parseFloat(document.getElementById('meta-qtd').value) || 1;
    const unitCost = isFinite(totalCost / quantity) ? totalCost / quantity : 0;
    const margin = document.getElementById('margin-slider').value;
    const finalPrice = unitCost * (1 + (margin / 100));
    const profit = finalPrice - unitCost;
    const netProfit = profit * quantity;

    const unitsPerPackage = parseFloat(document.getElementById('units-per-package').value) || 1;
    const packagePrice = finalPrice * unitsPerPackage;

    updateCalculationUI(totalStartup, totalOwn, unitCost, margin, finalPrice, packagePrice, profit, netProfit);
}
