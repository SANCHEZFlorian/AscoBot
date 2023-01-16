const { Discord } = require('discord.js');

module.exports = {
	name: 'Ping',
	description: 'Renvoie le ping en ms', //! A vérifié pour la description de la commande

	async run(client, message) {
		await message.reply(`Ping : \`${client.ws.ping}ms\`	`)
	}
};
