import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'stickerUpdate',
    once: false,
    async execute(oldSticker, newSticker) {
        if (!newSticker.guild) return;
        const logChannelId = getLogChannelId(newSticker.guild.id, 'emojis');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await newSticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerUpdate });
            const updateLog = fetchedLogs.entries.first();
            if (updateLog && updateLog.target.id === newSticker.id && (Date.now() - updateLog.createdTimestamp < 5000)) {
                executor = updateLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await newSticker.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('✏️ Sticker Modifié')
                .setColor('#F1C40F')
                .setDescription(`Le sticker **${newSticker.name}** a été modifié${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .addFields(
                    { name: 'Ancien nom', value: oldSticker.name, inline: true },
                    { name: 'Nouveau nom', value: newSticker.name, inline: true }
                )
                .setThumbnail(newSticker.url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
