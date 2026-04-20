const express = require('express');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// ── Prometheus Metrics Setup ─────────────────────────────────────────────
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// ── In-Memory Data Store ─────────────────────────────────────────────────
let students = [];
let nextId = 1;

// ── Routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Get all students
app.get('/students', (req, res) => {
  httpRequestCounter.inc({ method: 'GET', route: '/students', status: 200 });
  res.json({ success: true, data: students });
});

// Get one student
app.get('/students/:id', (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  res.json({ success: true, data: student });
});

// Add a student
app.post('/students', (req, res) => {
  const { name, subject, grade } = req.body;
  if (!name || !subject || grade === undefined) {
    return res.status(400).json({ success: false, message: 'Name, subject and grade are required' });
  }
  const student = {
    id: nextId++,
    name,
    subject,
    grade,
    createdAt: new Date().toISOString(),
  };
  students.push(student);
  res.status(201).json({ success: true, data: student });
});

// Update a student
app.put('/students/:id', (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  const { name, subject, grade } = req.body;
  if (name !== undefined) student.name = name;
  if (subject !== undefined) student.subject = subject;
  if (grade !== undefined) student.grade = grade;
  res.json({ success: true, data: student });
});

// Delete a student
app.delete('/students/:id', (req, res) => {
  const index = students.findIndex((s) => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  students.splice(index, 1);
  res.json({ success: true, message: 'Student deleted' });
});

// Reset helper for tests
app.resetStudents = () => {
  students = [];
  nextId = 1;
};

module.exports = app;