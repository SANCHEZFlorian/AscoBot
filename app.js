// =========================================================
//  Initialisation du bot
// =========================================================

// On importe les modules nécessaire
const Discord = require("discord.js");
const config = require("./config.json");
const intents = new Discord.IntentsBitField(70368744177655);
const { MessageEmbed, EmbedBuilder } = require("discord.js");
const loadCommands = require("./loader/loadCommands");
const loadEvent = require("./loader/loadEvents");

// Récupération de la config
const { prefix } = require("./config.json");

// Require du .env et config
const dotenv = require("dotenv");
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
});

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

// Regex pour vérifier la syntaxe de la commande du lancer de dé
let regexDice = /^[0-9]{0,2}[dD][0-9]+([\s]?\+[\s]?[0-9]+)?$/;

// =========================================================
//  Début du "vrai" code du bot
// =========================================================

client.on("messageCreate", async (message) => {
    // On écoute les messages commençant uniquement par le préfix et on découpe la commande
    if (!message.content.startsWith(prefix) || message.author.bot) return; // Si le message ne commence pas par le préfix ou que c'est un message du bot, ça ne lit pas
    const args = message.content.slice(prefix.length).trim().split(/ +/); // Prend le message, enlève le préfix, et mets chaque mot dans un tableau, en enlevant les espaces
    const command = args.shift().toLowerCase(); // Prend le premier élément du tableau, et le renvoie, tout en le supprimant. Permet de faire plusieurs suites de commande en un message

    console.log("commande : " + command);
    console.log("Arguments : " + args);



    // On créé l'embed du message et les paramètres principaux de l'embed (Auteur, couleur par défaut)
    // On en créé un deuxième pour le cas où on en a besoin de 2
    // On créé aussi l'embed de message d'erreur (avec la couleur rouge)
    const embed = new EmbedBuilder()
        // .setAuthor({
        //     name: message.author.username,
        //     iconURL: message.author.displayAvatarURL({
        //         format: "png",
        //         dynamic: true,
        //         size: 512,
        //     }),
        // })
        // .setTitle(client.commands.name) //! A vérifié pour affiche le nom de la commande
        .setColor("#09d2e1")
        // .setFooter({
        //     text: "OctoBot",
        //     iconURL: "https://imgur.com/WQqHGze.png",
        // })
        .setFooter({
            text: message.author.username,
            iconURL: message.author.displayAvatarURL({
                format: "png",
                dynamic: true,
                size: 512,
            }),
        })
        .setTimestamp();

    const embed2 = new EmbedBuilder()
        // .setAuthor({
        //     name: message.author.username,
        //     iconURL: message.author.displayAvatarURL({
        //         format: "png",
        //         dynamic: true,
        //         size: 512,
        //     }),
        // })
        //.setTitle(client.commands.name) //! A vérifié pour affiche le nom de la commande
        .setColor("#09d2e1")
        .setFooter({
            text: "OctoBot",
            iconURL: "https://imgur.com/WQqHGze.png",
        })
        .setTimestamp();

    // Embed de message d'erreur
    const embedError = new EmbedBuilder()
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({
                format: "png",
                dynamic: true,
                size: 512,
            }),
        })
        //.setTitle(client.commands.name) //! A vérifié pour affiche le nom de la commande
        .setColor("#FF0000")
        .setFooter({
            text: "OctoBot",
            iconURL: "https://imgur.com/WQqHGze.png",
        })
        .setTimestamp();



    //? Commandes à faire :
    //? - Truc de lui + lui = % amour
    //? - Création de salon+catégorie+Rôle pour équipe



    // Commande de base via le tuto https://www.youtube.com/playlist?list=PLCKgTe6DYNc60EiOlsnSNMhva6-zgr2MN
    // if (message.content === "!a ping") {
    //     return client.commands.get("ping").run(client, message);
    // }

    //! TEST de reply avec embed et pas juste message (style message.channel.reply ou message.reply)
    if (command === "test") {
        console.log('message.member.role : \n');
        console.log(message.member.roles);
        console.log('\nmessage.member.role.some : \n');
        if (
            message.member.roles.cache.some(
                (role) => role.id === "961322995987664986"
            )
        ) {
            console.log("rôle trouvé");
        } else {
            console.log("rôle NON trouvé");
        }

        // message.reply fait un "répondre au message"
        message.reply("test");
        // Tandis que le message.channel.send fait un "envoyer un message"
        message.channel.send("test");
    }

    if (command === "ping") { //* Ping, renvoie un pong
        embed.setTitle("Pong")
            .setDescription(`Ping : \`${client.ws.ping}ms\`	`);
        message.channel.send({
            embeds: [embed],
        });
    } else if (command === "help") { //* Help, renvoie les commandes du bot
        embed.setTitle("Liste des commandes :")
            .setDescription("Pour faire une commande, le préfix est : **!a** \n\n__Voici la liste des commandes disponibles :__")
            .addFields(
                {
                    name: "ping",
                    value: "Renvoie un ping",
                    inline: true,
                },
                {
                    name: "help",
                    value: "Renvoie la liste des commandes",
                    inline: true,
                },
                {
                    name: "boop",
                    value: "Renvoie un gif sur le thème \"Boop\"",
                    inline: true,
                },
                {
                    name: "ban",
                    value: "Renvoie un gif sur le thème \"Ban\"",
                    inline: true,
                },
                // {
                //     name: "serveur",
                //     value: "Renvoie les informations du serveur",
                //     inline: true,
                // },
                // {
                //     name: "user",
                //     value: "Renvoie les informations de l'utilisateur",
                //     inline: true,
                // },
                {
                    name: "1d10",
                    value: "Renvoie un dé aléatoire. Vous pouvez faire jusqu'à 50 dés, et au nombre de face illimités.\nLe premier chiffre est le nombre de dés.\nLe deuxième chiffre est le nombre de face",
                    inline: true,
                },
                {
                    name: "avatar",
                    value: "Renvoie l'avatar du membre envoyant le message.\nVous pouvez aussi mettre le nom d'un membre _(ou de plusieurs)_ pour avoir son avatar",
                    inline: true,
                },
            )

        message.channel.send({
            embeds: [embed],
        });
    } else if (command === "boop") { //* Beep, renvoie un boop
        // Lien des gif
        let gif = [
            "https://media.tenor.com/jP2rFh6WtswAAAAC/beep-boop-sox.gif",
            "https://media.tenor.com/yQpXLECQ0_sAAAAC/boop-nose-bopping.gif",
            "https://media.tenor.com/z6dqmhKFRbIAAAAC/beepboopbop-bmo.gif",
            "https://media.tenor.com/ejMJGr1p4LEAAAAC/boop-fox.gif",
            "https://media.tenor.com/_tvPZhgGWWMAAAAC/boop-cats.gif",
        ];
        // On choisi au hasard un gif
        let randomGif = gif[Math.floor(Math.random() * gif.length)];

        // // On créé l'embed
        // embed
        //     .setTitle("Boop")
        //     .setColor("#9214e9")
        //     .setImage(randomGif);

        // // On envoie l'embed
        // message.channel.send({
        //     embeds: [embed],
        // });

        if (!message.mentions.users.size) { // Si pas de mention, donne l'avatar de l'auteur
            embed
                .setTitle("Boop")
                .setColor("#9214e9")
                .setImage(randomGif);
            return message.channel.send({
                embeds: [embed],
            });
        } else if (message.mentions.users.size == 1) { // Si mention d'un seul membre
            message.mentions.users.forEach((user) => {
                embed
                    .setTitle("Boop")
                    .setColor("#9214e9")
                    .setImage(randomGif);
                return message.channel.send({
                    content: `<@${user.id}>`,
                    embeds: [embed],
                });
            });
        } else { // Si mention de plusieurs membres
            let usersMention;
            message.mentions.users.forEach((user) => {
                console.log("user : " + user)
                usersMention += "<@" + user.id + ">";
                console.log("usersMention : " + usersMention)

            });
            embed2
                .setTitle("Boop")
                .setColor("#9214e9")
                .setImage(randomGif);
            return message.channel.send({
                content: usersMention,
                embeds: [embed2],
            });


        }




    } else if (command === "ban") { //* Beep, renvoie un boop
        // Lien des gif
        let gif = [
            "https://media.tenor.com/DZxVzQzJwkgAAAAC/animated-stciker-sombra.gif",
            "https://media.tenor.com/TbfChfHKkOUAAAAC/ban-button.gif",
            "https://media.tenor.com/ai7K4FV5RiEAAAAC/among-us-ban.gif",
            "https://media.tenor.com/_rMM5ICPEukAAAAC/thor-strike.gif",
            "https://media.tenor.com/d0VNnBZkSUkAAAAC/bongocat-banhammer.gif",
            "https://media.tenor.com/PAUE9-M2AzgAAAAd/bolvar-ban-efe-sarpan.gif",
            "https://media.tenor.com/9zCgefg___cAAAAC/bane-no.gif",
            "https://media.tenor.com/gnXapwOEaTEAAAAC/spongebob-ban.gif",
        ];
        // On choisi au hasard un gif
        let randomGif = gif[Math.floor(Math.random() * gif.length)];

        // On créé l'embed
        embed
            // .setTitle("Ban")
            .setColor("#e7ea2e")
            .setImage(randomGif);

        // On envoie l'embed
        message.channel.send({
            embeds: [embed],
        });
    } else if (command === "serveur") { //* Serveur, renvoie les informations du serveur
        embed.setTitle('Voici les informations du serveur :')
        embed.addFields([
            {
                name: `Le nom de ce serveur est : `,
                value: `${message.guild.name}`,
            },
            {
                name: 'Nombre de membres :',
                value: message.guild.memberCount, //! A verifier si besoin du ${} et des backtick
                inline: true
            },
            {
                name: 'Serveur créé le :',
                value: message.guild.createdAt, //! A verifier si besoin du ${} et des backtick
                inline: true
            }
        ])
        message.channel.send({
            embeds: [embed],
        });
    } else if (command === "user") { //* User-info, renvoie des informations sur l'utilisateur (pseudo, tag, id)
        //? A voir pour rajouter la même chose que la commande "Avatar" pour donner les infos des gens mentionnés
        // Si pas de mention, donne l'avatar de l'auteur
        if (!message.mentions.users.size) {
            embed
                .setTitle("Voici vos informations :")
                .addFields([
                    {
                        name: 'Votre pseudo sur ce serveur :',
                        value: message.author.username,
                        inline: true
                    },
                    {
                        name: 'Votre DiscordTag :',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'Votre ID Discord :',
                        value: message.author.id,
                        inline: true
                    },
                    {
                        name: 'Vous avez créé ce compte le  :',
                        value: message.author.createdAt,
                        inline: true
                    },
                    {
                        name: 'Vos rôles sur ce serveur :',
                        value: message.member.roles.cache.get(),
                        inline: true
                    },
                    {
                        name: 'Votre avatar :',
                        value: message.member.nickname,
                    },
                    //? Voir pour rajouter la bio et le statut, la date de création du compte, rôle sur le serveur, bannière, voir aussi author.flag et member.nickname
                ])
                .setImage(
                    message.author.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                        size: 512,
                    })
                );
            return message.channel.send({
                embeds: [embed],
            });
        } else {
            // Si mention de membre(s), donne l'avatar du(des) membre(s)
            message.mentions.users.forEach((user) => {
                let avatar = new EmbedBuilder();
                avatar.setAuthor({
                    name: "OctoBot",
                    iconURL: "https://imgur.com/WQqHGze.png",
                });
                avatar.setColor("#09d2e1");
                avatar.setThumbnail("https://imgur.com/WQqHGze.png");
                avatar.setTimestamp();
                avatar.setTitle("Liste des avatars");
                avatar.addFields([
                    {
                        name: `${user.username}`,
                        value: `Avatar de ${user.username}`,
                    },
                ]);
                avatar.setImage(
                    user.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                        size: 512,
                    })
                );
                return message.channel.send({
                    embeds: [avatar],
                });
            });
        }

        embed.setDescription(
            `Pseudo sur ce serveur : ${message.author.username}\nDiscordTag : ${message.author.tag}\nID : ${message.author.id}`
        );
        message.channel.send({
            embeds: [embed],
        });
    } else if (command === "args-info") { //* Args-info, renvoie les arguments de la commande
        if (!args.length) {
            embed.setDescription(
                `Il n'y a pas d'argument dans cette commande, ${message.author}!`
            );
            return message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [embed],
            });
        }
        console.log('commande Args lancée');
        embed
            .setTitle(`Nom de la commande: ${command}`)
            .setDescription(`Arguments: ${args}`)
        message.channel.send({
            content: `<@${message.author.id}>`,
            embeds: [embed],
        });
    } else if (regexDice.test(command)) { //* XdY, renvoie X nombre aléatoire (chiffre avant le d) entre 1 et Y (le chiffre après d)
        //! Voir pour faire un "+ 10" qui permet de faire un plus 10 du dé. Ex : 1d10 + 1
        // On coupe en 2 les paramètres pour se retrouver avec le nombre de dé devant le "d" et le nombre de face après le "d"
        // Du coup, dice[0] = nombre de dé
        // Et dice [1] = nombre de face
        let dice = command.slice().split("d");


        //! TEST de dé + nombre
        // il faut que dans tout les cas (" + ", " +", "+ ", "+") sur args[1]
        // Peut être avec un contient ou autre
        if (args[0]) {
            console.log('Commande lancer de dé avec +');

            let nombreAjouter = args[0];
            message.channel.send(nombreAjouter);
        }
        // Alors, première solution, soit je fais à chaque fois des conditions de si y a un args alors je rajoute ou change
        // Soit, je fais un gros if en mode le premier si y a pas d'args et le deuixème y en a
        // Faudrait déjà tester avec la commands args-infos



        // Dans le cas où on a qu'un dé
        if (dice[0] == "" || dice[0] == 0 || dice[0] == 1) {
            let result = entierAleatoire(1, Math.round(dice[1]));
            // embed.addFields(`Résultat du dé :`, `${result}`);
            embed
                .setAuthor({
                    name: message.author.username,
                    iconURL: message.author.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                        size: 512,
                    }),
                })
                .addFields([
                    {
                        name: "Lancé de dé",
                        value: `Résultat du dé : ${result}`,
                    },
                ]);

            message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [embed],
            });
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
                        },
                    ]);
                }
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embed],
                });
                // Dans le cas où on a entre 25 et 50 dés
            } else if (dice[0] <= 50) {
                let nbDice = Math.round(dice[0]);
                for (let i = 0; i <= 24; i++) {
                    let result = entierAleatoire(1, Math.round(dice[1]));
                    embed.addFields([
                        {
                            name: `Dé ${i + 1} :`,
                            value: `${result}`,
                            inline: true,
                        },
                    ]);
                }
                for (let j = 25; j < dice[0]; j++) {
                    let result = entierAleatoire(1, Math.round(dice[1]));
                    embed2.addFields([
                        {
                            name: `Dé ${j + 1} :`,
                            value: `${result}`,
                            inline: true,
                        },
                    ]);
                }
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embed, embed2],
                });
                // Dans le cas de plus de 50 dés, on ne lance pas
            } else {
                embedError.setTitle("Merci de ne lancer que 50 dés maximum.");
                message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [embedError],
                });
            }
        }
    } else if (command === "avatar") { //* Avatar, renvoie l'avatar de l'utilisateur ou des utilisateurs mentionnés
        if (!message.mentions.users.size) { // Si pas de mention, donne l'avatar de l'auteur
            embed.setTitle("Voici votre avatar :");
            embed.setImage(
                message.author.displayAvatarURL({
                    format: "png",
                    dynamic: true,
                    size: 512,
                })
            );
            return message.channel.send({
                embeds: [embed],
            });
        } else if (message.mentions.users.size == 1) { // Si mention d'un seul membre
            message.mentions.users.forEach((user) => {
                embed.setTitle(`Avatar de ${user.username} :`);
                embed.setImage(
                    user.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                        size: 512,
                    })
                );
                return message.channel.send({
                    embeds: [embed],
                });
            });
        } else { // Si mention de plusieurs membres
            let embedDebut = new EmbedBuilder();
            embedDebut
                .setTitle("Liste des avatars :")
                .setAuthor({
                    name: message.author.username,
                    iconURL: message.author.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                        size: 512,
                    }),
                })
                .setColor("#09d2e1");

            message.channel.send({ embeds: [embedDebut] });
            // Si mention de membre(s), donne l'avatar du(des) membre(s)
            message.mentions.users.forEach((user) => {
                let avatar = new EmbedBuilder();
                avatar
                    .setColor("#09d2e1")
                    .setTimestamp()
                    .setTitle(`Avatar de ${user.username} :`)
                    .setImage(
                        user.displayAvatarURL({
                            format: "png",
                            dynamic: true,
                            size: 512,
                        })
                    )
                    .setFooter({
                        text: "OctoBot",
                        iconURL: "https://imgur.com/WQqHGze.png",
                    })
                    .setTimestamp();

                message.channel.send({
                    embeds: [avatar],
                });
            });
        }
    }
});
