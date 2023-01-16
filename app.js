// On importe les modules nécessaire
const Discord = require('discord.js');
const config = require('./config.json');
const intents = new Discord.IntentsBitField(3276799);
const {
    MessageEmbed,
    EmbedBuilder
} = require('discord.js');
const loadCommands = require('./loader/loadCommands');

// Récupération de la config
const {
    prefix,
} = require('./config.json');

// Require du .env et config
const dotenv = require('dotenv');
dotenv.config();


// On initialise le client Discord
// Dans les intents, on peut rajouter un à un les permissions requises, ou mettre le nombre correspondant de droit, en l'occurence, toutes les permissions
const client = new Discord.Client({ intents });

// On connecte le bot
client.login(process.env.TOKEN);

client.commands = new Discord.Collection();

loadCommands(client);

// Une fois le bot en ligne, on lui donne les instructions
client.on("ready", async () => {
    console.log(`${client.user.tag} est bien en ligne`);
})


// =========================================================
//  Fonctions et variables nécessaires
// =========================================================

// Vérifie si une chaîne de caractères contient un nombre
function hasNumber(myString) {
    return /\d/.test(myString);
}

// Sort un nombre aléatoire entre min et max (inclus)
function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


client.on('messageCreate', async message => {
    // On écoute les messages commençant uniquement par le préfix et on découpe la commande
    if (!message.content.startsWith(prefix) || message.author.bot) return; // Si le message ne commence pas par le préfix ou que c'est un message du bot, ça ne lit pas
    const args = message.content.slice(prefix.length).trim().split(/ +/); // Prend le message, enlève le préfix, et mets chaque mot dans un tableau, en enlevant les espaces
    const command = args.shift().toLowerCase(); // Prend le premier élément du tableau, et le renvoie, tout en le supprimant. Permet de faire plusieurs suites de commande en un message

    // On créé l'embed du message et les paramètres principaux de l'embed (Auteur, couleur par défaut)
    // On en créé un deuxième pour le cas où on en a besoin de 2 
    const embed = new EmbedBuilder()
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 512
            }),
        })
        // .setTitle(client.commands.get('name')) //! A vérifié pour affiche le nom de la commande
        .setColor('#09d2e1')
        .setFooter({
            text: 'OctoBot',
            iconURL: 'https://imgur.com/WQqHGze.png',
        })
        .setTimestamp();
    const embed2 = new EmbedBuilder()
        .setAuthor({
            name: 'OctoBot',
            iconURL: 'https://imgur.com/WQqHGze.png',
        })
        //.setTitle(client.commands.name) //! A vérifié pour affiche le nom de la commande
        .setColor('#09d2e1');


    // Commande de base via le tuto https://www.youtube.com/playlist?list=PLCKgTe6DYNc60EiOlsnSNMhva6-zgr2MN
    if (message.content === "!a ping") {
        return client.commands.get("ping").run(client, message);
    }


    if (command === "test") {
        // message.reply fait un "répondre au message"
        message.reply('test');
        // Tandis que le message.channel.send fait un "envoyer un message"
        message.channel.send('test');
    }
    //* Ping, renvoie un pong
    if (command === 'pingpong') {
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
        message.reply('boop');
        embed.setDescription('Boop');
        embed.addFields([
            {
                name: 'Test',
                value: 'Boop',
            }
        ]);
        message.channel.send({
            embeds: [embed]
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
            embed.setDescription(`Il n'y a pas d'argument dans cette commande, ${message.author}!`);
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
        // Dans le cas où on a qu'un dé
        if (dice[0] == '' || dice[0] == 0 || dice[0] == 1) {
            let result = entierAleatoire(1, Math.round(dice[1]));
            // embed.addFields(`Résultat du dé :`, `${result}`);
            embed.addFields([
                {
                    name: 'Lancé de dé',
                    value: `Résultat du dé : ${result}`,
                }
            ]
            );

            message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [embed]
            });
            //message.channel.send(`Résultat du dé de <@${message.author.id}> : ${entierAleatoire(1, Math.round(dice[1]))}`);
        } else {
            // Dans le cas où on a jusqu'à 25 dés
            if (dice[0] <= 25) {
                let nbDice = Math.round(dice[0]);
                for (let i = 0; i < nbDice; i++) {
                    let result = entierAleatoire(1, Math.round(dice[1]));
                    embed.addFields([
                        {
                            name: `Résultat du dé ${i + 1} :`,
                            value: `${result}`,
                            inline: true,
                        }
                    ]
                    );
                    // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                }
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embed]
                });
                // Dans le cas où on a entre 25 et 50 dés
            } else if (dice[0] <= 50) {
                let nbDice = Math.round(dice[0]);
                for (let i = 0; i <= 24; i++) {
                    let result = entierAleatoire(1, Math.round(dice[1]));
                    // embed.addFields(`Résultat du dé ${i + 1} :`, `${result}`);
                    embed.addFields([
                        {
                            name: `Résultat du dé ${i + 1} :`,
                            // value: `${result}`,
                            value: `test`,
                            inline: true,
                        }
                    ]
                    );
                    // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                }
                for (let j = 25; j < dice[0]; j++) {
                    let result = entierAleatoire(1, Math.round(dice[1]));
                    // embed2.addFields(`Résultat du dé ${j + 1} :`, `${result}`);
                    embed2.addFields([
                        {
                            name: `Résultat du dé ${j + 1} :`,
                            value: `${result}`,
                            inline: true,
                        }
                    ]
                    );
                    // message.channel.send(`Résultat du dé ${i + 1} de <@${message.author.id}> : \n${entierAleatoire(1, Math.round(dice[1]))}`);
                }
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embed, embed2]
                });
                // Dans le cas de plus de 50 dés, on ne lance pas
            } else {
                embed.setDescription('Merci de ne lancer que 50 dés maximum.');
                embed.setColor('#FF0000');
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
            embed.setTitle('Votre avatar est :');
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
                let avatar = new EmbedBuilder();
                avatar.setAuthor({
                    name: 'OctoBot',
                    iconURL: 'https://imgur.com/WQqHGze.png',
                });
                avatar.setColor('#09d2e1');
                avatar.setThumbnail('https://imgur.com/WQqHGze.png');
                avatar.setTimestamp();
                avatar.setTitle("Liste des avatars");
                avatar.addFields([
                    {
                        name: `${user.username}`,
                        value: `Avatar de ${user.username}`,
                    }
                ]
                );
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


})