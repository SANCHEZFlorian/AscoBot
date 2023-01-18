const { Discord } = require('discord.js');

module.exports = {
	name: 'Ping',
	description: 'Renvoie le nom du serveur', //! A vérifié pour la description de la commande


    //? A voir pour rajouter les autres informations du serveur, style le nombre de membre, la date de création, etc
	async run(client, message) {
		await message.reply(`Le nom de ce serveur est : ${message.guild.name}`)
	}
};
