type Priority = 'low' | 'medium' | 'high';

type Filter = 'all' | 'active' | 'completed' | 'high';

interface Task {
  id: number;
  text: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'tasks';

let tasks: Task[] = loadTasks();
let currentFilter: Filter = 'all';

function loadTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element: #${id}`);
  }
  return element as T;
}

function init(): void {
  updateStats();
  renderTasks();
  setupEventListeners();
}

function setupEventListeners(): void {
  const taskInput = requireElement<HTMLInputElement>('taskInput');
  taskInput.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  });

  requireElement<HTMLButtonElement>('addTaskBtn').addEventListener('click', addTask);
  requireElement<HTMLButtonElement>('clearCompletedBtn').addEventListener('click', clearCompleted);

  document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterTasks((btn.dataset.filter ?? 'all') as Filter, btn);
    });
  });

  requireElement<HTMLDivElement>('tasksList').addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const action = target.closest<HTMLElement>('[data-action]');
    const id = taskIdFrom(target);
    if (action === null || id === null) {
      return;
    }
    if (action.dataset.action === 'edit') {
      editTask(id);
    } else if (action.dataset.action === 'delete') {
      deleteTask(id);
    }
  });

  requireElement<HTMLDivElement>('tasksList').addEventListener('change', (e: Event) => {
    const target = e.target as HTMLElement;
    const id = taskIdFrom(target);
    if (target.classList.contains('task-checkbox') && id !== null) {
      toggleTask(id);
    }
  });
}

function taskIdFrom(element: HTMLElement): number | null {
  const item = element.closest<HTMLElement>('.task-item');
  const id = Number(item?.dataset.id);
  return Number.isFinite(id) && id !== 0 ? id : null;
}

function addTask(): void {
  const taskInput = requireElement<HTMLInputElement>('taskInput');
  const prioritySelect = requireElement<HTMLSelectElement>('prioritySelect');

  const text = taskInput.value.trim();
  if (text === '') {
    alert('Please enter a task!');
    return;
  }

  const newTask: Task = {
    id: Date.now(),
    text,
    priority: prioritySelect.value as Priority,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  updateStats();

  taskInput.value = '';
  taskInput.focus();

  const taskElement = document.querySelector<HTMLElement>(`[data-id="${newTask.id}"]`);
  if (taskElement !== null) {
    taskElement.classList.add('pulse');
    setTimeout(() => taskElement.classList.remove('pulse'), 500);
  }
}

function toggleTask(id: number): void {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
  }
}

function editTask(id: number): void {
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

function deleteTask(id: number): void {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

function clearCompleted(): void {
  if (confirm('Are you sure you want to clear all completed tasks?')) {
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

function filterTasks(filter: Filter, button: HTMLElement): void {
  currentFilter = filter;

  document.querySelectorAll<HTMLElement>('.filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  renderTasks();
}

function saveTasks(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateStats(): void {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  requireElement('totalTasks').textContent = String(total);
  requireElement('completedTasks').textContent = String(completed);
  requireElement('pendingTasks').textContent = String(pending);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTasks(): void {
  const tasksList = requireElement<HTMLDivElement>('tasksList');
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
    .map(
      (task) => `
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
  `,
    )
    .join('');
}

window.addEventListener('load', init);
