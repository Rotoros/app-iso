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

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { reservas: [] });

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

async function initializeDB() {
  await db.read();
  db.data ||= { reservas: [] };
  await db.write();
}

initializeDB().then(() => {
  console.log("✅ Base de datos LowDB inicializada.");

  // Obtener reservas
  app.get('/api/reservas', async (req, res) => {
    await db.read();
    res.json(db.data.reservas);
  });

  // Crear reserva
  app.post('/api/reservas', async (req, res) => {
    const { nombre, fecha, personas, mesa } = req.body;
    if (!nombre || !fecha || !personas || !mesa) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const newReserva = {
      id: Date.now(),
      nombre,
      fecha,
      personas,
      mesa
    };

    await db.read();
    db.data.reservas.push(newReserva);
    await db.write();
    res.status(201).json(newReserva);
  });

  // Cancelar reserva
  app.delete('/api/reservas/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await db.read();
    const initialLength = db.data.reservas.length;
    db.data.reservas = db.data.reservas.filter(r => r.id !== id);
    if (db.data.reservas.length === initialLength) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    await db.write();
    res.status(204).send();
  });

  // Servir frontend
  app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));

  app.listen(port, () => console.log(`🚀 Servidor en http://localhost:${port}`));
});
