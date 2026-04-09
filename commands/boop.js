import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('boop')
        .setDescription('Renvoie un gif sur le thème "Boop"')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('La personne à boop')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');

        const gifs = [
            "https://media.tenor.com/jP2rFh6WtswAAAAC/beep-boop-sox.gif",
            "https://media.tenor.com/yQpXLECQ0_sAAAAC/boop-nose-bopping.gif",
            "https://media.tenor.com/z6dqmhKFRbIAAAAC/beepboopbop-bmo.gif",
            "https://media.tenor.com/ejMJGr1p4LEAAAAC/boop-fox.gif",
            "https://media.tenor.com/_tvPZhgGWWMAAAAC/boop-cats.gif",
        ];
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

        const embed = new EmbedBuilder()
            .setTitle("Boop")
            .setColor("#9214e9")
            .setImage(randomGif);

        if (target) {
            await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
