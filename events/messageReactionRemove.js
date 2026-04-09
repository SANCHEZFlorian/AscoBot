import { EmbedBuilder } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'messageReactionRemove',
    once: false,
    async execute(reaction, user) {
        // Obtenir proprement les données si elles sont en Partials (non mémorisées en cache lors du démarrage)
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Erreur lors du fetch de reaction (ReactionRemove): ", error);
                return;
            }
        }
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error("Erreur lors du fetch de message (ReactionRemove): ", error);
                return;
            }
        }
        if (user.partial) {
            try {
                await user.fetch();
            } catch (error) {
                console.error("Erreur lors du fetch de user (ReactionRemove): ", error);
                return;
            }
        }

        // Si le bot n'est pas dans un serveur ou si c'est lui-même l'auteur de la réaction
        if (!reaction.message.guildId) return;
        if (user.bot) return;

        const logChannelId = getLogChannelId(reaction.message.guildId, 'reactions');
        if (!logChannelId) return;

        try {
            const channel = await reaction.message.client.channels.fetch(logChannelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('❌ Réaction Retirée')
                .setColor('#E74C3C') // Rouge clair
                .setAuthor({
                    name: `${user.tag} (${user.id})`,
                    iconURL: user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`<@${user.id}> a **retiré** sa réaction à un message de <@${reaction.message.author?.id || 'Inconnu'}> dans <#${reaction.message.channelId}> à <t:${Math.floor(Date.now() / 1000)}:T>.\n[Voir le message](${reaction.message.url})`)
                .addFields(
                    { name: 'Émoji', value: reaction.emoji.toString() },
                    { name: 'Contenu du message', value: reaction.message.content ? `\`\`\`\n${reaction.message.content.length > 120 ? reaction.message.content.substring(0, 120) + '...' : reaction.message.content}\n\`\`\`` : '*(Aucun texte)*' }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de l'envoi du log messageReactionRemove :", error);
        }
    },
};
