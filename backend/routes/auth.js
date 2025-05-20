const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool(); // se base sur .env

// Enregistrement d’un utilisateur
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Vérifie la présence des champs
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    // Vérifie si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Utilisateur déjà enregistré' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion dans la base
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’enregistrement :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;