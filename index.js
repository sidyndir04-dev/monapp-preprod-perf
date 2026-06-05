const express = require('express');
const mysql2 = require('mysql2');
const { query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Configuration base de donnees (mysql2)
// ============================================================
const db = mysql2.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'testdb'
});

// ============================================================
// SECURITE : En-tetes HTTP (protection OWASP)
// ============================================================
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ============================================================
// ROUTE VULNERABLE (A03:2021 - Injection SQL)
// NE PAS UTILISER EN PRODUCTION
// ============================================================
// Exemple d'attaque : GET /user/vulnerable?username=' OR '1'='1
// La requete devient : SELECT * FROM users WHERE username = '' OR '1'='1'
// => Retourne TOUS les utilisateurs de la base !
app.get('/user/vulnerable', (req, res) => {
  const username = req.query.username;
  // VULNERABILITE : concatenation directe de l'entree utilisateur
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ============================================================
// ROUTE CORRIGEE - Requetes parametrees (Prepared Statements)
// ============================================================
app.get('/user', [
  query('username').isAlphanumeric().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const username = req.query.username;
  // CORRECTION : utilisation d'un placeholder ? pour eviter l'injection
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.execute(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ============================================================
// Page d'accueil
// ============================================================
app.get('/', (req, res) => {
  res.send('<html><head><title>Secure App</title></head><body>' +
    '<h1>Application securisee - OWASP A03:2021</h1>' +
    '<p>Endpoints disponibles :</p>' +
    '<ul>' +
    '<li><strong>/user?username=test</strong> — Route corrigee (prepared statement)</li>' +
    '<li><strong>/user/vulnerable?username=test</strong> — Route vulnerable (demo SQLi)</li>' +
    '</ul>' +
    '</body></html>');
});

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
