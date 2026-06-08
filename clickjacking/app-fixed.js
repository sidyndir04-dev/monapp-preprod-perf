// ============================================================
// APP CORRIGEE - Protection Clickjacking (OWASP A05:2021)
// ============================================================
// CORRECTIONS APPLIQUEES :
//
// 1. helmet.frameguard({ action: 'SAMEORIGIN' })
//    => Ajoute : X-Frame-Options: SAMEORIGIN
//    => Seul le meme domaine peut integrer cette app en iframe
//
// 2. helmet.contentSecurityPolicy avec frame-ancestors 'none'
//    => Ajoute : Content-Security-Policy: frame-ancestors 'none'
//    => Aucun site ne peut integrer cette app en iframe (plus strict)
//
// VERIFICATION :
//   curl -I http://localhost:3001
//   => X-Frame-Options: SAMEORIGIN doit apparaitre
//   => Content-Security-Policy: frame-ancestors 'none' doit apparaitre
//
// EFFET SUR L'ATTAQUE :
//   La page attaque.html ne peut plus charger l'app dans une iframe.
//   Le navigateur bloque le chargement et affiche une erreur :
//   "Refused to display '...' in a frame because it set 'X-Frame-Options' to 'sameorigin'."
// ============================================================

const express = require('express');
const helmet  = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// CORRECTION 1 : helmet.frameguard => X-Frame-Options: SAMEORIGIN
// ============================================================
// Empeche l'integration de cette app dans une iframe
// sauf depuis la meme origine (meme domaine).
// SAMEORIGIN est le niveau recommande pour la plupart des apps.
// Utilisez 'DENY' si vous ne voulez AUCUNE iframe, meme propre.
app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

// ============================================================
// CORRECTION 2 : Content-Security-Policy frame-ancestors
// ============================================================
// Plus moderne et plus puissant que X-Frame-Options.
// frame-ancestors 'none' => aucune iframe autorisee, nulle part.
// Pour autoriser seulement votre propre domaine :
//   frame-ancestors 'self'
// Pour autoriser un domaine specifique :
//   frame-ancestors https://trusted.example.com
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"], // Remplacer par ["'self'"] si besoin
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
    },
  })
);

// Autres headers de securite recommandes
app.use(helmet.noSniff());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

// ============================================================
// PAGE D'ACCUEIL (identique a l'app vulnerable)
// ============================================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>MonApp - Espace Client (VERSION SECURISEE)</title>
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
        .badge-secure {
          background: #e8f5e9; color: #2e7d32; font-size: 0.8rem;
          padding: 4px 12px; border-radius: 12px; display: inline-block;
          margin-bottom: 16px; font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge-secure">✅ Version securisee - Anti-Clickjacking</div>
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
  `);
});

app.post('/confirmer', (req, res) => {
  res.send('<h2>Virement confirme ! (simulation)</h2>');
});

app.listen(PORT, () => {
  console.log(`[SECURE] Serveur demarre sur http://localhost:${PORT}`);
  console.log('[SECURE] Headers anti-Clickjacking actifs :');
  console.log('[SECURE]   X-Frame-Options: SAMEORIGIN');
  console.log('[SECURE]   Content-Security-Policy: frame-ancestors \'none\'');
  console.log('[SECURE] La page attaque.html ne peut plus integrer cette app !');
});

/*
=================================================================
VERIFICATION POST-CORRECTION :

$ curl -I http://localhost:3001

HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN                          <== PROTEGE
Content-Security-Policy: frame-ancestors 'none';...  <== PROTEGE
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer

EFFET VISIBLE DANS LE NAVIGATEUR :
Si attaque.html tente de charger http://localhost:3001 dans une iframe,
le navigateur affiche dans la console :
"Refused to display 'http://localhost:3001/' in a frame because
 it set 'X-Frame-Options' to 'sameorigin'."

L'iframe reste vide, le Clickjacking est bloque.
=================================================================
*/
