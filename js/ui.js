import { appData, saveData, phasesConfig } from './data.js';
import { showConfirm } from './utils.js';

// ==========================
// TEAM & PROGRESS UI
// ==========================
export function renderTeam() {
    const teamList = document.getElementById('team-list');
    const noMembersMsg = document.getElementById('no-members-msg');

    teamList.innerHTML = '';
    noMembersMsg.style.display = (!appData.members || appData.members.length === 0) ? 'block' : 'none';

    appData.members?.forEach((member, index) => {
        const chip = document.createElement('md-input-chip');
        chip.label = member;
        chip.selected = true;
        chip.addEventListener('remove', () => {
            appData.members.splice(index, 1);
            saveData(renderTeam);
        });
        teamList.appendChild(chip);
    });
}

export function renderProgress() {
    const totalTasks = appData.tasks.length;
    const progressBar = document.getElementById('overall-progress');
    const progressLabel = document.getElementById('progress-label');

    if (totalTasks === 0) {
        progressBar.value = 0;
        progressLabel.innerText = '0%';
        return;
    }

    const doneTasks = appData.tasks.filter(t => t.status === 'done').length;
    const progress = doneTasks / totalTasks;
    progressBar.value = progress;
    progressLabel.innerText = `${Math.round(progress * 100)}%`;
}

