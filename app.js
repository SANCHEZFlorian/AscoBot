// =========================================================
//  Initialisation du bot
// =========================================================

// require the discord.js module
const {
    Client,
    Collection,
    Events,
    MessageEmbed,
    GatewayIntentBits
} = require('discord.js');

// create a new Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});
// Récupération de la config
const {
    prefix,
} = require('./config.json');
// Require du .env et config
const dotenv = require('dotenv');
dotenv.config();

const {
    REST
} = require('@discordjs/rest');
const {
    Routes
} = require('discord-api-types/v9');

// login to Discord with your app's token
client.login(process.env.TOKEN);

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});




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
        const embed = new MessageEmbed()
            .setAuthor({
                name: 'OctoBot',
                iconURL: 'https://imgur.com/WQqHGze.png',
            })
            .setColor('#09d2e1');
        const embed2 = new MessageEmbed()
            .setAuthor({
                name: 'OctoBot',
                iconURL: 'https://imgur.com/WQqHGze.png',
            })
            .setColor('#09d2e1');
        //.setThumbnail('https://imgur.com/WQqHGze.png')
        //.setTimestamp();
        // Ping simple, mais avec message exact
        // if (message.content === '!ping') {
        // 	message.channel.send('Pong.');
        // }

        // Ping simple, avec préfix dans le config.json, et si le message est exact
        // if (message.content === `${prefix}ping`) {
        // 	message.channel.send('Pong');
        // } else if (message.content === `${prefix}beep`) {
        // 	message.channel.send('Boop');
        // }

        // Ping simple, avec préfix variable, et début du message commençant par la commande
        // if (message.content.startsWith(`${prefix}ping`)) {
        // 	message.channel.send('Pong');
        // } else if (message.content.startsWith(`${prefix}beep`)) {
        // 	message.channel.send('Boop');


        //* Ping, renvoie un pong
        if (command === 'ping') {
            console.log(message.member.roles);
            if (message.member.roles.cache.some(role => role.id === '961322995987664986')) {
                console.log('rôle trouvé');
            } else {
                console.log('rôle NON trouvé');
            }
            embed.setDescription('Pong');
            message.channel.send({
                embeds: [embed]
            });
            //message.channel.send('Pong');
        }
        //* Beep, renvoie un boop
        else if (command === 'beep') {
            console.log("commande beep");
            embed.setDescription('Boop');
            embed.addField('test');
            message.channel.send({
                embed: [embed]
            });
        }
        //* Server, renvoie le nom du serveur
        else if (command === 'server') {
            embed.setDescription(`Le nom de ce serveur est : ${message.guild.name}`);
            message.channel.send({
                embeds: [embed]
            });
        }
        //* Member, renvoie le nombre de membres
        else if (command === 'member') {
            embed.setDescription(`Nombre de membre : ${message.guild.memberCount}`);
            message.channel.send({
                embeds: [embed]
            });
        }
        //* Created, renvoie la date de création du serveur
        else if (command === 'created') {
            embed.setDescription(`Création du serveur ${message.guild.name} : ${message.guild.createdAt}`);
            message.channel.send({
                embeds: [embed]
            });
        }
        //* User-info, renvoie des informations sur l'utilisateur (pseudo, tag, id)
        else if (command === 'user-info') {
            embed.setDescription(`Pseudo : ${message.author.username}\nDiscordTag : ${message.author.tag}\nID : ${message.author.id}`);
            message.channel.send({
                embeds: [embed]
            });
        }
        //* Args-info, renvoie les arguments de la commande
        else if (command === 'args-info') {
            if (!args.length) {
                embed.setDescription(`You didn't provide any arguments, ${message.author}!`);
                return message.channel.send({
                    embeds: [embed]
                });
            }
            embed.setDescription(`Nom de la commande: ${command}\nArguments: ${args}`);
            message.channel.send({
                embeds: [embed]
            });
        }
        //* XdY, renvoie X nombre aléatoire (chiffre avant le d) entre 1 et Y (le chiffre après d)
        else if (hasNumber(command) && command.includes('d')) {
            let dice = command.slice().split('d');
            if (dice[0] == '' || dice[0] == 0 || dice[0] == 1) {
                result = entierAleatoire(1, Math.round(dice[1]));
                embed.addField(`Résultat du dé :`, `${result}`);
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embed]
                });
                //message.channel.send(`Résultat du dé de <@${message.author.id}> : ${entierAleatoire(1, Math.round(dice[1]))}`);
            } else {
                if (dice[0] <= 25) {
                    let nbDice = Math.round(dice[0]);
                    for (let i = 0; i < nbDice; i++) {
                        result = entierAleatoire(1, Math.round(dice[1]));
                        embed.addField(`Résultat du dé ${i + 1} :`, `${result}`);
                        // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                    }
                    message.channel.send({
                        content: `<@${message.author.id}>`,
                        embeds: [embed]
                    });
                } else if (dice[0] <= 50) {
                    let nbDice = Math.round(dice[0]);
                    for (let i = 0; i <= 25; i++) {
                        result = entierAleatoire(1, Math.round(dice[1]));
                        embed.addField(`Résultat du dé ${i + 1} :`, `${result}`);
                        // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                    }
                    message.channel.send({
                        content: `<@${message.author.id}>`,
                        embeds: [embed]
                    });
                    for (let j = 25; j < dice[0]; j++) {
                        result = entierAleatoire(1, Math.round(dice[1]));
                        embed2.addField(`Résultat du dé ${j + 1} :`, `${result}`);
                        // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                    }
                    message.channel.send({
                        content: `<@${message.author.id}>`,
                        embeds: [embed2]
                    });
                } else {
                    embed.setDescription('Merci de ne lancer que 50 dés maximum.');
                    message.channel.send({
                        content: `<@${message.author.id}>`,
                        embeds: [embed]
                    });
                }
            }
        }
        //* Avatar, renvoie l'avatar de l'utilisateur ou des utilisateurs mentionnés
        else if (command === 'avatar') {
            // Si pas de mention, donne l'avatar de l'auteur
            if (!message.mentions.users.size) {
                embed.setTitle(message.author.username);
                embed.setDescription('Votre avatar est :');
                embed.setImage(message.author.displayAvatarURL({
                    format: 'png',
                    dynamic: true,
                    size: 512
                }));
                return message.channel.send({
                    embeds: [embed]
                });
            } else {
                // Si mention de membre(s), donne l'avatar du(des) membre(s)
                message.mentions.users.forEach(user => {
                    let avatar = new MessageEmbed();
                    avatar.setAuthor({
                        name: 'OctoBot',
                        iconURL: 'https://imgur.com/WQqHGze.png',
                    });
                    avatar.setColor('#09d2e1');
                    avatar.setThumbnail('https://imgur.com/WQqHGze.png');
                    avatar.setTimestamp();
                    avatar.setTitle("Liste des avatars");
                    avatar.addField(`${user.username}`, `Avatar de ${user.username}`);
                    avatar.setImage(user.displayAvatarURL({
                        format: 'png',
                        dynamic: true,
                        size: 512
                    }));
                    return message.channel.send({
                        embeds: [avatar]
                    });
                });
            }
        }
        // else if (command.includes('create-team') && ) {
        //     message.guild.channels.create('test');
        // }
    });