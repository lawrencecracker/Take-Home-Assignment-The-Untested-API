const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('Task service', () => {
  it('creates a task with the expected defaults', () => {
    const task = taskService.create({ title: 'Write tests' });

    expect(task).toMatchObject({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      assignee: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
  });

  it('returns only tasks with the exact requested status', () => {
    taskService.create({ title: 'Alpha', status: 'todo' });
    taskService.create({ title: 'Beta', status: 'done' });
    taskService.create({ title: 'Gamma', status: 'todo' });

    const result = taskService.getByStatus('todo');

    expect(result).toHaveLength(2);
    expect(result.every((task) => task.status === 'todo')).toBe(true);
  });

  it('paginates tasks starting from the first item on page 1', () => {
    ['First', 'Second', 'Third', 'Fourth'].forEach((title) => {
      taskService.create({ title });
    });

    const firstPage = taskService.getPaginated(1, 2).map((task) => task.title);
    const secondPage = taskService.getPaginated(2, 2).map((task) => task.title);

    expect(firstPage).toEqual(['First', 'Second']);
    expect(secondPage).toEqual(['Third', 'Fourth']);
  });

  it('aggregates task counts and overdue tasks', () => {
    taskService.create({ title: 'Past due', status: 'todo', dueDate: new Date(Date.now() - 3600000).toISOString() });
    taskService.create({ title: 'Current', status: 'in_progress', dueDate: new Date(Date.now() + 3600000).toISOString() });
    taskService.create({ title: 'Done', status: 'done', dueDate: new Date(Date.now() - 3600000).toISOString() });

    const stats = taskService.getStats();

    expect(stats).toMatchObject({
      todo: 1,
      in_progress: 1,
      done: 1,
      overdue: 1,
    });
  });

  it('marks a task complete and sets the completion timestamp', () => {
    const task = taskService.create({ title: 'Finish sprint' });
    const updated = taskService.completeTask(task.id);

    expect(updated.status).toBe('done');
    expect(updated.completedAt).toEqual(expect.any(String));
    expect(updated.priority).toBe('medium');
  });

  it('assigns a task to a user', () => {
    const task = taskService.create({ title: 'Assign me' });
    const updated = taskService.assignTask(task.id, 'Alicia');

    expect(updated.assignee).toBe('Alicia');
    expect(taskService.findById(task.id).assignee).toBe('Alicia');
  });
});

describe('API routes', () => {
  it('lists all tasks', async () => {
    taskService.create({ title: 'One' });
    taskService.create({ title: 'Two' });

    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('filters tasks by status', async () => {
    taskService.create({ title: 'Todo 1', status: 'todo' });
    taskService.create({ title: 'Done 1', status: 'done' });

    const response = await request(app).get('/tasks?status=todo');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Todo 1');
  });

  it('paginates results correctly', async () => {
    ['One', 'Two', 'Three', 'Four'].forEach((title) => {
      taskService.create({ title });
    });

    const response = await request(app).get('/tasks?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual(['One', 'Two']);
  });

  it('creates a task with valid payload', async () => {
    const body = {
      title: 'New task',
      description: 'Daily work',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-10-01T00:00:00.000Z',
    };

    const response = await request(app).post('/tasks').send(body);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'New task',
      description: 'Daily work',
      priority: 'high',
      status: 'todo',
    });
  });

  it('rejects task creation when title is invalid', async () => {
    const response = await request(app).post('/tasks').send({ title: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/title/i);
  });

  it('updates an existing task', async () => {
    const task = taskService.create({ title: 'Old title' });

    const response = await request(app).put(`/tasks/${task.id}`).send({ title: 'New title', priority: 'high' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      title: 'New title',
      priority: 'high',
    });
  });

  it('returns 404 when updating a missing task', async () => {
    const response = await request(app).put('/tasks/missing-id').send({ title: 'Nope' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('deletes a task', async () => {
    const task = taskService.create({ title: 'Delete me' });

    const response = await request(app).delete(`/tasks/${task.id}`);

    expect(response.status).toBe(204);
    expect(taskService.getAll()).toHaveLength(0);
  });

  it('returns 404 when deleting a missing task', async () => {
    const response = await request(app).delete('/tasks/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('marks a task as complete', async () => {
    const task = taskService.create({ title: 'Complete me' });

    const response = await request(app).patch(`/tasks/${task.id}/complete`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('done');
    expect(response.body.completedAt).toEqual(expect.any(String));
  });

  it('returns 404 when completing a missing task', async () => {
    const response = await request(app).patch('/tasks/missing-id/complete');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('assigns a task to a user', async () => {
    const task = taskService.create({ title: 'Needs owner' });

    const response = await request(app).patch(`/tasks/${task.id}/assign`).send({ assignee: 'Alicia' });

    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Alicia');
  });

  it('rejects empty assignee values', async () => {
    const task = taskService.create({ title: 'Needs owner' });

    const response = await request(app).patch(`/tasks/${task.id}/assign`).send({ assignee: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/assignee/i);
  });

  it('returns 404 when assigning a missing task', async () => {
    const response = await request(app).patch('/tasks/missing-id/assign').send({ assignee: 'Alicia' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('returns task stats', async () => {
    taskService.create({ title: 'One', status: 'todo', dueDate: new Date(Date.now() - 3600000).toISOString() });
    taskService.create({ title: 'Two', status: 'done' });

    const response = await request(app).get('/tasks/stats');

    expect(response.status).toBe(200);
    expect(response.body.todo).toBe(1);
    expect(response.body.done).toBe(1);
    expect(response.body.overdue).toBe(1);
  });
});
