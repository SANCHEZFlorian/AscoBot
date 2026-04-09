import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'roleDelete',
    once: false,
    async execute(role) {
        const logChannelId = getLogChannelId(role.guild.id, 'role');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
            const deleteLog = fetchedLogs.entries.first();
            if (deleteLog && deleteLog.target.id === role.id && (Date.now() - deleteLog.createdTimestamp < 5000)) {
                executor = deleteLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await role.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Rôle Supprimé')
                .setColor('#E74C3C')
                .setDescription(`Le rôle **${role.name}** a été supprimé${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
