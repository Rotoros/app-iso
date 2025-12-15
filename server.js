import express from 'express';
import { join, dirname } from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const dbFile = join(__dirname, 'db.json');

// Configuración de lowdb
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { tasks: [] });

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Inicializar DB
async function initializeDB() {
  await db.read();
  db.data ||= { tasks: [] };
  await db.write();
}

initializeDB().then(() => {
  console.log("✅ Base de datos LowDB inicializada.");

  // Obtener todas las tareas
  app.get('/api/tasks', async (req, res) => {
    await db.read();
    res.json(db.data.tasks);
  });

  // Crear nueva tarea
  app.post('/api/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'El título es obligatorio' });

    const newTask = { id: Date.now(), title, completed: false };
    await db.read();
    db.data.tasks.push(newTask);
    await db.write();
    res.status(201).json(newTask);
  });

  // Cambiar estado de tarea
  app.put('/api/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;

    await db.read();
    const task = db.data.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    if (completed !== undefined) task.completed = completed;
    await db.write();
    res.json(task);
  });

  // Eliminar tarea
  app.delete('/api/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id);

    await db.read();
    const initialLength = db.data.tasks.length;
    db.data.tasks = db.data.tasks.filter(t => t.id !== taskId);

    if (db.data.tasks.length === initialLength)
      return res.status(404).json({ error: 'Tarea no encontrada' });

    await db.write();
    res.status(204).send();
  });

  // Servir frontend
  app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));

  // Iniciar servidor
  app.listen(port, () => console.log(`🚀 Servidor en http://localhost:${port}`));
});
