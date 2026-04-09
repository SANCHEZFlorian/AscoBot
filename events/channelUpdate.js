import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'channelUpdate',
    once: false,
    async execute(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const logChannelId = getLogChannelId(newChannel.guild.id, 'salon');
        if (!logChannelId) return;

        // On ne log que si le nom ou la catégorie parente changent pour éviter le spam (ex: position update)
        if (oldChannel.name === newChannel.name && oldChannel.parentId === newChannel.parentId) return;

        let executor = null;
        try {
            const fetchedLogs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
            const updateLog = fetchedLogs.entries.first();
            if (updateLog && updateLog.target.id === newChannel.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                executor = updateLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await newChannel.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const typeName = newChannel.type === 4 ? 'Catégorie' : 'Salon'; // 4 is ChannelType.GuildCategory
            const embed = new EmbedBuilder()
                .setTitle(`✏️ ${typeName} ${newChannel.type === 4 ? 'Modifiée' : 'Modifié'}`)
                .setColor('#F1C40F')
                .setDescription(`${newChannel.type === 4 ? 'La catégorie' : 'Le salon'} <#${newChannel.id}> a été ${newChannel.type === 4 ? 'modifiée' : 'modifié'}${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setTimestamp();

            if (oldChannel.name !== newChannel.name) {
                embed.addFields(
                    { name: 'Ancien nom', value: oldChannel.name, inline: true },
                    { name: 'Nouveau nom', value: newChannel.name, inline: true }
                );
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
