const fs = require('fs');
const path = require('path');

let DATA_PATH = './data/todos.json';

/**
 * Initialize the storage directory and file
 * @param {string} dataDir - Directory path for data storage
 */
function initializeStorage(dataDir) {
  const resolvedDir = path.resolve(dataDir);
  DATA_PATH = path.join(resolvedDir, 'todos.json');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
    console.log(`Created data directory: ${resolvedDir}`);
  }
  
  // Create todos.json if it doesn't exist
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
    console.log(`Created data file: ${DATA_PATH}`);
  }
  
  console.log(`Storage initialized at: ${DATA_PATH}`);
}

/**
 * Read all todos from the JSON file
 * @returns {Array} Array of todo objects
 */
function readTodos() {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading todos:', error.message);
    return [];
  }
}

/**
 * Write todos to the JSON file
 * @param {Array} todos - Array of todo objects to save
 */
function writeTodos(todos) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error writing todos:', error.message);
    throw error;
  }
}

module.exports = {
  initializeStorage,
  readTodos,
  writeTodos
};
