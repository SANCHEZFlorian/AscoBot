import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'emojiDelete',
    once: false,
    async execute(emoji) {
        if (!emoji.guild) return;
        const logChannelId = getLogChannelId(emoji.guild.id, 'emojis');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiDelete });
            const deleteLog = fetchedLogs.entries.first();
            if (deleteLog && deleteLog.target.id === emoji.id && (Date.now() - deleteLog.createdTimestamp < 5000)) {
                executor = deleteLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await emoji.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Émoji Supprimé')
                .setColor('#E74C3C')
                .setDescription(`L'émoji **${emoji.name}** a été supprimé${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setThumbnail(emoji.url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
