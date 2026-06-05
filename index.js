const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Security headers - fix for OWASP vulnerabilities
    res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          res.setHeader('Content-Security-Policy', "default-src 'self'");
            res.setHeader('X-XSS-Protection', '1; mode=block');
              res.setHeader('Referrer-Policy', 'no-referrer');
                res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

                  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`<!DOCTYPE html>
                    <html lang="fr">
                    <head>
                      <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Environnement de preproduction</title>
                          </head>
                          <body>
                            <h1>Environnement de preproduction</h1>
                              <p>Deploye sur Azure App Service</p>
                              </body>
                              </html>`);
                              });

                              server.listen(PORT, () => {
                                console.log(`Server running on port ${PORT}`);
                                });
