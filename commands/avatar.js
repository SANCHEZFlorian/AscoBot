import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Affiche l\'avatar d\'un utilisateur')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('L\'utilisateur dont vous voulez voir l\'avatar')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`Avatar de ${user.username}`)
            .setColor("#09d2e1")
            .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp()
            .setFooter({
                text: "AscoBot",
                // iconURL: "https://imgur.com/WQqHGze.png" // You might want to update this or make it dynamic
            });

        await interaction.reply({ embeds: [embed] });
    }
};
