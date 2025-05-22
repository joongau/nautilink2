require('dotenv').config();
const alertsRoutes = require('./routes/alerts');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

const { Pool } = require('pg');

const pool = new Pool(); // se base automatiquement sur les variables d'env PG*

app.use(cors());
app.use(helmet());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API de NautiLink2 🚤');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur de connexion PostgreSQL:', error);
    res.status(500).send('Erreur de connexion à la base de données');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});