import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'threadDelete',
    once: false,
    async execute(thread) {
        if (!thread.guildId) return;
        const logChannelId = getLogChannelId(thread.guildId, 'thread');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await thread.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadDelete });
            const deleteLog = fetchedLogs.entries.first();
            if (deleteLog && deleteLog.target.id === thread.id && (Date.now() - deleteLog.createdTimestamp < 5000)) {
                executor = deleteLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await thread.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Thread/Post Supprimé')
                .setColor('#E74C3C')
                .setDescription(`Le fil **${thread.name}** a été supprimé${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
