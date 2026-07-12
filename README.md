# XOL Catalog

Plateforme d'écoute et catalogue commercial du label **XOL Music**, sur le modèle de DISCO.ac, pensée comme un outil interne de maison de disque.

Le principe : chaque asset (projet, chanson, demo, artiste) a une identité, des métadonnées propres, et un **lien de partage contrôlé**. Le WAV master ne sort jamais du système sans autorisation explicite.

---

## Ce que fait l'outil

**Back-office (admin, fond blanc, menu latéral à gauche)**

- Créer un profil artiste : nom d'artiste, photo, pays de résidence, bio.
- Créer des projets (single / EP / album) avec cover 1080×1080, genre, date de sortie, référence catalogue, UPC, notes.
- Uploader des chansons en WAV, assignées à un artiste et à un projet — conversion automatique en MP3 320 pour l'écoute.
- Un dossier de demos par artiste, en glisser-déposer, sans rattachement à un projet.
- Un lien de partage public pour **chaque** élément : projet, chanson, demo, artiste.

**Pages publiques**

- Écoute seule par défaut. Cover, tracklist, player avec waveform.
- Téléchargement **uniquement** si l'admin l'a activé sur le lien concerné.
- Chaque lien est révocable, peut expirer, peut être protégé par mot de passe.

---

## La règle d'or de sécurité

Le master WAV n'est jamais exposé au public. Les pages publiques lisent la version streaming (MP3 320). Le téléchargement du master n'est possible que si le lien porte `allowDownload = true`, et cette vérification est faite **côté serveur** dans la route de download (`src/app/api/s/[token]/download/[trackId]/route.ts`) — pas seulement en masquant un bouton. Si le lien n'autorise pas le téléchargement, l'API renvoie 403 même en cas d'accès direct à l'URL.

---

## Stack

- **Next.js 15** (App Router, Server Actions)
- **PostgreSQL** via **Prisma** — hébergé sur **Neon**
- **Cloudflare R2** pour le stockage audio et images (compatible S3, zéro frais de sortie)
- **ffmpeg** pour le transcodage WAV → MP3 320
- Auth admin par session cookie signée (JWT via `jose`)

---

## Installation en local

1. **Prérequis** : Node 18+, et `ffmpeg` installé sur la machine.
   ```bash
   # macOS
   brew install ffmpeg
   # Ubuntu / Debian
   sudo apt install ffmpeg
   ```

2. **Dépendances**
   ```bash
   npm install
   ```

3. **Variables d'environnement** : copie `.env.example` vers `.env` et remplis :
   - `DATABASE_URL` — la chaîne Neon (ou n'importe quel Postgres).
   - `R2_*` — identifiants Cloudflare R2 et nom du bucket.
   - `AUTH_SECRET` — une longue chaîne aléatoire (`openssl rand -base64 32`).
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — ton compte admin initial.
   - `NEXT_PUBLIC_APP_URL` — l'URL publique (les liens de partage l'utilisent).

4. **Base de données**
   ```bash
   npm run db:push     # crée les tables
   npm run db:seed     # crée le compte admin
   ```

5. **Lancer**
   ```bash
   npm run dev
   ```
   Ouvre http://localhost:3000 et connecte-toi.

---

## Déploiement (Vercel + Neon + R2)

1. **Neon** : crée un projet Postgres, récupère la chaîne de connexion → `DATABASE_URL`.
2. **Cloudflare R2** : crée un bucket `xol-catalog`, génère un token API S3, note l'endpoint → variables `R2_*`.
3. **Vercel** : importe le repo, ajoute toutes les variables d'environnement, déploie.
4. Après le premier déploiement, lance une fois le seed (via `vercel env pull` en local puis `npm run db:seed`, ou un script ponctuel).

> ⚠️ Vercel Hobby exclut en principe l'usage commercial. Pour un usage réel du label, passe sur Vercel Pro.

### Note sur le transcodage en serverless

Le binaire ffmpeg est fourni par le paquet `ffmpeg-static` et inclus automatiquement dans le déploiement (voir `next.config.mjs`), donc le transcodage fonctionne sur Vercel sans installation manuelle.

Seule limite à connaître : la durée d'exécution des fonctions. Sur Vercel Hobby elle est courte (~10s), sur Pro elle va jusqu'à 60s (configurable jusqu'à 300s). Un WAV de 3–4 min se convertit en quelques secondes, donc Pro suffit largement. Pour des fichiers très longs ou un très gros volume, la V1.5 prévue déporte le transcodage dans un worker asynchrone (voir roadmap).

---

## Structure du code

```
prisma/schema.prisma        Modèle de données (Artist, Project, Track, Demo, ShareLink, PlayEvent)
src/lib/
  prisma.ts                 Client Prisma
  storage.ts                Couche R2 (upload, get, delete, URL signées)
  audio.ts                  Transcodage MP3, durée, waveform
  auth.ts                   Sessions admin
  share.ts                  Résolution des liens + garde de téléchargement
  display.ts                Helpers d'affichage
src/server/                 Server Actions (artists, projects, tracks, links)
src/components/             Sidebar, AudioPlayer, DemoDropzone, ShareButton, etc.
src/app/
  login/                    Connexion admin
  (admin)/admin/            Back-office (dashboard, artistes, projets, demos, liens)
  s/[token]/                Pages publiques de partage
  api/s/[token]/            Streaming + download publics sécurisés
  api/admin-stream/         Prévisualisation audio interne
  api/img/                  Images internes (admin)
```

---

## Roadmap (au-delà de la V1)

**V1.5 — traction interne**
- Analytics par lien : qui a ouvert, nombre d'écoutes, taux de complétion (la base `PlayEvent` est déjà en place).
- Transcodage asynchrone (worker ffmpeg) pour les gros fichiers.
- Versions de tracks empilées (demo → mix v2 → master).
- Commentaires timecodés sur la waveform.

**V2 — outil institutionnel**
- Rôles multi-utilisateurs (owner, A&R, manager, artiste en lecture seule sur son propre catalogue).
- Watermarking audio par destinataire sur les liens sensibles.
- Playlists de pitch (tracks de plusieurs artistes en une page pour un superviseur synchro).
- Export métadonnées (CSV / DDEX) vers les distributeurs.

**V3 — extension stratégique**
- EPK intégré par artiste.
- Notifications (expiration de lien, nouvelle écoute).
- Tagging automatique BPM / tonalité.
- Mode multi-label.
```
