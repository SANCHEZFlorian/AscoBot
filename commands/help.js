import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Renvoie la liste des commandes'),
    async execute(interaction) {
        const commands = interaction.client.commands;

        const embed = new EmbedBuilder()
            .setTitle("Liste des commandes :")
            .setDescription("Pour faire une commande, utilisez le Slash Command `/` ou le préfixe `!` (ex: `!boop`).\n\n__Voici la liste des commandes disponibles :__")
            .setColor("#09d2e1");

        const fields = [];
        commands.forEach(cmd => {
            // Only add if description exists
            if (cmd.data && cmd.data.name) {
                fields.push({
                    name: cmd.data.name,
                    value: cmd.data.description || 'Pas de description',
                    inline: true
                });
            }
        });

        embed.addFields(fields);

        await interaction.reply({ embeds: [embed] });
    }
};
