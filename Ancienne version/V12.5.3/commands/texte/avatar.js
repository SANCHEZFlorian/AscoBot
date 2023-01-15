// //Afficher son avatar
// if (msg.content.startsWith(client.prefix + "avatar")) {
//     msg.channel.send(msg.author.displayAvatarURL());
// }

const {
    Command,
} = require('discord.js-commando');

module.exports = class AvatarCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'avatar',
            memberName: 'avatar',
            group: 'texte',
            description: 'Replies with the avatar of the author or other membre.', // Description de la commande
            clientPermissions: ['SEND_MESSAGES'], // Le Bot (client) doit avoir la permission SEND_MESSAGES (envoie de message) pour faire la commande
            userPermissions: ['SEND_MESSAGES'], // Celui qui demande la commande (user) doit avoir la permission SEND_MESSAGES (envoie de message) pour faire la commande
            // ownerOnly: true, //Seul le propriétaire du bot pourra utiliser la commande
            guildOnly: false, // Facultatif, Permet de limiter l'utilisation de la commande (le bot accepte par défaut les commandes en message privé ainsi que sur les channels). Si true, la commande ne fonctionnera pas en message privé (par défaut à false).
            throttling: { // Facultatif, Permet d'éviter le flood des commandes du Bot (sauf pour l'owner du Bot)
                usages: 2, // Nombre d'utilisation
                duration: 10, // Toutes les X secondes
            },
        });
    }

    async run(msg) {
        msg.channel.send(msg.author.displayAvatarURL());
    }
};