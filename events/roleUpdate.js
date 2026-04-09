import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'roleUpdate',
    once: false,
    async execute(oldRole, newRole) {
        const logChannelId = getLogChannelId(newRole.guild.id, 'role');
        if (!logChannelId) return;

        // Éviter le spam si c'est juste la position
        if (oldRole.name === newRole.name && oldRole.color === newRole.color && oldRole.permissions.bitfield === newRole.permissions.bitfield) return;

        let executor = null;
        try {
            const fetchedLogs = await newRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate });
            const updateLog = fetchedLogs.entries.first();
            if (updateLog && updateLog.target.id === newRole.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                executor = updateLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await newRole.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('✏️ Rôle Modifié')
                .setColor(newRole.color || '#F1C40F')
                .setDescription(`Le rôle <@&${newRole.id}> a été modifié${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
