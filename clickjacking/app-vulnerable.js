// ============================================================
// APP VULNERABLE - Demo Clickjacking (OWASP A05:2021)
// ATTENTION : Ne pas utiliser en production !
// ============================================================
// Cette application ne definit AUCUN header X-Frame-Options
// ni Content-Security-Policy frame-ancestors.
// Elle peut donc etre integree dans n'importe quelle iframe,
// ce qui ouvre la porte aux attaques Clickjacking.
// ============================================================

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// AUCUN HEADER DE SECURITE ANTI-CLICKJACKING
// => Pas de X-Frame-Options
// => Pas de Content-Security-Policy frame-ancestors
// => L'app peut etre chargee dans une <iframe> par n'importe quel site
// ============================================================

app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>MonApp - Espace Client</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f0f2f5; display: flex;
               justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; border-radius: 8px; padding: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15); text-align: center; width: 360px; }
        h1 { color: #1a73e8; margin-bottom: 8px; }
        p  { color: #555; margin-bottom: 24px; }
        .amount { font-size: 2rem; font-weight: bold; color: #333; margin: 16px 0; }
        button {
          background: #1a73e8; color: white; border: none;
          padding: 14px 32px; font-size: 1rem; border-radius: 6px;
          cursor: pointer; width: 100%;
        }
        button:hover { background: #1558b0; }
        .warning { font-size: 0.8rem; color: #999; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Confirmer le virement</h1>
        <p>Vous etes sur le point de transferer :</p>
        <div class="amount">500 EUR</div>
        <p>Vers le compte : <strong>FR76 1234 5678 9012</strong></p>
        <form action="/confirmer" method="POST">
          <button type="submit" id="btn-confirm">Confirmer le virement</button>
        </form>
        <p class="warning">Cette action est irreversible.</p>
      </div>
    </body>
    </html>
  \`);
});

app.post('/confirmer', (req, res) => {
  // Simulation : en vrai, ici on executerait le virement bancaire
  res.send('<h2>Virement confirme ! (simulation)</h2>');
});

app.listen(PORT, () => {
  console.log(\`[VULNERABLE] Serveur demarre sur http://localhost:\${PORT}\`);
  console.log('[VULNERABLE] Aucun header X-Frame-Options => vulnerable au Clickjacking !');
});
