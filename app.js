// =========================================================
//  Initialisation du bot
// =========================================================

// require the discord.js module
const { Client, Intents } = require('discord.js');
// create a new Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
// Récupération de la config
const {
    prefix,
} = require('./config.json');
// Require du .env et config
const dotenv = require('dotenv');
dotenv.config();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

// login to Discord with your app's token
client.login(process.env.TOKEN);


// =========================================================
//  Fonctions et variables nécessaires
// =========================================================
function hasNumber(myString) {
    return /\d/.test(myString);
}

function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// =========================================================
//  Début du "vrai" code du bot
// =========================================================

client.on(

    // =========================================================
    //  Commande pour modifier le statut du Bot
    // =========================================================
    // 'ready', () => {
    //     const TailleMembres = client.guilds.memberCount;
    //     const TailleServeurs = client.guilds.cache.size;
    //     client.user.setActivity('Connecté - ' + TailleServeurs + ' serveur(s) et ' + TailleMembres + ' membre(s)');
    // },


    // =========================================================
    //  Code des commandes
    // =========================================================
    'message', message => {
        if (!message.content.startsWith(prefix) || message.author.bot) return; // Si le message ne commence pas par le préfix ou que c'est un message du bot, ça ne lit pas
        const args = message.content.slice(prefix.length).trim().split(/ +/); // Prend le message, enlève le préfix, et mets chaque mot dans un tableau, en enlevant les espaces
        const command = args.shift().toLowerCase(); // Prend le premier élément du tableau, et le renvoie, tout en le supprimant. Permet de faire plusieurs suites de commande en un message

        // // Ping simple, mais avec message exact
        // if (message.content === '!ping') {
        // 	message.channel.send('Pong.');
        // }

        // // Ping simple, avec préfix dans le config.json, et si le message est exact
        // if (message.content === `${prefix}ping`) {
        // 	message.channel.send('Pong');
        // } else if (message.content === `${prefix}beep`) {
        // 	message.channel.send('Boop');
        // }

        // // Ping simple, avec préfix variable, et début du message commençant par la commande
        // if (message.content.startsWith(`${prefix}ping`)) {
        // 	message.channel.send('Pong');
        // } else if (message.content.startsWith(`${prefix}beep`)) {
        // 	message.channel.send('Boop');


        if (command === 'ping') {
            message.channel.send('Pong');
        } else if (command === 'beep') {
            message.channel.send('Boop');
        } else if (command === 'server') {
            message.channel.send(`Le nom de ce serveur est : ${message.guild.name}`);
        } else if (command === 'member') {
            message.channel.send(`Nombre de membre : ${message.guild.memberCount}`);
        } else if (command === 'created') {
            message.channel.send(`Création du serveur ${message.guild.name} : ${message.guild.createdAt}`);
        } else if (command === 'user-info') {
            message.channel.send(`Pseudo : ${message.author.username}\nID : ${message.author.id}`);
        } else if (command === 'args-info') {
            if (!args.length) {
                return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
            }
            message.channel.send(`Nom de la commande: ${command}\nArguments: ${args}`);


        } else if (hasNumber(command) && command.includes('d')) {
            let dice = command.slice().split('d');
            if (dice[0] == '') {
                message.channel.send(`Résultat du dé : ${entierAleatoire(1, Math.round(dice[1]))}`);
            } else {
                let nbDice = Math.round(dice[0]);
                for (let i = 0; i < nbDice; i++) {
                    message.channel.send(`Résultat du dé ${i + 1} : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                }
            }
        } else if (command === 'avatar') {
            const embed = new client.MessageEmbed();
            // Si pas de mention, donne l'avatar de l'auteur
            if (!message.mentions.users.size) {
                embed.setTitle(message.author.username);
                embed.setImage(message.author.displayAvatarURL({
                    format: 'png',
                    dynamic: true,
                    size: 512
                }));
                return message.channel.send(embed);
            } else {
                //! A DEBUG !!!
                // Si mention de membre(s), donne l'avatar du(des) membre(s)
                // message.mentions.users.forEach(user => {
                //     embed.setTitle("Liste des avatars");
                //     embed.addField({
                //         name: `${user.username}`,
                //         value: `${client.user.displayAvatarURL({ 
                //             format: 'png', 
                //             dynamic: true,
                //             size: 512 
                //         })}`
                //     }, )
                // });
                embed.setTitle("Liste des avatars");
                message.mentions.users.map(user => {
                    // embed.addField({
                    //     name: `${ message.mentions.users.user.username}`,
                    //     value: `${client.user.displayAvatarURL({ 
                    //         format: 'png', 
                    //         dynamic: true,
                    //         size: 512 
                    //     })}`
                    // })
                });
                console.log(message.mentions.users);
                //console.log(message.mentions.users[username]);
                return message.channel.send(embed);
            }
        }
    });