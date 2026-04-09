import { SlashCommandBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('beep')
		.setDescription('Renvoie Boop !'),
	async execute(interaction) {
		await interaction.reply('Boop !');
	}
};

