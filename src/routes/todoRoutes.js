const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readTodos, writeTodos } = require('../utils/storage');

// GET all todos
router.get('/', (req, res) => {
  try {
    const todos = readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET single todo by ID
router.get('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const todo = todos.find(t => t.id === req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST create new todo
router.post('/', (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todos = readTodos();
    const newTodo = {
      id: uuidv4(),
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    todos.push(newTodo);
    writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT update todo
router.put('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const index = todos.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { title, description, completed } = req.body;
    const updatedTodo = {
      ...todos[index],
      title: title !== undefined ? title.trim() : todos[index].title,
      description: description !== undefined ? description.trim() : todos[index].description,
      completed: completed !== undefined ? completed : todos[index].completed,
      updatedAt: new Date().toISOString()
    };

    todos[index] = updatedTodo;
    writeTodos(todos);
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// PATCH toggle todo completion
router.patch('/:id/toggle', (req, res) => {
  try {
    const todos = readTodos();
    const index = todos.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos[index].completed = !todos[index].completed;
    todos[index].updatedAt = new Date().toISOString();
    
    writeTodos(todos);
    res.json(todos[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

// DELETE todo
router.delete('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const index = todos.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = todos.splice(index, 1)[0];
    writeTodos(todos);
    res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// DELETE all completed todos
router.delete('/completed/clear', (req, res) => {
  try {
    let todos = readTodos();
    const completedCount = todos.filter(t => t.completed).length;
    todos = todos.filter(t => !t.completed);
    writeTodos(todos);
    res.json({ message: `Cleared ${completedCount} completed todos` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

module.exports = router;
