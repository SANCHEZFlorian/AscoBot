import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logConfigPath = path.join(__dirname, '../config/logs.json');

// Assure que le fichier existe et qu'il contient au moins un objet vide
if (!fs.existsSync(logConfigPath)) {
    fs.writeFileSync(logConfigPath, JSON.stringify({}), 'utf8');
}

export function getLogsConfig() {
    try {
        const data = fs.readFileSync(logConfigPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur de lecture de logs.json: ", err);
        return {};
    }
}

export function setLogsConfig(config) {
    try {
        fs.writeFileSync(logConfigPath, JSON.stringify(config, null, 4), 'utf8');
    } catch (err) {
        console.error("Erreur d'écriture dans logs.json: ", err);
    }
}

export function getLogChannelId(guildId, logType) {
    const config = getLogsConfig();
    if (config[guildId] && config[guildId][logType]) {
        return config[guildId][logType];
    }
    return null;
}

export function setLogChannelId(guildId, logType, channelId) {
    const config = getLogsConfig();
    if (!config[guildId]) {
        config[guildId] = {};
    }
    config[guildId][logType] = channelId;
    setLogsConfig(config);
}
