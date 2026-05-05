import { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const command = {
    data: new ContextMenuCommandBuilder()
        .setName('Signaler à la modération')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        const message = interaction.targetMessage;
        const reporter = interaction.user;

        if (message.author.bot) {
            return interaction.reply({ content: "❌ Vous ne pouvez pas signaler le message d'un bot.", ephemeral: true });
        }

        if (message.author.id === reporter.id) {
            return interaction.reply({ content: "❌ Vous ne pouvez pas signaler votre propre message.", ephemeral: true });
        }

        const logChannelId = getLogChannelId(interaction.guildId, 'moderation') || getLogChannelId(interaction.guildId, 'messages');
        
        if (!logChannelId) {
            return interaction.reply({ content: "❌ Le système de signalement n'est pas actif (aucun salon de logs modération configuré).", ephemeral: true });
        }

        try {
            const modChannel = await interaction.guild.channels.fetch(logChannelId);
            if (!modChannel) {
                return interaction.reply({ content: "❌ Le salon de logs est introuvable.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🚨 Signalement de Message')
                .setColor('#E67E22')
                .setAuthor({
                    name: `Signalé par ${reporter.tag}`,
                    iconURL: reporter.displayAvatarURL()
                })
                .setDescription(`Le message de <@${message.author.id}> a été signalé dans <#${message.channelId}>.\n\n**Contenu du message :**\n> ${message.content || '*(Contient un média spécial)*'}`)
                .addFields(
                    { name: 'Lien direct', value: `[Aller au message](${message.url})` }
                )
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_msg_${message.channelId}_${message.id}`)
                    .setLabel('Supprimer le message')
                    .setStyle(ButtonStyle.Danger)
            );

            await modChannel.send({ content: '@here Un nouveau signalement est arrivé !', embeds: [embed], components: [actionRow] });

            await interaction.reply({ content: `✅ Merci, votre signalement a été envoyé discrètement à la modération.`, ephemeral: true });
        } catch (error) {
            console.error("Erreur lors de l'envoi du signalement :", error);
            await interaction.reply({ content: "❌ Une erreur est survenue lors du signalement.", ephemeral: true });
        }
    }
};
