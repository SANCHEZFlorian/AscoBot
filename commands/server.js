import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('serveur')
		.setDescription('Renvoie les informations du serveur'),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply('Cette commande ne peut être utilisée que sur un serveur.');
		}

		const embed = new EmbedBuilder()
			.setTitle('Voici les informations du serveur :')
			.setColor("#09d2e1")
			.addFields([
				{
					name: `Le nom de ce serveur est : `,
					value: `${interaction.guild.name}`,
				},
				{
					name: 'Nombre de membres :',
					value: `${interaction.guild.memberCount}`,
					inline: true
				},
				{
					name: 'Serveur créé le :',
					value: `${interaction.guild.createdAt.toDateString()}`,
					inline: true
				}
			]);

		await interaction.reply({ embeds: [embed] });
	}
};
