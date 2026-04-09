import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildBanRemove',
    once: false,
    async execute(ban) {
        const logChannelId = getLogChannelId(ban.guild.id, 'moderation');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove,
            });
            const unbanLog = fetchedLogs.entries.first();
            if (unbanLog && unbanLog.target.id === ban.user.id && (Date.now() - unbanLog.createdTimestamp < 5000)) {
                executor = unbanLog.executor;
            }
        } catch (error) {
            console.error("Erreur Audit Logs (guildBanRemove):", error);
        }

        try {
            const channel = await ban.client.channels.fetch(logChannelId);
            if (!channel) return;

            const executorText = executor ? ` par <@${executor.id}>` : '';

            const embed = new EmbedBuilder()
                .setTitle('🕊️ Membre Débanni')
                .setColor('#2ECC71') // Vert
                .setAuthor({
                    name: `${ban.user.tag} (${ban.user.id})`,
                    iconURL: ban.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Le membre <@${ban.user.id}> a été débanni${executorText} à <t:${Math.floor(Date.now() / 1000)}:T>.`)
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
