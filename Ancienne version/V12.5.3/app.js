// =========================================================
//  Utilisation 'nu' de la librairy de Discord
// =========================================================
// const Discord = require('discord.js'); // Chargement de la librairie discord.js
// const client = new Discord.Client(); // Création du bot
// var prefix = '//'; // Remplacez le '.' par le préfixe de votre bot


// =========================================================
//  Utilisation de la librairy de Discord-Commando (plus poussé et simple apparement)
// =========================================================

// const {CommandoClient} = require('discord.js-commando'); // Chargement du client de Discord Commando en mode 'normal'
const CommandoClient = require('./client'); // Chargement du client de Discord Commando en mode POO
const path = require('path'); // on ajoute la librairy path
const { config } = require('process');


// =========================================================
//  Début du 'vrai' code du Bot
// =========================================================
const client = new CommandoClient({
    commandPrefix: ' //', // Préfixe des commandes
    owner: config.owner, // ID de l'owner du bot, peut également être un tableau d'id pour plusieurs owners, ex: ['ID1', 'ID2']
    // disableMentions: 'everyone' // Désactive, par sécurité, l'utilisation du everyone par le bot
});

client.registry
    .registerDefaultTypes()
    .registerGroups([ // permettra par la suite de créer des groupes de commande
        ['divers', 'Divers'], // la première valeur correspond à la section 'group' de votre commande, la deuxième valeur sera utilisée pour l'affichage du nom du groupe, dans l'aide par exemple.
        ['embed', 'Embed'],
        ['texte', 'Texte'],
        ['moderator', 'Moderator'],

    ])
    .registerCommandsIn(path.join(__dirname, 'commands')); // on indique où seront les fichiers des commandes du bot


// =========================================================
//  Début du 'vrai' code du Bot
// =========================================================

client.on('ready', () => {
        console.log('Salut je suis connecté'); // On affiche un message de log dans la console (ligne de commande), lorsque le bot est démarré
        const TailleMembres = client.guilds.cache.memberCount;
        const TailleServeurs = client.guilds.cache.size;
        // =========================================================
        //  Commande pour modifier le statut du Bot
        // =========================================================
        client.user.setActivity('Connecté - ' + TailleServeurs + ' serveur(s) et ' + TailleMembres + ' membre(s)');
    },


    // =========================================================
    //  Commande de réponse à un message
    // =========================================================

    client.on('message', (msg) => { // Jusqu'au '}' affiché plus bas, il ne faut mettre que des codes destinés à des messages ici.

        // //Ping
        // if (msg.content.startsWith(client.prefix + 'ping')) {
        //     msg.channel.send('Pong ! :ping_pong:');
        // }

        // //Bonjour
        // if (msg.content.startsWith(client.prefix + 'Bonjour')) {
        //     msg.channel.send('Salut ! :D');
        // }

        // Afficher son avatar
        if (msg.content.startsWith(client.prefix + 'avatar')) {
            msg.channel.send(msg.author.defaultAvatarURL);
        }

    }));


// client.on('error', console.error); // Afficher les erreurs. Obsolète face à winston
client.login('Nzc2MDgwNjQyOTQxMjU1NzQx.X6vrbA.D7iXO64-P9xbtAIgYmRmCWnIf30'); // Lancement du bot, avec le token spécifié (que vous avez généré précédemment)
