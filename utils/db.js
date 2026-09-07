import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: isProd ? process.env.PROD_DB_HOST : process.env.DEV_DB_HOST || '127.0.0.1',
  user: isProd ? process.env.PROD_DB_USER : process.env.DEV_DB_USER || 'root',
  password: isProd ? process.env.PROD_DB_PASSWORD : process.env.DEV_DB_PASSWORD || '',
  database: isProd ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME || 'ascobot',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
try {
    const connection = await pool.getConnection();
    console.log('[INFO] Connexion à la base de données MySQL réussie !');
    connection.release();
} catch (error) {
    console.error('[ERREUR] Impossible de se connecter à la base de données MySQL :', error.message);
}

// Fonction d'initialisation des tables du module A (s'assure que tout est prêt)
export async function initDatabaseModuleA() {
    try {
        // Table des warns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                moderator_id VARCHAR(20) NOT NULL,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table de configuration pour le serveur (Anti-spam, paliers warns)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS server_config (
                guild_id VARCHAR(20) PRIMARY KEY,
                spam_threshold INT DEFAULT 5,
                spam_timer_ms INT DEFAULT 3000,
                warn_kick_limit INT DEFAULT 3,
                warn_ban_limit INT DEFAULT 5,
                captcha_role_id VARCHAR(20) DEFAULT NULL
            )
        `);

        // Migration pour ancienne BDD
        try {
            await pool.query(`ALTER TABLE server_config ADD COLUMN captcha_role_id VARCHAR(20) DEFAULT NULL`);
        } catch(e) {}

        // Table des mots interdits
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banned_words (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                word VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci
            )
        `);

        console.log('[INFO] Tables du Module A initialisées/vérifiées.');

        // Module B : Auto-Réactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS auto_reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                trigger_word VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
                emojis TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
                position INT DEFAULT 0
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        // Migrations
        try { await pool.query(`ALTER TABLE auto_reactions MODIFY emojis TEXT NOT NULL COLLATE utf8mb4_unicode_ci`); } catch(e) {}
        try { await pool.query(`ALTER TABLE auto_reactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); } catch(e) {}
        try { 
            await pool.query(`ALTER TABLE auto_reactions ADD COLUMN position INT DEFAULT 0`);
            // Initialiser les positions existantes avec l'ID pour permettre le swap immédiat
            await pool.query(`UPDATE auto_reactions SET position = id WHERE position = 0`);
        } catch(e) {}

        // Module B : Vocaux dynamiques (Configuration maître)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS voice_masters (
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                PRIMARY KEY (guild_id, channel_id)
            )
        `);

        // Module Engagement : Auto-Rôles par Réactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reaction_panels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                message_id VARCHAR(20) NOT NULL UNIQUE,
                title VARCHAR(100) DEFAULT '🎭 Choisissez vos Rôles',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reaction_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                message_id VARCHAR(20) NOT NULL,
                role_id VARCHAR(20) NOT NULL,
                emoji VARCHAR(100) NOT NULL,
                description VARCHAR(255) DEFAULT '',
                role_name VARCHAR(100) DEFAULT '',
                UNIQUE KEY unique_panel_emoji (message_id, emoji)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        // Nettoyer toute entrée corrompue antérieure
        await pool.query("DELETE FROM reaction_roles WHERE channel_id = 'pick'").catch(() => {});

        console.log('[INFO] Tables du Module B & Engagement initialisées/vérifiées.');
    } catch (error) {
        console.error('[ERREUR] Lors de l\'initialisation des tables :', error);
    }
}

export default pool;
