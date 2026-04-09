import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Renvoie les informations de l\'utilisateur')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('L\'utilisateur dont vous voulez voir les infos')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = interaction.options.getMember('target') || interaction.member; // Logic might vary for mock interaction if options are strictly implemented

        // If mock interaction doesn't return full Member object on getMember depending on implementation, fallback to fetch?
        // Note: My mock implementation uses message.mentions.members.first().

        const embed = new EmbedBuilder()
            .setTitle("Voici les informations :")
            .setColor("#09d2e1")
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields([
                {
                    name: 'Pseudo :',
                    value: user.username,
                    inline: true
                },
                {
                    name: 'Tag :',
                    value: user.tag, // Note: Discriminators are going away, this might be 0
                    inline: true
                },
                {
                    name: 'ID :',
                    value: user.id,
                    inline: true
                },
                {
                    name: 'Compte créé le :',
                    value: user.createdAt.toDateString(),
                    inline: true
                }
            ]);

        // Add member info if available (e.g. joinedAt)
        if (member && member.joinedAt) {
            embed.addFields({
                name: 'A rejoint le serveur le :',
                value: member.joinedAt.toDateString(),
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
