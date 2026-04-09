import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const command = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Lance des dés (ex: 1d20, 2d6)')
        .addStringOption(option =>
            option.setName('expression')
                .setDescription('L\'expression du lancer (ex: 1d20)')
                .setRequired(true)),
    async execute(interaction) {
        const expression = interaction.options.getString('expression');
        // Simple parsing relying on the "d" structure: XdY
        // We assume valid regex check passed or we check here again if slash command used.
        // Slash regex check isn't automatic, so we should robustly parse.

        const parts = expression.toLowerCase().split('d');
        if (parts.length !== 2) {
            return interaction.reply('Format invalide. Utilisez XdY (ex: 1d20).');
        }

        let nbDice = parseInt(parts[0]);
        let maxFaces = parseInt(parts[1]);

        // Handle case "d20" -> nbDice is NaN (empty string in split)
        if (parts[0] === '' || isNaN(nbDice) || nbDice === 0) {
            nbDice = 1;
        }

        // Handling logic from original bot
        if (nbDice > 50) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor("#FF0000").setTitle("Merci de ne lancer que 50 dés maximum.")]
            });
        }

        // We ignore the "+ bonus" part for now as it was experimental in original code

        const embed = new EmbedBuilder()
            .setColor("#09d2e1")
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            });

        if (nbDice === 1) {
            const result = entierAleatoire(1, maxFaces);
            embed.addFields([{ name: "Résultat", value: `Résultat du dé : ${result}` }]);
            await interaction.reply({ embeds: [embed] });
        } else {
            let results = [];
            for (let i = 0; i < nbDice; i++) {
                results.push(entierAleatoire(1, maxFaces));
            }

            // If too many results, they might not fit in fields properly if we do 1 field per die.
            // Original code did 1 field per die.
            // Discord limits fields to 25.
            // Original code split across 2 embeds if > 25.

            const fields1 = [];
            const fields2 = [];

            results.forEach((res, index) => {
                const field = { name: `Dé ${index + 1} :`, value: `${res}`, inline: true };
                if (index < 25) {
                    fields1.push(field);
                } else {
                    fields2.push(field);
                }
            });

            embed.addFields(fields1);
            await interaction.reply({ embeds: [embed] });

            if (fields2.length > 0) {
                const embed2 = new EmbedBuilder()
                    .setColor("#09d2e1")
                    .addFields(fields2);
                await interaction.followUp({ embeds: [embed2] });
            }
        }
    }
};
