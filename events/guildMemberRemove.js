import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member) {
        const logChannelId = getLogChannelId(member.guild.id, 'departs') || getLogChannelId(member.guild.id, 'arrivees-departs');
        if (!logChannelId) return;

        let executor = null;
        let isKick = false;
        try {
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick,
            });
            const kickLog = fetchedLogs.entries.first();
            if (kickLog && kickLog.target.id === member.user.id && (Date.now() - kickLog.createdTimestamp < 5000)) {
                executor = kickLog.executor;
                isKick = true;
            }
        } catch (error) {}

        try {
            const channel = await member.client.channels.fetch(logChannelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle(isKick ? '👢 Membre Expulsé (Kick)' : '🔴 Membre Parti')
                .setColor(isKick ? '#E67E22' : '#E74C3C')
                .setAuthor({
                    name: `${member.user.tag} (${member.user.id})`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                });

            if (isKick && executor) {
                embed.setDescription(`<@${member.user.id}> a été expulsé par <@${executor.id}> à <t:${Math.floor(Date.now() / 1000)}:T>.`);
            } else {
                embed.setDescription(`<@${member.user.id}> a quitté le serveur à <t:${Math.floor(Date.now() / 1000)}:T>.`);
            }
            embed.setTimestamp();

            const roles = member.roles.cache
                .filter(r => r.id !== member.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString());
                
            let rolesStr = roles.length > 0 ? roles.join(' ') : 'Aucun rôle';
            if (rolesStr.length > 1024) {
                rolesStr = rolesStr.substring(0, 1020) + '...';
            }

            const joinedAt = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Inconnu';

            embed.addFields(
                { name: 'Rejoint le', value: joinedAt, inline: true },
                { name: 'Rôles précédents', value: rolesStr, inline: false }
            );

            await channel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
