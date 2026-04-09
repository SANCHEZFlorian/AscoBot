import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'emojiCreate',
    once: false,
    async execute(emoji) {
        if (!emoji.guild) return;
        const logChannelId = getLogChannelId(emoji.guild.id, 'emojis');
        if (!logChannelId) return;

        let executor = null;
        try {
            const fetchedLogs = await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiCreate });
            const createLog = fetchedLogs.entries.first();
            if (createLog && createLog.target.id === emoji.id && (Date.now() - createLog.createdTimestamp < 5000)) {
                executor = createLog.executor;
            }
        } catch (e) {}

        try {
            const logChannel = await emoji.client.channels.fetch(logChannelId);
            if (!logChannel) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;
            const embed = new EmbedBuilder()
                .setTitle('🤩 Émoji Créé')
                .setColor('#2ECC71')
                .setDescription(`L'émoji ${emoji} (**${emoji.name}**) a été ajouté${executor ? ` par <@${executor.id}>` : ''} à ${timeNow}.`)
                .setThumbnail(emoji.url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
