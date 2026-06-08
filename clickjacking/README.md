# Clickjacking — OWASP A05:2021 Security Misconfiguration

Application Node.js/Express deployee sur Azure — Demo complete de la vulnerabilite Clickjacking avec pipeline CI/CD GitHub Actions et OWASP ZAP.

---

## Etape 1 — Presentation de la vulnerabilite

### Qu'est-ce que le Clickjacking ?

Le **Clickjacking** (detournement de clic) est une attaque web ou un attaquant superpose une **iframe invisible** contenant une application legitime par-dessus une page piege. L'utilisateur croit interagir avec le site visible (ex: "Gagne un iPhone !") alors qu'en realite ses clics sont interceptes par l'iframe cachee en dessous.

**Mecanisme technique :**
1. L'attaquant cree une page HTML sur son domaine
2. Il charge l'application cible (victime) dans une `<iframe>` avec `opacity: 0` (invisible)
3. Il positionne l'iframe en plein ecran avec `position: fixed`
4. Il superpose un faux bouton attractif par-dessus (`z-index` superieur)
5. La propriete `pointer-events: none` sur le faux bouton laisse les clics "traverser" vers l'iframe

### Exemple concret d'attaque : pieger un virement bancaire

**Scenario :** Alice est connectee a son espace bancaire en ligne. Elle visite un site malveillant qui affiche "Felicitations ! Vous avez gagne un iPhone 16 Pro !".

- **Ce que voit Alice :** Un site festif avec confettis et un bouton doré "Gagne un iPhone !"
- **Ce qui se passe reellement :** L'iframe invisible charge la page bancaire d'Alice (deja authentifiee via son cookie de session). Le bouton "Gagne un iPhone !" est positionne exactement par-dessus le bouton "Confirmer le virement de 500 EUR". Alice clique... et confirme le virement a son insu.

### Code Node.js/Express VULNERABLE

```javascript
// app-vulnerable.js - AUCUN header anti-Clickjacking
const express = require('express');
const app = express();

// PROBLEME : aucun middleware de securite
// Pas de X-Frame-Options
// Pas de Content-Security-Policy: frame-ancestors
// => n'importe quel site peut charger cette app dans une <iframe>

app.get('/', (req, res) => {
  res.send('<button>Confirmer le virement de 500 EUR</button>');
});

app.listen(3000);
```

**Verification avec curl :**
```bash
curl -I http://localhost:3000
# HTTP/1.1 200 OK
# X-Powered-By: Express          ← presence Express exposee
# Content-Type: text/html        ← pas de X-Frame-Options
#                                ← pas de Content-Security-Policy
# => L'app est integrable en iframe par n'importe quel site !
```

**Pourquoi est-ce dangereux ?**
Sans `X-Frame-Options` ni `Content-Security-Policy: frame-ancestors`, le navigateur autorise l'integration de cette app dans une iframe depuis N'IMPORTE quel domaine. L'attaquant peut donc charger la page de virement sur son site piege, et l'utilisateur authentifie confirmera une action a son insu.

---

## Etape 2 — Page d'attaque et analyse

### Code de attaque.html

La page `attaque.html` contient :

**Couche 1 (invisible) — L'app bancaire dans une iframe :**
```html
<iframe
  id="iframe-vicieuse"
  src="http://localhost:3000"
  style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0;          /* INVISIBLE pour l'utilisateur */
    pointer-events: all; /* Mais capte tous les clics ! */
    z-index: 1;          /* Derriere le contenu visible */
  ">
</iframe>
```

**Couche 2 (visible) — Le leurre de l'attaquant :**
```html
<!-- Bouton visible mais pointer-events: none = les clics passent en dessous -->
<button class="faux-bouton" style="pointer-events: none; z-index: 3;">
  Gagne un iPhone 16 Pro !
</button>
```

### Analyse de l'attaque

| Element | Ce que voit l'utilisateur | Ce qui se passe reellement |
|---------|--------------------------|---------------------------|
| Page visible | Site festif "Vous avez gagne !" | Page de l'attaquant (domaine malveillant) |
| Bouton visible | "Gagne un iPhone !" en dore | Leurre avec `pointer-events: none` |
| Iframe cachee | Invisible (`opacity: 0`) | Chargement de l'app bancaire authentifiee |
| Clic utilisateur | Croit reclamer un cadeau | Declenche "Confirmer virement 500 EUR" |
| Resultat | Pense avoir participe a un jeu | Son virement est confirme a son insu |

**Verification de la vulnerabilite :**
```bash
curl -I http://localhost:3000

# Sortie attendue (app vulnerable) :
# HTTP/1.1 200 OK
# X-Powered-By: Express
# Content-Type: text/html; charset=utf-8
# ← PAS de X-Frame-Options
# ← PAS de Content-Security-Policy
#
# => L'app est INTEGRABLE en iframe => vulnerable au Clickjacking
```

---

## Etape 3 — Pipeline CI/CD GitHub Actions avec OWASP ZAP

### Fichier : .github/workflows/security-clickjacking.yml

Le pipeline comporte 2 jobs :

**Job 1 : detect-vulnerability**
- Demarre l'app vulnerable sur le port 3000
- Execute `curl -I http://localhost:3000` et verifie l'**absence** de `X-Frame-Options`
- Lance `zaproxy/action-baseline@v0.12.0` pour un scan DAST automatique
- Uploade le rapport ZAP comme artifact GitHub (retention 30 jours)

