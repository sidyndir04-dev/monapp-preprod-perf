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
//    => Aucun site ne peut integrer cette app en iframe
//
// VERIFICATION :
//   curl -I http://localhost:3001
//   => X-Frame-Options: SAMEORIGIN doit apparaitre
// ============================================================

const express = require('express');
const helmet  = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// CORRECTION 1 : helmet.frameguard => X-Frame-Options: SAMEORIGIN
// ============================================================
app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

// ============================================================
// CORRECTION 2 : Content-Security-Policy frame-ancestors 'none'
// ============================================================
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
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
  const html = '<!DOCTYPE html>' +
    '<html lang="fr"><head>' +
    '<meta charset="UTF-8" />' +
    '<title>MonApp - Espace Client (SECURISEE)</title>' +
    '<style>' +
    'body { font-family: Arial, sans-serif; background: #f0f2f5;' +
    ' display: flex; justify-content: center; align-items: center;' +
    ' min-height: 100vh; margin: 0; }' +
    '.card { background: white; border-radius: 8px; padding: 40px;' +
    ' box-shadow: 0 4px 20px rgba(0,0,0,0.15); text-align: center; width: 360px; }' +
    'h1 { color: #1a73e8; margin-bottom: 8px; }' +
    'p { color: #555; margin-bottom: 24px; }' +
    '.amount { font-size: 2rem; font-weight: bold; color: #333; margin: 16px 0; }' +
    'button { background: #1a73e8; color: white; border: none;' +
    ' padding: 14px 32px; font-size: 1rem; border-radius: 6px;' +
    ' cursor: pointer; width: 100%; }' +
    '.badge { background: #e8f5e9; color: #2e7d32; font-size: 0.8rem;' +
    ' padding: 4px 12px; border-radius: 12px; display: inline-block;' +
    ' margin-bottom: 16px; font-weight: bold; }' +
    '</style></head><body>' +
    '<div class="card">' +
    '<div class="badge">Securisee - Anti-Clickjacking</div>' +
    '<h1>Confirmer le virement</h1>' +
    '<p>Vous etes sur le point de transferer :</p>' +
    '<div class="amount">500 EUR</div>' +
    '<p>Vers le compte : <strong>FR76 1234 5678 9012</strong></p>' +
    '<form action="/confirmer" method="POST">' +
    '<button type="submit">Confirmer le virement</button>' +
    '</form>' +
    '</div></body></html>';

  res.send(html);
});

app.post('/confirmer', (req, res) => {
  res.send('<h2>Virement confirme ! (simulation)</h2>');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[SECURE] Serveur demarre sur http://0.0.0.0:' + PORT);
  console.log('[SECURE] Headers anti-Clickjacking actifs :');
  console.log('[SECURE]   X-Frame-Options: SAMEORIGIN');
  console.log("[SECURE]   Content-Security-Policy: frame-ancestors 'none'");
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

Si attaque.html tente de charger http://localhost:3001 dans une iframe,
le navigateur affiche :
"Refused to display '...' in a frame because it set
 'X-Frame-Options' to 'sameorigin'."
=================================================================
*/
