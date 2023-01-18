const { Discord } = require('discord.js');

module.exports = {
	name: 'Beep',
	description: 'Renvoie "Boop !"', //! A vérifié pour la description de la commande

	async run(client, message) {
		await message.reply(`Boop !`)
	}
};
