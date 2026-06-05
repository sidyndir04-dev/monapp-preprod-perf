const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Security headers - fix for OWASP vulnerabilities
  
  // Anti-clickjacking (fixes [10020])
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options (fixes [10021])
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // HSTS (fixes [10035])
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy (fixes [10038] and [10055])
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  
  // XSS Protection (legacy)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions Policy (fixes [10063])
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  
  // Cache control (fixes [10015] and [10049])
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Cross-Origin policies (fixes [90004])
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><head><title>Secure App</title></head><body><h1>Application sécurisée - Correction OWASP</h1><p>Tous les en-têtes de sécurité sont configurés.</p></body></html>');
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
