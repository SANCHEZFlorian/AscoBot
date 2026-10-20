# 🤖 AscoBot — Bot Discord Interactif

Bot Discord polyvalent propulsé par **Node.js** et **Discord.js**.

---

## 🛠️ Stack Technique

- **Runtime** : Node.js (version 20 LTS+)
- **Bibliothèque** : `discord.js` (v14)
- **Gestion des processus serveur** : PM2

---

## 💻 1. Lancement en Local

### Prérequis
- Node.js >= 20.x & npm
- Token de bot Discord et ID client (obtenus sur le portail développeur Discord)

### Installation
1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Configurer l'environnement :**
   Créer un fichier `.env` à la racine :
   ```env
   DISCORD_TOKEN=votre_token_secret_ici
   CLIENT_ID=votre_client_id
   GUILD_ID=id_serveur_de_test
   ```

3. **Lancer le bot :**
   ```bash
   # Mode développement avec auto-reload
   npm run dev

   # Ou lancement standard
   node index.js
   ```

---

## 🚀 2. Déploiement sur Serveur VPS (Debian 13)

Conforme au standard du serveur VPS Debian 13 avec **PM2** pour garantir la haute disponibilité.

### 2.1 Déploiement et lancement PM2
```bash
# Sur le VPS
cd /var/www
sudo git clone <URL_DEPOT_GIT> ascobot
cd ascobot

# Dépendances
sudo npm ci --production

# Fichier .env de production
sudo cp .env.example .env
sudo nano .env

# Lancer le bot avec PM2
pm2 start index.js --name "ascobot"

# Enregistrer la liste pour redémarrage automatique après reboot serveur
pm2 save
```

### 2.2 Commandes utiles de maintenance PM2
```bash
pm2 status ascobot
pm2 logs ascobot
pm2 restart ascobot
```
