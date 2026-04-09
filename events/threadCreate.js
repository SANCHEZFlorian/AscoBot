import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'threadCreate',
    once: false,
    async execute(thread) {
        if (!thread.guildId) return;
        const logChannelId = getLogChannelId(thread.guildId, 'thread');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await thread.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadCreate });
            const createLog = fetchedLogs.entries.first();
            if (createLog && createLog.target.id === thread.id && (Date.now() - createLog.createdTimestamp < 5000)) {
                executor = createLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await thread.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🧵 Thread/Post Créé')
                .setColor('#2ECC71')
                .setDescription(`Un fil de discussion <#${thread.id}> a été créé dans <#${thread.parentId}>${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
