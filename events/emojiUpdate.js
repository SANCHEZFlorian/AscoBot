import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'emojiUpdate',
    once: false,
    async execute(oldEmoji, newEmoji) {
        if (!newEmoji.guild) return;
        const logChannelId = getLogChannelId(newEmoji.guild.id, 'emojis');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await newEmoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiUpdate });
            const updateLog = fetchedLogs.entries.first();
            if (updateLog && updateLog.target.id === newEmoji.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                executor = updateLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await newEmoji.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('✏️ Émoji Modifié')
                .setColor('#F1C40F')
                .setDescription(`L'émoji ${newEmoji} a été modifié${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .addFields(
                    { name: 'Ancien nom', value: oldEmoji.name, inline: true },
                    { name: 'Nouveau nom', value: newEmoji.name, inline: true }
                )
                .setThumbnail(newEmoji.url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
