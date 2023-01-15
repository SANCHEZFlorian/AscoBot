const { Discord } = require('discord.js');

module.exports = {
	name: 'ping',

	async run(client, message) {
		await message.reply(`Ping : \`${client.ws.ping}ms\`	`)
	}
};
