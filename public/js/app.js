// API Base URL
const API_URL = '/api';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoForm = document.getElementById('todoForm');
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const healthStatus = document.getElementById('healthStatus');
const hostname = document.getElementById('hostname');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchTodos();
  checkHealth();
  setInterval(checkHealth, 30000); // Check health every 30 seconds
});

// Event Listeners
todoForm.addEventListener('submit', handleAddTodo);
clearCompletedBtn.addEventListener('click', clearCompleted);
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// Fetch all todos
async function fetchTodos() {
  try {
    const response = await fetch(`${API_URL}/todos`);
    if (!response.ok) throw new Error('Failed to fetch todos');
    todos = await response.json();
    renderTodos();
  } catch (error) {
    console.error('Error fetching todos:', error);
    showError('Failed to load todos');
  }
}

// Add new todo
async function handleAddTodo(e) {
  e.preventDefault();
  
  const title = todoTitle.value.trim();
  const description = todoDescription.value.trim();
  
  if (!title) return;
  
  try {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    
    if (!response.ok) throw new Error('Failed to add todo');
    
    const newTodo = await response.json();
    todos.push(newTodo);
    renderTodos();
    
    todoTitle.value = '';
    todoDescription.value = '';
    todoTitle.focus();
  } catch (error) {
    console.error('Error adding todo:', error);
    showError('Failed to add todo');
  }
}

// Toggle todo completion
async function toggleTodo(id) {
  try {
    const response = await fetch(`${API_URL}/todos/${id}/toggle`, {
      method: 'PATCH'
    });
    
    if (!response.ok) throw new Error('Failed to toggle todo');
    
    const updatedTodo = await response.json();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = updatedTodo;
      renderTodos();
    }
  } catch (error) {
    console.error('Error toggling todo:', error);
    showError('Failed to update todo');
  }
}

// Delete todo
async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete todo');
    
    todos = todos.filter(t => t.id !== id);
    renderTodos();
  } catch (error) {
    console.error('Error deleting todo:', error);
    showError('Failed to delete todo');
  }
}

// Clear completed todos
async function clearCompleted() {
  const completedTodos = todos.filter(t => t.completed);
  if (completedTodos.length === 0) return;
  
  try {
    await Promise.all(
      completedTodos.map(todo =>
        fetch(`${API_URL}/todos/${todo.id}`, { method: 'DELETE' })
      )
    );
    
    todos = todos.filter(t => !t.completed);
    renderTodos();
  } catch (error) {
    console.error('Error clearing completed:', error);
    showError('Failed to clear completed todos');
  }
}

// Render todos based on current filter
function renderTodos() {
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });
  
  if (filteredTodos.length === 0) {
    todoList.innerHTML = `
      <li class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No todos yet. Add one above!</p>
      </li>
    `;
  } else {
    todoList.innerHTML = filteredTodos.map(todo => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input 
          type="checkbox" 
          class="todo-checkbox" 
          ${todo.completed ? 'checked' : ''}
          onchange="toggleTodo('${todo.id}')"
        >
        <div class="todo-content">
          <div class="todo-title">${escapeHtml(todo.title)}</div>
          ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
          <div class="todo-meta">Created: ${formatDate(todo.createdAt)}</div>
        </div>
        <button class="todo-delete" onclick="deleteTodo('${todo.id}')" title="Delete">×</button>
      </li>
    `).join('');
  }
  
  updateStats();
}

// Update statistics
function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  
  totalCount.textContent = total;
  activeCount.textContent = active;
  completedCount.textContent = completed;
}

// Check health status
async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    
    const data = await response.json();
    healthStatus.textContent = '● Healthy';
    healthStatus.className = 'healthy';
    hostname.textContent = data.system.hostname || '-';
  } catch (error) {
    healthStatus.textContent = '● Unhealthy';
    healthStatus.className = 'unhealthy';
    hostname.textContent = '-';
  }
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  console.error(message);
  // Could add toast notification here
}
