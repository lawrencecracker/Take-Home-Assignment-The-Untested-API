const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('Additional API edge cases', () => {
  it('trims surrounding whitespace from an assignee name', async () => {
    const task = taskService.create({ title: 'Assign me' });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '  Alicia  ' });

    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Alicia');
  });

  it.each([
    {},
    { assignee: '' },
    { assignee: '   ' },
    { assignee: 42 },
    { assignee: null },
  ])('rejects an invalid assignee payload: %p', async (payload) => {
    const task = taskService.create({ title: 'Needs owner' });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/assignee/i);
  });

  it('falls back to safe pagination defaults for non-positive values', async () => {
    ['First', 'Second', 'Third'].forEach((title) => taskService.create({ title }));

    const response = await request(app).get('/tasks?page=0&limit=0');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual(['First', 'Second', 'Third']);
  });

  it('rejects invalid task fields at the API boundary', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: 'Invalid task', status: 'unknown', priority: 'urgent' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/status|priority/i);
  });

  it('returns null when a service lookup cannot find a task', () => {
    expect(taskService.findById('missing-id')).toBeUndefined();
    expect(taskService.assignTask('missing-id', 'Alicia')).toBeNull();
    expect(taskService.completeTask('missing-id')).toBeNull();
  });
});
