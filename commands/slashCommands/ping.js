const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('Ping')
		.setDescription('Réponds avec "Pong!" et le ping en ms'),
	async execute(interaction) {
		await interaction.reply(`Pong! Ping : \`${client.ws.ping}ms\`	`); //! A vérifié aussi
	},
};