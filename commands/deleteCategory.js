import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType
} from 'discord.js';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed, Colors } from '../utils/embeds.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('deletecategory')
        .setDescription('Supprime une catégorie et TOUS ses salons (Irréversible).')
        .addChannelOption(option =>
            option.setName('target_category')
                .setDescription('La catégorie à supprimer')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const category = interaction.options.getChannel('target_category');

        // Safety check (should be handled by Discord due to addChannelTypes, but good to have)
        if (!category || category.type !== ChannelType.GuildCategory) {
            return interaction.reply({
                embeds: [createErrorEmbed('La cible doit être une catégorie valide.')],
                ephemeral: true
            });
        }

        // Fetch children to give an accurate count in warning
        // We rely on cache or fetch?
        // Best to use interaction.guild.channels.cache for speed, but fetch ensures accuracy.
        // Let's use cache for the UI count, but maybe fetch during deletion if needed.
        const children = interaction.guild.channels.cache.filter(c => c.parentId === category.id);
        const childCount = children.size;

        // Visual Warning
        const warningEmbed = new EmbedBuilder()
            .setTitle('⚠️ Danger : Suppression Totale')
            .setDescription(`Vous êtes sur le point de supprimer la catégorie **${category.name}** et **${childCount}** salons associés.\n\nCette action est **irréversible**. Êtes-vous sûr ?`)
            .setColor(Colors.Error); // Red

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_delete')
            .setLabel('Oui, tout supprimer')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_delete')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);

        const response = await interaction.reply({
            embeds: [warningEmbed],
            components: [row],
            ephemeral: true // Keep it private to the admin
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15000 // 15 seconds to confirm
        });

        collector.on('collect', async i => {
            // Security: Only author can click (handled by ephemeral usually, but good practice)
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Vous ne pouvez pas utiliser ces boutons.', ephemeral: true });
            }

            if (i.customId === 'confirm_delete') {
                await i.update({
                    embeds: [createInfoEmbed('⏳ Suppression en cours... Veuillez patienter.')],
                    components: [] // Remove buttons
                });

                let deletedCount = 0;
                try {
                    // Refetch children to be sure?
                    // Let's iterate the cached collection we had or fetch fresh if possible.
                    // Discord.js collection iteration is sync, but delete is async.

                    // We can use Promise.all for speed, or loop for safety/rate limits.
                    // Given it's a category, likely < 50 channels. Promise.all is probably fine but might hit rate limits.
                    // Sequential is safer.

                    for (const [id, channel] of children) {
                        try {
                            await channel.delete(`Suppression de catégorie par ${interaction.user.tag}`);
                            deletedCount++;
                        } catch (err) {
                            console.error(`Failed to delete channel ${channel.name}:`, err);
                        }
                    }

                    // Delete Category
                    await category.delete(`Suppression de catégorie par ${interaction.user.tag}`);

                    await interaction.editReply({
                        embeds: [createSuccessEmbed(`✅ La catégorie **${category.name}** et **${deletedCount}** salons ont été supprimés avec succès.`)],
                        components: []
                    });

                } catch (err) {
                    console.error('Error during deletion process:', err);
                    await interaction.editReply({
                        embeds: [createErrorEmbed(`Une erreur est survenue pendant la suppression : ${err.message}`)],
                        components: []
                    });
                }

            } else if (i.customId === 'cancel_delete') {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle('Opération annulée')
                    .setDescription('La catégorie n\'a pas été supprimée.')
                    .setColor(0x808080); // Grey

                await i.update({
                    embeds: [cancelEmbed],
                    components: []
                });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                // Timeout
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('Temps écoulé')
                    .setDescription('La demande de suppression a expiré.')
                    .setColor(0x808080);

                try {
                    await interaction.editReply({
                        embeds: [timeoutEmbed],
                        components: []
                    });
                } catch (e) {
                    // Message might be deleted
                }
            }
        });
    }
};
