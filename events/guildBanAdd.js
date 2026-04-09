import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildBanAdd',
    once: false,
    async execute(ban) {
        const logChannelId = getLogChannelId(ban.guild.id, 'moderation');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd,
            });
            const banLog = fetchedLogs.entries.first();
            if (banLog && banLog.target.id === ban.user.id && (Date.now() - banLog.createdTimestamp < 5000)) {
                executor = banLog.executor;
            }
        } catch (error) {
            console.error("Erreur Audit Logs (guildBanAdd):", error);
        }

        try {
            const channel = await ban.client.channels.fetch(logChannelId);
            if (!channel) return;

            const executorText = executor ? ` par <@${executor.id}>` : '';

            const embed = new EmbedBuilder()
                .setTitle('🔨 Membre Banni')
                .setColor('#8B0000') // Rouge foncé
                .setAuthor({
                    name: `${ban.user.tag} (${ban.user.id})`,
                    iconURL: ban.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Le membre <@${ban.user.id}> a été banni${executorText} à <t:${Math.floor(Date.now() / 1000)}:T>.`)
                .addFields(
                    { name: 'Raison', value: ban.reason || '*Aucune raison spécifiée*' }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
