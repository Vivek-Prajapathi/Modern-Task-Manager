"use strict";
const STORAGE_KEY = 'tasks';
let tasks = loadTasks();
let currentFilter = 'all';
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return [];
    }
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function requireElement(id) {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Missing element: #${id}`);
    }
    return element;
}
function init() {
    updateStats();
    renderTasks();
    setupEventListeners();
}
function setupEventListeners() {
    const taskInput = requireElement('taskInput');
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    requireElement('addTaskBtn').addEventListener('click', addTask);
    requireElement('clearCompletedBtn').addEventListener('click', clearCompleted);
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            filterTasks((btn.dataset.filter ?? 'all'), btn);
        });
    });
    requireElement('tasksList').addEventListener('click', (e) => {
        const target = e.target;
        const action = target.closest('[data-action]');
        const id = taskIdFrom(target);
        if (action === null || id === null) {
            return;
        }
        if (action.dataset.action === 'edit') {
            editTask(id);
        }
        else if (action.dataset.action === 'delete') {
            deleteTask(id);
        }
    });
    requireElement('tasksList').addEventListener('change', (e) => {
        const target = e.target;
        const id = taskIdFrom(target);
        if (target.classList.contains('task-checkbox') && id !== null) {
            toggleTask(id);
        }
    });
}
function taskIdFrom(element) {
    const item = element.closest('.task-item');
    const id = Number(item?.dataset.id);
    return Number.isFinite(id) && id !== 0 ? id : null;
}
function addTask() {
    const taskInput = requireElement('taskInput');
    const prioritySelect = requireElement('prioritySelect');
    const text = taskInput.value.trim();
    if (text === '') {
        alert('Please enter a task!');
        return;
    }
    const newTask = {
        id: Date.now(),
        text,
        priority: prioritySelect.value,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    taskInput.value = '';
    taskInput.focus();
    const taskElement = document.querySelector(`[data-id="${newTask.id}"]`);
    if (taskElement !== null) {
        taskElement.classList.add('pulse');
        setTimeout(() => taskElement.classList.remove('pulse'), 500);
    }
}
function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}
function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        const newText = prompt('Edit your task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
}
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
}
function clearCompleted() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter((t) => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}
function filterTasks(filter, button) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    renderTasks();
}
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    requireElement('totalTasks').textContent = String(total);
    requireElement('completedTasks').textContent = String(completed);
    requireElement('pendingTasks').textContent = String(pending);
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function renderTasks() {
    const tasksList = requireElement('tasksList');
    let filteredTasks = tasks;
    switch (currentFilter) {
        case 'active':
            filteredTasks = tasks.filter((t) => !t.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter((t) => t.completed);
            break;
        case 'high':
            filteredTasks = tasks.filter((t) => t.priority === 'high');
            break;
    }
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No tasks found</h3>
        <p>Try changing your filter or add a new task</p>
      </div>
    `;
        return;
    }
    tasksList.innerHTML = filteredTasks
        .map((task) => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="priority priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
          <span>${new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" data-action="edit" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn" data-action="delete" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `)
        .join('');
}
window.addEventListener('load', init);
//# sourceMappingURL=main.js.map