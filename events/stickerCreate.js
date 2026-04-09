import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'stickerCreate',
    once: false,
    async execute(sticker) {
        if (!sticker.guild) return;
        const logChannelId = getLogChannelId(sticker.guild.id, 'emojis');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await sticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerCreate });
            const createLog = fetchedLogs.entries.first();
            if (createLog && createLog.target.id === sticker.id && (Date.now() - createLog.createdTimestamp < 5000)) {
                executor = createLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await sticker.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🖼️ Sticker Créé')
                .setColor('#2ECC71')
                .setDescription(`Le sticker **${sticker.name}** a été ajouté${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setThumbnail(sticker.url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
