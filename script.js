let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Initialize the application
function init() {
  updateStats();
  renderTasks();
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  const taskInput = document.getElementById('taskInput');
  taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });
}

// Add a new task
function addTask() {
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  
  const text = taskInput.value.trim();
  if (text === '') {
    alert('Please enter a task!');
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    priority: prioritySelect.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  updateStats();
  
  taskInput.value = '';
  taskInput.focus();
  
  // Add pulse animation to the new task
  const taskElement = document.querySelector(`[data-id="${newTask.id}"]`);
  if (taskElement) {
    taskElement.classList.add('pulse');
    setTimeout(() => taskElement.classList.remove('pulse'), 500);
  }
}

// Toggle task completion
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
  }
}

// Edit a task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    const newText = prompt('Edit your task:', task.text);
    if (newText !== null && newText.trim() !== '') {
      task.text = newText.trim();
      saveTasks();
      renderTasks();
    }
  }
}

// Delete a task
function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

// Clear all completed tasks
function clearCompleted() {
  if (confirm('Are you sure you want to clear all completed tasks?')) {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

// Filter tasks
function filterTasks(filter) {
  currentFilter = filter;
  
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Update statistics
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  document.getElementById('totalTasks').textContent = total;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('pendingTasks').textContent = pending;
}

// Render tasks based on current filter
function renderTasks() {
  const tasksList = document.getElementById('tasksList');
  let filteredTasks = tasks;

  // Apply filter
  switch (currentFilter) {
    case 'active':
      filteredTasks = tasks.filter(t => !t.completed);
      break;
    case 'completed':
      filteredTasks = tasks.filter(t => t.completed);
      break;
    case 'high':
      filteredTasks = tasks.filter(t => t.priority === 'high');
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

  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
             onchange="toggleTask(${task.id})">
      <div class="task-content">
        <div class="task-text">${task.text}</div>
        <div class="task-meta">
          <span class="priority priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
          <span>${new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" onclick="editTask(${task.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn" onclick="deleteTask(${task.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Initialize the app when the page loads
window.onload = init;
