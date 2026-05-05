import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import pool from '../utils/db.js';

const prefix = process.env.PREFIX || '!';

// Cache simple pour ne pas harceler la BDD
let lastCacheUpdate = 0;
const guildConfigs = new Map();
const guildWords = new Map();
const guildReactions = new Map();
const userSpamCache = new Map();

export const event = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // --- DEBUT AUTO-MODERATION ---
        const now = Date.now();
        if (now - lastCacheUpdate > 60000) { // Update config every 60s
            try {
                const connection = await pool.getConnection();
                const [configs] = await connection.query('SELECT * FROM server_config');
                configs.forEach(c => guildConfigs.set(c.guild_id, c));
                
                const [words] = await connection.query('SELECT guild_id, word FROM banned_words');
                guildWords.clear();
                words.forEach(w => {
                    if (!guildWords.has(w.guild_id)) guildWords.set(w.guild_id, []);
                    guildWords.get(w.guild_id).push(w.word.toLowerCase());
                });

                const [reactions] = await connection.query('SELECT guild_id, trigger_word, emojis FROM auto_reactions ORDER BY position ASC, id ASC');
                guildReactions.clear();
                reactions.forEach(r => {
                    if (!guildReactions.has(r.guild_id)) guildReactions.set(r.guild_id, []);
                    guildReactions.get(r.guild_id).push({ word: r.trigger_word.toLowerCase(), emojis: r.emojis.split(' ') });
                });
                
                connection.release();
                lastCacheUpdate = now;
            } catch(e) { console.error("Automod DB Error", e); }
        }

        const svConfig = guildConfigs.get(message.guild.id) || { spam_threshold: 5, spam_timer_ms: 3000, warn_kick_limit: null, warn_ban_limit: null };
        const bannedWords = guildWords.get(message.guild.id) || [];

        // 1. Check Mots Interdits
        const lowerMsg = message.content.toLowerCase();
        for (const bw of bannedWords) {
            if (lowerMsg.includes(bw)) {
                await message.delete().catch(()=>{});
                // Ajouter le warn
                try {
                    const conn = await pool.getConnection();
                    await conn.query('INSERT INTO warns (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)', 
                        [message.author.id, message.guild.id, message.client.user.id, `Mot interdit détecté (${bw})`]
                    );
                    conn.release();
                    await message.channel.send({ content: `⚠️ <@${message.author.id}> a utilisé un mot interdit et a reçu un avertissement.`});
                } catch(e) {}
                return; // Stop message processing
            }
        }

        // 2. Check Anti-Spam
        if (svConfig.spam_threshold && svConfig.spam_timer_ms) {
            const authorId = message.author.id;
            if (!userSpamCache.has(authorId)) {
                userSpamCache.set(authorId, []);
            }
            const timestamps = userSpamCache.get(authorId);
            timestamps.push(now);

            // Filtrer vieux messages
            while (timestamps.length > 0 && timestamps[0] < now - svConfig.spam_timer_ms) {
                timestamps.shift();
            }

            if (timestamps.length >= svConfig.spam_threshold) {
                userSpamCache.delete(authorId); 
                try {
                    await message.delete().catch(()=>{});
                    const member = await message.guild.members.fetch(authorId);
                    await member.timeout(5 * 60 * 1000, 'Anti-Spam auto-modération'); // 5 minutes mute
                    
                    const conn = await pool.getConnection();
                    await conn.query('INSERT INTO warns (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)', 
                        [message.author.id, message.guild.id, message.client.user.id, "Spam abusif"]
                    );
                    conn.release();

                    await message.channel.send(`⚠️ <@${authorId}> a été réduit au silence pendant 5 minutes pour spam.`);
                } catch (e) {
                    // Ignore permissions errors
                }
                return; // Stop message processing
            }
        }
        // --- FIN AUTO-MODERATION ---

        // --- DEBUT AUTO-REACTIONS ---
        const activeReactions = guildReactions.get(message.guild.id) || [];
        for (const reactionItem of activeReactions) {
            // Regex for exact word match boundaries, or just includes based on string
            // Simplest checking is includes() but word boundary is better so 'bons' doesn't trigger 'bon'.
            const regex = new RegExp(`\\b${reactionItem.word}\\b`, 'i');
            if (regex.test(message.content)) {
                // Pick random emoji from the list
                if (reactionItem.emojis.length > 0) {
                    const randEmoji = reactionItem.emojis[Math.floor(Math.random() * reactionItem.emojis.length)];
                    await message.react(randEmoji).catch(()=>{});
                    break; // Un seul déclenchement par message (priorité la plus haute)
                }
            }
        }
        // --- FIN AUTO-REACTIONS ---

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = message.client.commands.get(commandName);

        // Special handling for Dice regex (e.g. !1d20)
        const regexDice = /^[0-9]{0,2}[dD][0-9]+([\s]?\+[\s]?[0-9]+)?$/;

        if (!command && regexDice.test(commandName)) {
            command = message.client.commands.get('roll');
            if (command) {
                // Inject the commandName (e.g. "1d20") back into args for the roll command
                args.unshift(commandName);
            }
        }

        if (!command) return;

        // --- Mock Interaction for Hybrid Support ---
        const interaction = {
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client: message.client,
            formattedArgs: args,

            // Methods to mimic Interaction
            reply: async (payload) => {
                const content = typeof payload === 'string' ? payload : payload.content;
                const embeds = typeof payload === 'object' ? payload.embeds : [];
                const files = typeof payload === 'object' ? payload.files : [];
                return message.reply({ content, embeds, files });
            },
            followUp: async (payload) => {
                const content = typeof payload === 'string' ? payload : payload.content;
                return message.channel.send({ content });
            },
            // Options getter mock
            options: {
                getString: (name) => {
                    // Specific logic for roll command to get the full expression
                    if (command.data.name === 'roll') {
                        return args.join(' ');
                    }
                    return args[0] || null;
                },
                getInteger: (name) => parseInt(args[0]) || null,
                getUser: (name) => message.mentions.users.first() || null,
                getMember: (name) => message.mentions.members.first() || null,
            }
        };

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await message.reply('There was an error while executing this command!');
        }
    },
};