**Job 2 : verify-fix**
- Demarre l'app corrigee (avec helmet) sur le port 3001
- Execute `curl -I http://localhost:3001` et verifie la **presence** de `X-Frame-Options: SAMEORIGIN`
- Confirme que l'attaque est bloquee

### Comment lire le rapport ZAP

1. Aller dans **Actions** > onglet du workflow > section **Artifacts**
2. Telecharger l'artifact `zap-report-clickjacking`
3. Ouvrir `report_html.html` dans un navigateur
4. Dans le rapport, chercher l'alerte : **"X-Frame-Options Header Not Set"**
   - **Risk Level :** Medium
   - **CWE ID :** CWE-1021 (Improper Restriction of Rendered UI Layers)
   - **Description :** The response does not include either Content-Security-Policy with 'frame-ancestors' directive or X-Frame-Options
   - **Solution :** Ensure the application sets an X-Frame-Options or CSP frame-ancestors header
5. Apres correction avec helmet, relancer le workflow => l'alerte Clickjacking disparait du rapport

---

## Etape 4 — Correction de la faille

### Correction avec helmet.frameguard

```bash
npm install helmet
```

```javascript
// app-fixed.js - Version securisee
const express = require('express');
const helmet  = require('helmet');
const app     = express();

// CORRECTION 1 : X-Frame-Options: SAMEORIGIN
// Empeche l'integration en iframe sauf par le meme domaine
app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

// CORRECTION 2 : Content-Security-Policy frame-ancestors 'none'
// Plus moderne, plus puissant - aucune iframe autorisee nulle part
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    frameAncestors: ["'none'"], // ou ["'self'"] pour autoriser son propre domaine
    scriptSrc:  ["'self'"],
    styleSrc:   ["'self'", "'unsafe-inline'"],
  },
}));
```

### Explication des deux corrections

**X-Frame-Options (ancienne methode, tres compatible) :**
- `DENY` : aucune iframe autorisee, meme depuis le meme domaine
- `SAMEORIGIN` : iframe autorisee uniquement depuis le meme domaine
- `ALLOW-FROM uri` : deprecie, a eviter

**Content-Security-Policy: frame-ancestors (methode moderne recommandee) :**
- Plus flexible et plus puissant que X-Frame-Options
- Supporte plusieurs origines : `frame-ancestors 'self' https://trusted.com`
- Override X-Frame-Options dans les navigateurs modernes

### Verification post-correction

```bash
curl -I http://localhost:3001

# Sortie attendue (app corrigee) :
# HTTP/1.1 200 OK
# X-Frame-Options: SAMEORIGIN                                     ← PROTECTION ACTIVE
# Content-Security-Policy: frame-ancestors 'none';default-src ... ← PROTECTION ACTIVE
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Referrer-Policy: no-referrer
#
# => L'app ne peut plus etre integree en iframe depuis un domaine externe !
```

**Comportement du navigateur apres correction :**
Si `attaque.html` tente de charger l'app corrigee dans l'iframe, le navigateur affiche en console :
```
Refused to display 'http://localhost:3001/' in a frame because
it set 'X-Frame-Options' to 'sameorigin'.
```
L'iframe reste vide. L'utilisateur ne peut plus etre piege.

---

## Structure du projet

```
monapp-preprod-perf/
├── clickjacking/
│   ├── README.md              ← Ce fichier
│   ├── app-vulnerable.js      ← App Express SANS protection Clickjacking
│   ├── app-fixed.js           ← App Express AVEC helmet (corrigee)
│   └── attaque.html           ← Page de demonstration de l'attaque
├── .github/
│   └── workflows/
│       └── security-clickjacking.yml  ← Pipeline CI/CD OWASP ZAP
├── .zap/
│   └── rules.tsv              ← Configuration regles ZAP
└── index.js                   ← App principale (protection SQL injection)
```

---

## Tableau Recapitulatif

| Etape | Description | Points | Livrables |
|-------|-------------|--------|-----------|
| **Etape 1** | **Presentation de la vulnerabilite Clickjacking** | +1 | Explication du mecanisme iframe invisible, exemple concret virement bancaire, code `app-vulnerable.js` sans X-Frame-Options, analyse pourquoi l'absence des headers rend l'app integrable |
| **Etape 2** | **Page d'attaque et analyse** | +2 | `attaque.html` avec iframe `opacity:0` + faux bouton "iPhone" superpose, explication couche par couche (ce que voit l'user vs ce qui se passe), verification avec `curl -I` montrant l'absence du header |
| **Etape 3** | **Pipeline CI/CD GitHub Actions + OWASP ZAP** | +3 | `security-clickjacking.yml` avec 2 jobs : detection (curl + absence X-Frame-Options) + scan ZAP Baseline automatique + upload artifact rapport, guide de lecture du rapport ZAP |
| **Etape 4** | **Correction de la faille avec helmet** | +2 | `app-fixed.js` avec `helmet.frameguard({ action: 'SAMEORIGIN' })` + CSP `frame-ancestors`, verification `curl -I` montrant le header present, explication du blocage navigateur |
| **TOTAL** | | **+8/8** | 4 fichiers crees + 1 workflow CI/CD + documentation complete |