// ==========================
// TIMELINE UI
// ==========================
export function renderTimeline(openTaskModalCallback) {
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '';

    phasesConfig.forEach(phase => {
        const phaseCard = document.createElement('div');
        phaseCard.className = 'card';
        const phaseTasks = appData.tasks.filter(t => t.phaseId === phase.id);

        phaseCard.innerHTML = `
            <div class="card-header">
                <md-icon>${phase.icon}</md-icon>
                <div>
                    <h3 class="md-typescale-title-large">${phase.title}</h3>
                    <p class="md-typescale-label-medium" style="color: var(--md-sys-color-outline);">${phase.dates}</p>
                </div>
            </div>
        `;

        const tasksContainer = document.createElement('div');
        tasksContainer.style.marginTop = '16px';

        phaseTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${task.status}`;
            const assigneeChip = task.assignee ? `<md-input-chip label="${task.assignee}" class="assignee-chip" disabled selected></md-input-chip>` : '';

            taskEl.innerHTML = `
                <md-icon-button class="toggle-status"><md-icon>${task.status === 'done' ? 'check_circle' : 'radio_button_unchecked'}</md-icon></md-icon-button>
                <span class="task-title md-typescale-body-large">${task.title}</span>
                ${assigneeChip}
                <md-icon-button class="edit-task"><md-icon>edit</md-icon></md-icon-button>
                <md-icon-button class="delete-task"><md-icon>delete</md-icon></md-icon-button>
            `;

            taskEl.querySelector('.toggle-status').addEventListener('click', () => {
                task.status = (task.status === 'todo') ? 'done' : 'todo';
                saveData(() => {
                    renderTimeline(openTaskModalCallback);
                    renderProgress();
                });
            });

            taskEl.querySelector('.task-title').addEventListener('click', () => openTaskModalCallback(null, task.id));
            taskEl.querySelector('.edit-task').addEventListener('click', () => openTaskModalCallback(null, task.id));
            taskEl.querySelector('.delete-task').addEventListener('click', () => {
                showConfirm("Excluir Tarefa?", "Tem certeza que deseja excluir esta tarefa?", () => {
                    const idx = appData.tasks.findIndex(t => t.id === task.id);
                    if (idx > -1) {
                        appData.tasks.splice(idx, 1);
                        saveData(() => {
                            renderTimeline(openTaskModalCallback);
                            renderProgress();
                        });
                    }
                });
            });

            tasksContainer.appendChild(taskEl);
        });

        const newButton = document.createElement('md-text-button');
        newButton.style.marginTop = '8px';
        newButton.innerHTML = '<md-icon slot="icon">add_circle_outline</md-icon> Nova Tarefa';
        newButton.addEventListener('click', () => openTaskModalCallback(phase.id));

        phaseCard.appendChild(tasksContainer);
        phaseCard.appendChild(newButton);
        timelineContainer.appendChild(phaseCard);
    });
}

// ==========================
// CALCULATOR UI
// ==========================
let resultsChart = null;

export function renderCalculator(updateIngredientCallback, deleteIngredientCallback, updateExtraCostCallback, deleteExtraCostCallback) {
    const ingredientInputsEl = document.getElementById('ingredient-inputs');
    const extraCostsInputsEl = document.getElementById('extra-costs-inputs');

    ingredientInputsEl.innerHTML = '';
    extraCostsInputsEl.innerHTML = '';

    appData.ingredients.forEach(item => {
        const el = document.createElement('div');
        el.className = 'input-row ingredient-row-grid';
        el.innerHTML = `
            <md-outlined-text-field label="Ingrediente" value="${item.name}" class="input-name"></md-outlined-text-field>
            <md-outlined-text-field label="Preço/Kg" type="number" value="${item.price}" prefix-text="R$" class="input-price"></md-outlined-text-field>
            <md-outlined-text-field label="Gramas" type="number" value="${item.grams}" suffix-text="g" class="input-grams"></md-outlined-text-field>
            <md-outlined-select label="Fonte" value="${item.source}" class="input-source">
                <md-select-option value="startup"><div slot="headline">💰 Startup</div></md-select-option>
                <md-select-option value="proprio"><div slot="headline">🏠 Casa</div></md-select-option>
            </md-outlined-select>
            <md-icon-button class="btn-delete"><md-icon>delete</md-icon></md-icon-button>
        `;

        // Attach event listeners manually to avoid inline JS strings
        el.querySelector('.input-name').addEventListener('input', (e) => updateIngredientCallback(item.id, 'name', e.target.value));
        el.querySelector('.input-price').addEventListener('input', (e) => updateIngredientCallback(item.id, 'price', e.target.value));
        el.querySelector('.input-grams').addEventListener('input', (e) => updateIngredientCallback(item.id, 'grams', e.target.value));
        el.querySelector('.input-source').addEventListener('change', (e) => updateIngredientCallback(item.id, 'source', e.target.value));
        el.querySelector('.btn-delete').addEventListener('click', () => deleteIngredientCallback(item.id));

        ingredientInputsEl.appendChild(el);
    });

    appData.extraCosts.forEach(item => {
        const el = document.createElement('div');
        el.className = 'input-row extracost-row-grid';
        el.innerHTML = `
            <md-outlined-text-field label="Custo" value="${item.name}" class="input-name"></md-outlined-text-field>
            <md-outlined-text-field label="Custo Total" type="number" value="${item.cost}" prefix-text="R$" class="input-cost"></md-outlined-text-field>
            <md-outlined-select label="Fonte" value="${item.source}" class="input-source">
                <md-select-option value="startup"><div slot="headline">💰 Startup</div></md-select-option>
                <md-select-option value="proprio"><div slot="headline">🏠 Casa</div></md-select-option>
            </md-outlined-select>
            <md-icon-button class="btn-delete"><md-icon>delete</md-icon></md-icon-button>
        `;

        el.querySelector('.input-name').addEventListener('input', (e) => updateExtraCostCallback(item.id, 'name', e.target.value));
        el.querySelector('.input-cost').addEventListener('input', (e) => updateExtraCostCallback(item.id, 'cost', e.target.value));
        el.querySelector('.input-source').addEventListener('change', (e) => updateExtraCostCallback(item.id, 'source', e.target.value));
        el.querySelector('.btn-delete').addEventListener('click', () => deleteExtraCostCallback(item.id));

        extraCostsInputsEl.appendChild(el);
    });
}

export function updateChart(totalCost, totalRevenue, netProfit) {
    const ctx = document.getElementById('results-chart').getContext('2d');

    const style = getComputedStyle(document.body);
    const red = style.getPropertyValue('--christmas-red').trim();
    const green = style.getPropertyValue('--christmas-green').trim();
    const gold = style.getPropertyValue('--christmas-gold').trim();
    const black = style.getPropertyValue('--christmas-black').trim();

    const resultColor = netProfit < 0 ? red : gold;

    // Data for Bar Chart
    const data = {
        labels: ['Custo Total', 'Receita Total', 'Resultado'],
        datasets: [{
            label: 'Valores (R$)',
            data: [totalCost, totalRevenue, netProfit],
            backgroundColor: [
                green, // Custo Total (Investimento)
                gold,   // Receita Total (Entrada)
                resultColor   // Resultado (Lucro/Prejuízo)
            ],
            borderColor: black,
            borderWidth: 3,
            barPercentage: 0.6
        }]
    };

    if (resultsChart) {
        resultsChart.data = data;
        resultsChart.update();
    } else {
        resultsChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: black,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                        cornerRadius: 0,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e0e0e0',
                            lineWidth: 2
                        },
                        ticks: {
                            color: black,
                            font: {
                                weight: 'bold'
                            }
                        },
                        border: {
                            width: 3,
                            color: black
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: black,
                            font: {
                                weight: 'bold'
                            }
                        },
                        border: {
                            width: 3,
                            color: black
                        }
                    }
                }
            }
        });
    }
}

export function updateCalculationUI(totalStartup, totalOwn, unitCost, margin, finalPrice, packagePrice, profit, netProfit, suggestedPrice, chartData) {
    document.getElementById('cost-startup').innerText = totalStartup.toFixed(2);
    document.getElementById('cost-own').innerText = totalOwn.toFixed(2);
    document.getElementById('unit-cost').innerText = unitCost.toFixed(2);
    document.getElementById('margin-display').innerText = `${margin}%`;
    document.getElementById('final-price').innerText = finalPrice.toFixed(2);
    document.getElementById('package-price').innerText = packagePrice.toFixed(2);
    document.getElementById('profit-unit').innerText = profit.toFixed(2);
    document.getElementById('suggested-price').innerText = suggestedPrice.toFixed(2);

    const netProfitEl = document.getElementById('net-profit');
    netProfitEl.innerText = netProfit.toFixed(2);
    netProfitEl.parentElement.classList.toggle('text-danger', netProfit < 0);

    updateChart(chartData.totalCost, chartData.totalRevenue, chartData.netProfit);
}
