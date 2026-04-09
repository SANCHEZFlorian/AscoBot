import { SlashCommandBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Renvoie le ping en ms'),
	async execute(interaction) {
		await interaction.reply(`Ping : \`${interaction.client.ws.ping}ms\``);
	}
};

