const request = require('supertest');
const app = require('../src/server');

describe('Health Endpoints', () => {
  test('GET /api/health/live should return 200', async () => {
    const response = await request(app).get('/api/health/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });

  test('GET /api/health should return health info', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('system');
  });
});

describe('Todo Endpoints', () => {
  let createdTodoId;

  test('GET /api/todos should return array', async () => {
    const response = await request(app).get('/api/todos');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/todos should create todo', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: 'Test Todo', description: 'Test Description' });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Todo');
    expect(response.body.completed).toBe(false);
    createdTodoId = response.body.id;
  });

  test('POST /api/todos without title should return 400', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ description: 'No title' });
    
    expect(response.status).toBe(400);
  });

  test('PATCH /api/todos/:id/toggle should toggle completion', async () => {
    if (!createdTodoId) return;
    
    const response = await request(app)
      .patch(`/api/todos/${createdTodoId}/toggle`);
    
    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
  });

  test('DELETE /api/todos/:id should delete todo', async () => {
    if (!createdTodoId) return;
    
    const response = await request(app)
      .delete(`/api/todos/${createdTodoId}`);
    
    expect(response.status).toBe(200);
  });
});
