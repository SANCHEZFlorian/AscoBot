import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildMemberUpdate',
    once: false,
    async execute(oldMember, newMember) {
        const logChannelId = getLogChannelId(newMember.guild.id, 'membre');
        if (!logChannelId) return;

        try {
            const channel = await newMember.client.channels.fetch(logChannelId);
            if (!channel) return;

            // Changement de pseudo
            if (oldMember.nickname !== newMember.nickname) {
                let executor = null;
                try {
                    const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
                    const updateLog = fetchedLogs.entries.first();
                    if (updateLog && updateLog.target.id === newMember.user.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                        executor = updateLog.executor;
                    }
                } catch (e) {}

                const embed = new EmbedBuilder()
                    .setTitle('🪪 Pseudo Modifié')
                    .setColor('#3498DB') // Bleu
                    .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`Le pseudo de <@${newMember.user.id}> a été modifié à <t:${Math.floor(Date.now() / 1000)}:T>.${executor && executor.id !== newMember.user.id ? ` (Par <@${executor.id}>)` : ''}`)
                    .addFields(
                        { name: 'Ancien', value: oldMember.nickname || '*Aucun*', inline: true },
                        { name: 'Nouveau', value: newMember.nickname || '*Aucun*', inline: true }
                    )
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }

            // Timeout
            if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
                let executor = null;
                try {
                    const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
                    const updateLog = fetchedLogs.entries.first();
                    if (updateLog && updateLog.target.id === newMember.user.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                        executor = updateLog.executor;
                    }
                } catch (e) {}
                
                const embed = new EmbedBuilder()
                    .setTitle('⏱️ Membre mis sous silence (Timeout)')
                    .setColor('#E67E22') // Orange
                    .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${newMember.user.id}> a été mis sur écoute (timeout)${executor ? ` par <@${executor.id}>` : ''} à <t:${Math.floor(Date.now() / 1000)}:T>.`)
                    .addFields({ name: 'Jusqu\'au', value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>` })
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }

            if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
                const embed = new EmbedBuilder()
                    .setTitle('⏱️ Membre n\'est plus sous silence')
                    .setColor('#2ECC71')
                    .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${newMember.user.id}> n'est plus timeout à <t:${Math.floor(Date.now() / 1000)}:T>.`)
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }

            // Boost
            if (!oldMember.premiumSince && newMember.premiumSince) {
                // ... Code pour l'ajout de boost
                const boostChannel = getLogChannelId(newMember.guild.id, 'membre');
                if (boostChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚀 Nouveau Boost')
                        .setColor('#F47FFF')
                        .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(`<@${newMember.user.id}> a boosté le serveur à <t:${Math.floor(Date.now() / 1000)}:T> !`)
                        .setTimestamp();
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {}
    },
};
