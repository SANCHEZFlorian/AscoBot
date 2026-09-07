import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import pool from './db.js';
import { getLogChannelId } from './logManager.js';

const FOOTER_TEXT = 'AscoBot • Configuration';

export async function getDashboardHome(guild) {
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Dashboard AscoBot')
        .setDescription('Bienvenue sur votre panneau de contrôle. Naviguez entre les sections ci-dessous pour configurer votre serveur.')
        .setColor('#2B2D31')
        .setThumbnail(guild.client.user.displayAvatarURL({ size: 128 }))
        .addFields(
            { name: '🛡️ Modération', value: 'Anti-Spam, Sanctions auto, Mots bannis.', inline: true },
            { name: '✨ Auto-Réactions', value: 'Émojis automatiques sur mots-clés.', inline: true },
            { name: '📋 Logs & Bienvenue', value: 'Salons de logs et cartes d\'accueil.', inline: true },
            { name: '🚀 Engagement', value: 'Auto-Rôles, Tickets, Vocaux dynamiques.', inline: true }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nav_config_mod').setLabel('Modération').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('nav_config_react').setLabel('Auto-Réactions').setStyle(ButtonStyle.Primary).setEmoji('✨'),
        new ButtonBuilder().setCustomId('nav_config_logs').setLabel('Logs & Bienvenue').setStyle(ButtonStyle.Primary).setEmoji('📋'),
        new ButtonBuilder().setCustomId('nav_config_engage').setLabel('Engagement').setStyle(ButtonStyle.Primary).setEmoji('🚀'),
        new ButtonBuilder().setCustomId('nav_config_close').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('❌')
    );
    return { embeds: [embed], components: [row] };
}

export async function getDashboardMod(guild) {
    let spamCount = 'Désactivé', spamTimer = 'Désactivé', banLimit = 'Désactivé', kickLimit = 'Désactivé';
    let wordsCount = 0;
    let wordsList = [];
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT * FROM server_config WHERE guild_id = ?', [guild.id]);
        if (rows.length > 0) {
            if (rows[0].spam_threshold) spamCount = rows[0].spam_threshold;
            if (rows[0].spam_timer_ms) spamTimer = (rows[0].spam_timer_ms / 1000) + 's';
            if (rows[0].warn_ban_limit) banLimit = rows[0].warn_ban_limit + ' warns';
            if (rows[0].warn_kick_limit) kickLimit = rows[0].warn_kick_limit + ' warns';
        }
        const [wRows] = await conn.query('SELECT word FROM banned_words WHERE guild_id = ? LIMIT 15', [guild.id]);
        wordsList = wRows.map(r => r.word);
        const [cRows] = await conn.query('SELECT COUNT(*) as c FROM banned_words WHERE guild_id = ?', [guild.id]);
        wordsCount = cRows[0].c;
        conn.release();
    } catch(e) {}

    let wordsDisplay = '*(Aucun mot configuré)*';
    if (wordsList.length > 0) {
        wordsDisplay = wordsList.map(w => `\`${w}\``).join(', ');
        if (wordsCount > wordsList.length) {
            wordsDisplay += ` *…et ${wordsCount - wordsList.length} autre(s)*`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Configuration : Modération')
        .setColor('#E74C3C')
        .addFields(
            { name: '⚡ Anti-Spam', value: `Limite : **${spamCount} messages** en **${spamTimer}**`, inline: true },
            { name: '⚠️ Sanctions Automatiques', value: `Kick : **${kickLimit}**\nBan : **${banLimit}**`, inline: true },
            { name: `🚫 Mots Bannis (${wordsCount})`, value: wordsDisplay, inline: false }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_mod_spam').setLabel('Régler l\'Anti-Spam').setStyle(ButtonStyle.Primary).setEmoji('⚡'),
        new ButtonBuilder().setCustomId('btn_mod_warns').setLabel('Régler Sanctions Auto').setStyle(ButtonStyle.Primary).setEmoji('⚠️')
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
    let reactionsList = "*Aucune réaction configurée pour le moment.*";
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
        .setDescription(`Le bot réagira automatiquement aux messages contenant les mots-clés ci-dessous.\n\n📌 **Priorité :** Seule la **première** réaction trouvée (dans l'ordre de la liste) sera appliquée par message.\n\n${reactionsList}`)
        .setFooter({ text: FOOTER_TEXT, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_react_add').setLabel('Ajouter / Modifier').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('btn_react_reorder').setLabel('Changer l\'ordre').setStyle(ButtonStyle.Primary).setEmoji('🔃'),
        new ButtonBuilder().setCustomId('btn_react_del').setLabel('Supprimer').setStyle(ButtonStyle.Danger).setEmoji('➖'),
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );
    return { embeds: [embed], components: [row] };
}

export async function getDashboardLogs(guild) {
    const welcomeCh = getLogChannelId(guild.id, 'bienvenue');
    const leaveCh = getLogChannelId(guild.id, 'departs');
    const arrDepCh = getLogChannelId(guild.id, 'arrivees-departs');
    const modCh = getLogChannelId(guild.id, 'moderation');
    const vocCh = getLogChannelId(guild.id, 'vocal');
    const msgCh = getLogChannelId(guild.id, 'messages');
    const srvCh = getLogChannelId(guild.id, 'serveur');

    const fmt = (id) => id ? `<#${id}>` : '❌ *Non configuré*';
    const welcomeDisplay = welcomeCh ? fmt(welcomeCh) : (arrDepCh ? `${fmt(arrDepCh)} *(groupé)*` : '❌ *Non configuré*');
    const leaveDisplay = leaveCh ? fmt(leaveCh) : (arrDepCh ? `${fmt(arrDepCh)} *(groupé)*` : '❌ *Non configuré*');

    const embed = new EmbedBuilder()
        .setTitle('📋 Configuration : Logs & Bienvenue')
        .setColor('#3498DB')
        .setDescription('Gérez les salons de journalisation et personnalisez l\'accueil de vos membres.\nSélectionnez une catégorie ci-dessous ou utilisez l\'assistant interactif.')
        .addFields(
            { name: '👋 Bienvenue', value: welcomeDisplay, inline: true },
            { name: '🔴 Départs', value: leaveDisplay, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: '🎫 Modération', value: fmt(modCh), inline: true },
            { name: '📝 Messages', value: fmt(msgCh), inline: true },
            { name: '🎙️ Vocaux', value: fmt(vocCh), inline: true }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp();

    const rowSelect = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('sel_logs_channel')
            .setPlaceholder('Associer un salon à une catégorie de log…')
            .addOptions([
                { label: '👋 Bienvenue & Arrivées', value: 'bienvenue', description: 'Salon public avec image de bienvenue' },
                { label: '🔴 Départs & Kicks', value: 'departs', description: 'Salon de log des départs' },
                { label: '👋🔴 Arrivées & Départs (Groupés)', value: 'arrivees-departs', description: 'Un seul salon pour les 2' },
                { label: '🎫 Modération (Warns/Bans)', value: 'moderation' },
                { label: '🎙️ Salons Vocaux', value: 'vocal' },
                { label: '📝 Messages', value: 'messages' },
                { label: '⚙️ Événements Serveur', value: 'serveur' }
            ])
    );

    const rowBtns = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_logs_welcomeconfig').setLabel('Assistant Bienvenue & Départs').setStyle(ButtonStyle.Success).setEmoji('👋'),
        new ButtonBuilder().setCustomId('btn_logs_autodeploy').setLabel('Déploiement Auto').setStyle(ButtonStyle.Primary).setEmoji('✨'),
        new ButtonBuilder().setCustomId('btn_logs_captcharole').setLabel('Rôle Captcha').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );

    return { embeds: [embed], components: [rowSelect, rowBtns] };
}

