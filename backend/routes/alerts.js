const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const verifyToken = require('../middleware/authMiddleware');

const pool = new Pool(); // Se base sur .env

// DELETE /api/alerts/:id — Supprime une alerte si l'utilisateur en est l'auteur
router.delete('/:id', verifyToken, async (req, res) => {
  const alertId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING *',
      [alertId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette alerte.' });
    }

    res.status(200).json({ message: 'Alerte supprimée' });
  } catch (err) {
    console.error('Erreur suppression alerte:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/alerts — Liste toutes les alertes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.status(200).json({ alerts: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes :', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { latitude, longitude, type } = req.body;
  const userId = req.user.userId;

  if (!latitude || !longitude || !type) {
    return res.status(400).json({ message: 'Coordonnées et type requis' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO alerts (latitude, longitude, type, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [latitude, longitude, type, userId]
    );

    res.status(201).json({ message: 'Alerte enregistrée', alert: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de l’alerte :', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

router.post('/photo', verifyToken, upload.single('photo'), async (req, res) => {
  const userId = req.user.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Aucun fichier reçu.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO alerts (latitude, longitude, type, user_id, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [0, 0, 'photo', userId, file.filename] // ici lat/lng = 0 car non fournis
    );

    res.status(201).json({ message: 'Photo enregistrée', alertId: result.rows[0].id });
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de la photo :', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;