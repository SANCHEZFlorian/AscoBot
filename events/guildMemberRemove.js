import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member) {
        const logChannelId = getLogChannelId(member.guild.id, 'arrivees-departs');
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

            await channel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