export async function getDashboardEngage(guild) {
    // Compter les panneaux auto-rôle existants
    let panelCount = 0;
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT COUNT(DISTINCT message_id) as c FROM reaction_roles WHERE guild_id = ?', [guild.id]);
        panelCount = rows[0].c;
        conn.release();
    } catch(e) {}

    const embed = new EmbedBuilder()
        .setTitle('🚀 Configuration : Engagement & Utilitaires')
        .setColor('#9B59B6')
        .setDescription('Gérez ici les fonctionnalités interactives avec votre communauté.')
        .addFields(
            { name: '🎭 Auto-Rôles par Réaction', value: `Panneaux interactifs avec émojis et descriptions.\n**${panelCount}** panneau(x) configuré(s).`, inline: false },
            { name: '🎫 Tickets & 🎙️ Salons Vocaux', value: 'Centres d\'assistance et salons dynamiques "Join to Create".', inline: false }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp();

    const rowAutoRole = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_eng_autorole').setLabel('Créer Panneau').setStyle(ButtonStyle.Success).setEmoji('🔖'),
        new ButtonBuilder().setCustomId('btn_eng_autoroleadd').setLabel('Ajouter Rôle').setStyle(ButtonStyle.Primary).setEmoji('➕'),
        new ButtonBuilder().setCustomId('btn_eng_autoroledel').setLabel('Retirer Rôle').setStyle(ButtonStyle.Danger).setEmoji('➖')
    );

    const rowOther = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_eng_ticket').setLabel('Déployer Tickets').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('btn_eng_voice').setLabel('Salons Dynamiques').setStyle(ButtonStyle.Primary).setEmoji('🎙️'),
        new ButtonBuilder().setCustomId('nav_config_home').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀')
    );

    return { embeds: [embed], components: [rowAutoRole, rowOther] };
}
