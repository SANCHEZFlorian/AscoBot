import { createErrorEmbed } from '../utils/embeds.js';

export const event = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        // Handle Chat Input Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorEmbed = createErrorEmbed('Une erreur est survenue lors de l\'exécution de cette commande !');
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }
        // Handle Modal Submits
        else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_create_category_')) {
                const command = interaction.client.commands.get('createcategorycomplete');
                if (command && command.handleModal) {
                    try {
                        await command.handleModal(interaction);
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({ embeds: [createErrorEmbed('Erreur lors du traitement du formulaire.')], ephemeral: true });
                    }
                }
            } else if (interaction.customId.startsWith('wizard_init_')) {
                const command = interaction.client.commands.get('createtemplatefromcategory');
                if (command && command.handleModal) {
                    try {
                        await command.handleModal(interaction);
                    } catch (error) {
                        console.error(error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ embeds: [createErrorEmbed('Erreur lors du traitement du wizard.')], ephemeral: true });
                        }
                    }
                }
            }
        }
    },
};
