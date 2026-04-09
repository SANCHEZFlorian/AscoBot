import { EmbedBuilder } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'messageUpdate',
    once: false,
    async execute(oldMessage, newMessage) {
        // Ignorer si ce sont des bots ou des messages système, ou si le contenu n'a pas changé (ex: embed de lien généré)
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        
        // S'assurer qu'on a bien l'auteur
        if (!newMessage.author) return;

        const logChannelId = getLogChannelId(newMessage.guildId, 'messages');
        if (!logChannelId) return;

        try {
            const channel = await newMessage.client.channels.fetch(logChannelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('✏️ Message Modifié')
                .setColor('#FFD700') // Jaune
                .setAuthor({
                    name: `${newMessage.author.tag} (${newMessage.author.id})`,
                    iconURL: newMessage.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Un message de <@${newMessage.author.id}> a été modifié dans <#${newMessage.channelId}> à <t:${Math.floor(Date.now() / 1000)}:T>. \n[Voir le message](${newMessage.url})`)
                .addFields(
                    { name: 'Ancien message', value: oldMessage.content ? `\`\`\`\n${oldMessage.content.length > 120 ? oldMessage.content.substring(0, 120) + '...' : oldMessage.content}\n\`\`\`` : '*(Aucun texte / Image)*' },
                    { name: 'Nouveau message', value: newMessage.content ? `\`\`\`\n${newMessage.content.length > 120 ? newMessage.content.substring(0, 120) + '...' : newMessage.content}\n\`\`\`` : '*(Aucun texte / Image)*' }
                )
                .setTimestamp()
                .setFooter({ text: `ID du Message : ${newMessage.id}` });

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de l'envoi du log messageUpdate :", error);
        }
    },
};
