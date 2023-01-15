
const { Command } = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class EmbedCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'embed',
            memberName: 'embed',
            group: 'divers',
            description: 'Send an embed message.',
            ownerOnly: true,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'], // le bot doit avoir la permission d'envoyer des messages
            throttling: {
                usages: 2,
                duration: 10,
            },
        });
    }

    async run(msg) {
        const embed = new Discord.MessageEmbed(); // création de l'embed

        embed
            .setColor('RED') // ou .setColor('#0099ff') // Couleur du trait à gauche de l'embed
            .setTitle('Titre du message, maximum 256 caractères') // Titre de l'embed

            // .setAuthor('Nom de l'auteur', 'https://mtxserv.com/build/img/favicon/favicon.ico', 'https://mtxserv.com/fr/')
            .setAuthor('${this.client.user.tag}', '${this.client.user.displayAvatarURL()}', 'https://mtxserv.com/fr/') // Nom afficher, Avatar afficher, lien quand on clique dessus en haut à gauche (normalement, le créateur de l'embed)

            .setDescription('Message contenu dans l\'embed, maximum 2048 caractères') // Description juste en dessous du titre de l'embed
            .setFooter('Pied de page du message', '${this.client.user.displayAvatarURL()}') // Footer de l'embed, en dessous de l'image

            .setImage('https://mtxserv.com/uploads/cover/creer-un-bot-discord-avec-discord-js-discord-191c77d00c4d79bf822422d6a05496bd.jpg') // Image en bas de l'embed
            .setThumbnail('https://mtxserv.com/uploads/banners/ae49ad104085151cbb44e27fffd9f16862cb6f2c.png') // Image/logo en haut à droite de l'embed

            .setTimestamp() // Vous pouvez passer un objet Date() en argument

            // Fields

            // Sur une ligne complète :
            .addField('Titre, maximum 256 caractères','Votre texte, maximum 1024 caractères')

            // Plusieurs sur une même ligne : (ajouter ", true" pour mettre sur la même ligne)
            .addField('Titre 1','Votre texte 1', true)
            .addField('Titre 2','Text avec un [lien](https://mtxserv.com/fr/)', true)
        ;

        msg.say(embed); // Envoie de l'embed
    }
};

// =========================================================
//  Limite de l'embed
// =========================================================
// Les titres sont limités à 256 caractères.
// Les descriptions sont limitées à 2048 caractères.
// Il peut y avoir jusqu'à 25 champs (addField()).
// Le nom d'un champ est limité à 256 caractères et sa valeur à 1024 caractères.
// Le texte du pied de page est limité à 2048 caractères.
// Le nom de l'auteur est limité à 256 caractères.
// La somme de tous les caractères d'un embed ne doit pas dépasser 6000 caractères.
// Un bot ne peut envoyer qu'un embed par message.
// Un webhook peut contenir 10 embeds par message.


// =========================================================
//  Autre version
// =========================================================


// if (msg.content.startsWith(prefix + "embed")) {
//     const embed = {
//        color: 16746215,
//        author: {
//          name: msg.author.username,
//          icon_url: msg.author.avatarURL
//        },
//        title: "Titre de l'embed.",
//        url: "https://devcommunity.gitbook.io/bot",
//        description: "Description de l'embed",
//        fields: [{
//            name: "Catégories",
//            value: "Un embed est divisé en différentes catégories."
//          },
//          {
//            name: "Markdown",
//            value: "Markdown, qui a été expliqué dans le chapitre précédent, est utilisable ici."
//          },
//          {
//            name: "Hyperliens",
//            value: "Vous pouvez utiliser des hyperliens. Celui-ci mène à [DuckDuckGo](https://duckduckgo.com)."
//          }
//        ],
//        timestamp: new Date(),
//        footer: {
//          icon_url: client.user.avatarURL,
//          text: client.user.username
//        }
//      }
//      msg.channel.send({embed});
//     };

