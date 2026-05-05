import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'messageDelete',
    once: false,
    async execute(message) {
        // Ignorer si l'auteur est un bot (s'il est spécifié)
        if (message.author?.bot) return;

        const isPartial = message.partial || !message.author;

        const logChannelId = getLogChannelId(message.guildId, 'messages');
        if (!logChannelId) return;

        let executor = null;
        let authorGuess = null;

        try {
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            // Si le log de délétion est très récent (moins de 5 secondes)
            if (deletionLog && (Date.now() - deletionLog.createdTimestamp < 5000)) {
                if (!isPartial) {
                    if (deletionLog.target.id === message.author.id) {
                        executor = deletionLog.executor;
                    }
                } else {
                    // Si partiel, on subodore que ce log d'audit (récent) correspond probablement à notre message
                    executor = deletionLog.executor;
                    authorGuess = deletionLog.target;
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des Audit Logs pour messageDelete:", error);
        }

        try {
            const channel = await message.client.channels.fetch(logChannelId);
            if (!channel) return;

            const executorText = executor ? ` supprimé par <@${executor.id}>` : ` supprimé`;
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Message Supprimé')
                .setColor('#FF0000') // Rouge
                .setTimestamp()
                .setFooter({ text: `ID du Message : ${message.id}` });

            if (isPartial) {
                embed.setAuthor({ name: 'Ancien message (Inconnu / Non-mémorisé)' });
                let desc = `Un ancien message a été${executorText} dans <#${message.channelId}> à <t:${Math.floor(Date.now() / 1000)}:T>.`;
                
                if (authorGuess) {
                    desc += `\n*Il est fort probable que le message appartenait à <@${authorGuess.id}>.*`;
                }
                
                embed.setDescription(desc);
                embed.addFields({ name: 'Avertissement', value: '*Discord ne renvoie malheureusement ni l\'auteur, ni le contenu des vieux messages supprimés datant d\'avant le redémarrage du bot.*' });
            } else {
                embed.setAuthor({
                    name: `${message.author.tag} (${message.author.id})`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });
                embed.setDescription(`Un message de <@${message.author.id}> a été${executorText} dans <#${message.channelId}> à <t:${Math.floor(Date.now() / 1000)}:T>.`);
                embed.addFields({ name: 'Contenu du message', value: message.content ? `\`\`\`\n${message.content.length > 1000 ? message.content.substring(0, 1000) + '...' : message.content}\n\`\`\`` : '*(Aucun texte)*' });
                
                if (message.attachments.size > 0) {
                    const attachments = Array.from(message.attachments.values());
                    const attachmentUrlsStr = attachments.map((a, i) => `[Lien vers le Fichier ${i+1}](${a.url})`).join('\n');
                    
                    const imageAttachment = attachments.find(a => a.contentType && a.contentType.startsWith('image/'));
                    if (imageAttachment) {
                        embed.setImage(imageAttachment.proxyURL || imageAttachment.url);
                    }
                    
                    embed.addFields({ name: 'Pièces jointes', value: attachmentUrlsStr });
                }
                
                let reactionsText = "";
                if (message.reactions.cache.size > 0) {
                    message.reactions.cache.forEach(reaction => {
                        const usersArr = reaction.users.cache.filter(u => !u.bot).map(u => `<@${u.id}>`);
                        if (usersArr.length > 0) {
                            reactionsText += `${reaction.emoji.toString()} : ${usersArr.join(', ')}\n`;
                        } else if (reaction.count > 0) {
                            reactionsText += `${reaction.emoji.toString()} : ${reaction.count} membre(s) (non-mémorisés)\n`;
                        }
                    });
                }
                
                if (reactionsText) {
                    if (reactionsText.length > 1024) reactionsText = reactionsText.substring(0, 1020) + '...';
                    embed.addFields({ name: 'Réactions au moment de la suppression', value: reactionsText });
                }
            }



            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de l'envoi du log messageDelete :", error);
        }
    },
};
