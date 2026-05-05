import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import pool from './db.js';

export async function getDashboardHome(guild) {
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Accueil Configuration AscoBot')
        .setDescription('Bienvenue sur votre Dashboard central. Utilisez les boutons ci-dessous pour naviguer dans les options de configuration de votre serveur.')
        .setColor('#2B2D31')
        .addFields(
            { name: '🛡️ Modération', value: 'Anti-Spam, Paliers de Sanctions, Mots Bannis.', inline: true },
            { name: '✨ Auto-Réactions', value: 'Émojis automatiques sur certains mots.', inline: true },
            { name: '📋 Logs & Welcome', value: 'Salons de pointage et cartes de bienvenue.', inline: true },
            { name: '🚀 Engagement', value: 'Tickets, Autoroles et Vocaux dynamiques.', inline: true }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nav_config_mod').setLabel('Modération').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('nav_config_react').setLabel('Auto-Réactions').setStyle(ButtonStyle.Primary).setEmoji('✨'),
        new ButtonBuilder().setCustomId('nav_config_logs').setLabel('Logs & Welcome').setStyle(ButtonStyle.Primary).setEmoji('📋'),
        new ButtonBuilder().setCustomId('nav_config_engage').setLabel('Engagement').setStyle(ButtonStyle.Primary).setEmoji('🚀'),
        new ButtonBuilder().setCustomId('nav_config_close').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('❌')
    );
    return { embeds: [embed], components: [row] };
}

export async function getDashboardMod(guild) {
    let spamCount = 'Désactivé', spamTimer = 'Désactivé', banLimit = 'Désactivé', kickLimit = 'Désactivé';
    let wordsCount = 0;
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT * FROM server_config WHERE guild_id = ?', [guild.id]);
        if (rows.length > 0) {
            if (rows[0].spam_threshold) spamCount = rows[0].spam_threshold;
            if (rows[0].spam_timer_ms) spamTimer = (rows[0].spam_timer_ms / 1000) + 's';
            if (rows[0].warn_ban_limit) banLimit = rows[0].warn_ban_limit + ' warns';
            if (rows[0].warn_kick_limit) kickLimit = rows[0].warn_kick_limit + ' warns';
        }
        const [wRows] = await conn.query('SELECT COUNT(*) as c FROM banned_words WHERE guild_id = ?', [guild.id]);
        wordsCount = wRows[0].c;
        conn.release();
    } catch(e) {}

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Configuration : Modération')
        .setColor('#E74C3C')
        .addFields(
            { name: 'Anti-Spam Actuel', value: `Limite: **${spamCount} messages** en **${spamTimer}**`, inline: true },
            { name: 'Auto-Sanctions (Warns)', value: `Kick auto: **${kickLimit}**\nBan auto: **${banLimit}**`, inline: true },
            { name: 'Mots Bannis', value: `**${wordsCount}** mots configurés`, inline: true }
        );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_mod_spam').setLabel('Régler l\'Anti-Spam').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_mod_warns').setLabel('Régler Sanctions Auto').setStyle(ButtonStyle.Secondary)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_mod_addword').setLabel('Ajouter Mot Banni').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('btn_mod_delword').setLabel('Retirer Mot Banni').setStyle(ButtonStyle.Danger).setEmoji('➖')
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );

    return { embeds: [embed], components: [row1, row2, row3] };
}

function formatEmojiDisplay(emojisStr) {
    if (!emojisStr) return "";
    return emojisStr.split(' ').map(part => {
        if (part.includes(':')) {
            return part.startsWith('a:') ? `<${part}>` : `<:${part}>`;
        }
        try {
            return decodeURIComponent(part);
        } catch (e) {
            return part;
        }
    }).join(' ');
}

export async function getDashboardReact(guild) {
    let reactionsList = "Aucune réaction actuellement.";
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT trigger_word, emojis FROM auto_reactions WHERE guild_id = ? ORDER BY position ASC, id ASC', [guild.id]);
        conn.release();
        if (rows.length > 0) {
            reactionsList = rows.map((r, index) => `**${index + 1}.** \`${r.trigger_word}\` ➔ ${formatEmojiDisplay(r.emojis)}`).join('\n').substring(0, 1000);
        }
    } catch(e) {}
    const embed = new EmbedBuilder()
        .setTitle('✨ Configuration : Auto-Réactions')
        .setColor('#F1C40F')
        .setDescription(`Le bot réagira automatiquement aux mots-clés ci-dessous.\n\n**Règle de priorité :** Seule la **première** réaction correspondante (dans l'ordre de la liste) sera déclenchée par message.\n\n${reactionsList}`);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_react_add').setLabel('Ajouter / Modifier').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('btn_react_reorder').setLabel('Changer l\'ordre').setStyle(ButtonStyle.Primary).setEmoji('🔃'),
        new ButtonBuilder().setCustomId('btn_react_del').setLabel('Supprimer').setStyle(ButtonStyle.Danger).setEmoji('➖'),
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );
    return { embeds: [embed], components: [row] };
}

export async function getDashboardLogs(guild) {
    const embed = new EmbedBuilder()
        .setTitle('📋 Configuration : Logs Système')
        .setColor('#3498DB')
        .setDescription('Choisissez un type de log ci-dessous pour lui assigner un salon existant, ou déployez tous les salons automatiquement.')
        .addFields(
            { name: 'Catégories disponibles', value: 'Modération, Vocal, Messages, Entrantes/Départs, Serveur.' }
        );

    const rowSelect = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('sel_logs_channel')
            .setPlaceholder('Associer une catégorie de log...')
            .addOptions([
                { label: '🎫 Modération', value: 'moderation' },
                { label: '🎙️ Salons Vocaux', value: 'vocal' },
                { label: '📝 Messages Emis/Modifiés', value: 'messages' },
                { label: '👋 Arrivées et Départs', value: 'arrivees-departs' },
                { label: '⚙️ Serveur Global', value: 'serveur' }
            ])
    );

    const rowBtns = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_logs_autodeploy').setLabel('Déploiement Magique Auto').setStyle(ButtonStyle.Primary).setEmoji('✨'),
        new ButtonBuilder().setCustomId('btn_logs_captcharole').setLabel('Rôle Captcha').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );

    return { embeds: [embed], components: [rowSelect, rowBtns] };
}

export async function getDashboardEngage(guild) {
    const embed = new EmbedBuilder()
        .setTitle('🚀 Configuration : Engagement & Utilitaires')
        .setColor('#9B59B6')
        .setDescription('Gérez ici les fonctionnalités interactives avec votre communauté.');

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_eng_autorole').setLabel('Panneau Auto-Rôle').setStyle(ButtonStyle.Success).setEmoji('🔖'),
        new ButtonBuilder().setCustomId('btn_eng_autoroleadd').setLabel('Ajt. Option Auto-Rôle').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_eng_ticket').setLabel('Déployer Tickets').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('btn_eng_voice').setLabel('Déployer Salons Dynamiques').setStyle(ButtonStyle.Primary).setEmoji('🎙️')
    );
    const rowHome = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );

    return { embeds: [embed], components: [row1, rowHome] };
}
