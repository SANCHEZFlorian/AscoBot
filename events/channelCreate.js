import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'channelCreate',
    once: false,
    async execute(channel) {
        if (!channel.guild) return;
        const logChannelId = getLogChannelId(channel.guild.id, 'salon');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
            const createLog = fetchedLogs.entries.first();
            if (createLog && createLog.target.id === channel.id && (Date.now() - createLog.createdTimestamp < 5000)) {
                executor = createLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await channel.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const typeName = channel.type === 4 ? 'Catégorie' : 'Salon'; // 4 is ChannelType.GuildCategory
            const embed = new EmbedBuilder()
                .setTitle(`📁 ${typeName} ${channel.type === 4 ? 'Créée' : 'Créé'}`)
                .setColor('#2ECC71')
                .setDescription(`${channel.type === 4 ? 'La catégorie' : 'Le salon'} <#${channel.id}> (${channel.name}) a été ${channel.type === 4 ? 'créée' : 'créé'}${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)

            let permsText = "";
            if (channel.permissionOverwrites && channel.permissionOverwrites.cache.size > 0) {
                channel.permissionOverwrites.cache.forEach(overwrite => {
                    const target = overwrite.type === 0 ? `<@&${overwrite.id}>` : `<@${overwrite.id}>`; // 0=Role, 1=Member
                    const allowed = overwrite.allow.toArray();
                    const denied = overwrite.deny.toArray();
                    if (allowed.length > 0 || denied.length > 0) {
                        permsText += `\n**Cible :** ${target}\n`;
                        if (allowed.length > 0) permsText += `✅ \`${allowed.join('`, `')}\`\n`;
                        if (denied.length > 0) permsText += `❌ \`${denied.join('`, `')}\`\n`;
                    }
                });
            }

            if (permsText) {
                if (permsText.length > 1024) permsText = permsText.substring(0, 1020) + '...';
                embed.addFields({ name: '🔐 Permissions spécifiques configurées', value: permsText });
            } else {
                embed.addFields({ name: '🔐 Permissions', value: '*Aucune exception, identiques à la base/catégorie*' });
            }

            embed.setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
