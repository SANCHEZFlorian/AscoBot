import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'channelDelete',
    once: false,
    async execute(channel) {
        if (!channel.guild) return;
        const logChannelId = getLogChannelId(channel.guild.id, 'salon');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
            const deleteLog = fetchedLogs.entries.first();
            if (deleteLog && deleteLog.target.id === channel.id && (Date.now() - deleteLog.createdTimestamp < 5000)) {
                executor = deleteLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await channel.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const typeName = channel.type === 4 ? 'Catégorie' : 'Salon'; // 4 is ChannelType.GuildCategory
            const embed = new EmbedBuilder()
                .setTitle(`🗑️ ${typeName} ${channel.type === 4 ? 'Supprimée' : 'Supprimé'}`)
                .setColor('#E74C3C')
                .setDescription(`${channel.type === 4 ? 'La catégorie' : 'Le salon'} **${channel.name}** a été ${channel.type === 4 ? 'supprimée' : 'supprimé'}${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
