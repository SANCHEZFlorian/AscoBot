import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
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

            const oldContent = oldMessage.content || '';
            const newContent = newMessage.content || '';

            let oldField = oldContent ? `\`\`\`\n${oldContent.length > 1000 ? oldContent.substring(0, 1000) + '... (voir fichier joint)' : oldContent}\n\`\`\`` : '*(Aucun texte / Image)*';
            let newField = newContent ? `\`\`\`\n${newContent.length > 1000 ? newContent.substring(0, 1000) + '... (voir fichier joint)' : newContent}\n\`\`\`` : '*(Aucun texte / Image)*';

            const attachments = [];
            if (oldContent.length > 1000) {
                attachments.push(new AttachmentBuilder(Buffer.from(oldContent, 'utf-8'), { name: 'ancien_message.txt' }));
            }
            if (newContent.length > 1000) {
                attachments.push(new AttachmentBuilder(Buffer.from(newContent, 'utf-8'), { name: 'nouveau_message.txt' }));
            }

            const embed = new EmbedBuilder()
                .setTitle('✏️ Message Modifié')
                .setColor('#FFD700') // Jaune
                .setAuthor({
                    name: `${newMessage.author.tag} (${newMessage.author.id})`,
                    iconURL: newMessage.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Un message de <@${newMessage.author.id}> a été modifié dans <#${newMessage.channelId}> à <t:${Math.floor(Date.now() / 1000)}:T>. \n[Voir le message](${newMessage.url})`)
                .addFields(
                    { name: 'Ancien message', value: oldField },
                    { name: 'Nouveau message', value: newField }
                )
                .setTimestamp()
                .setFooter({ text: `ID du Message : ${newMessage.id}` });

            await channel.send({ embeds: [embed], files: attachments });
        } catch (error) {
            console.error("Erreur lors de l'envoi du log messageUpdate :", error);
        }
    },
};
