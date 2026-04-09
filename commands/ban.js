import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Renvoie un gif sur le thème "Ban"'),
    async execute(interaction) {
        const gifs = [
            "https://media.tenor.com/DZxVzQzJwkgAAAAC/animated-stciker-sombra.gif",
            "https://media.tenor.com/TbfChfHKkOUAAAAC/ban-button.gif",
            "https://media.tenor.com/ai7K4FV5RiEAAAAC/among-us-ban.gif",
            "https://media.tenor.com/_rMM5ICPEukAAAAC/thor-strike.gif",
            "https://media.tenor.com/d0VNnBZkSUkAAAAC/bongocat-banhammer.gif",
            "https://media.tenor.com/PAUE9-M2AzgAAAAd/bolvar-ban-efe-sarpan.gif",
            "https://media.tenor.com/9zCgefg___cAAAAC/bane-no.gif",
            "https://media.tenor.com/gnXapwOEaTEAAAAC/spongebob-ban.gif",
        ];
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

        const embed = new EmbedBuilder()
            .setColor("#e7ea2e")
            .setImage(randomGif);

        await interaction.reply({ embeds: [embed] });
    }
};
