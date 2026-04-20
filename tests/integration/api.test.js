const request = require('supertest');
const app = require('../../src/app');

describe('Student Grade Tracker API Integration Tests', () => {

  beforeEach(() => {
    app.resetStudents();
  });

  // Health check
  test('GET /health should return UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  // Get all students (empty)
  test('GET /students should return empty array initially', async () => {
    const res = await request(app).get('/students');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  // Create a student
  test('POST /students should create a new student', async () => {
    const res = await request(app).post('/students').send({
      name: 'John Doe',
      subject: 'Mathematics',
      grade: 85,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('John Doe');
    expect(res.body.data.grade).toBe(85);
  });

  // Create student with missing fields
  test('POST /students should fail without required fields', async () => {
    const res = await request(app).post('/students').send({
      name: 'John Doe',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Get student by ID
  test('GET /students/:id should return a student', async () => {
    await request(app).post('/students').send({
      name: 'Jane Smith',
      subject: 'Science',
      grade: 90,
    });
    const res = await request(app).get('/students/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Jane Smith');
  });

  // Update a student
  test('PUT /students/:id should update a student', async () => {
    await request(app).post('/students').send({
      name: 'Alice',
      subject: 'English',
      grade: 70,
    });
    const res = await request(app).put('/students/1').send({ grade: 95 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.grade).toBe(95);
  });

  // Delete a student
  test('DELETE /students/:id should delete a student', async () => {
    await request(app).post('/students').send({
      name: 'Bob',
      subject: 'History',
      grade: 60,
    });
    const res = await request(app).delete('/students/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Get non-existent student
  test('GET /students/:id should return 404 for missing student', async () => {
    const res = await request(app).get('/students/999');
    expect(res.statusCode).toBe(404);
  });

});