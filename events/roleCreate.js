import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'roleCreate',
    once: false,
    async execute(role) {
        const logChannelId = getLogChannelId(role.guild.id, 'role');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
            const createLog = fetchedLogs.entries.first();
            if (createLog && createLog.target.id === role.id && (Date.now() - createLog.createdTimestamp < 5000)) {
                executor = createLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await role.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🔰 Rôle Créé')
                .setColor(role.color || '#2ECC71')
                .setDescription(`Le rôle <@&${role.id}> (${role.name}) a été créé${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
