// =========================================================
//  Initialisation du bot
// =========================================================

// On importe les modules nécessaire
const Discord = require("discord.js");
const config = require("./config.json");
const intents = new Discord.IntentsBitField(3276799);
const { MessageEmbed, EmbedBuilder } = require("discord.js");
const loadCommands = require("./loader/loadCommands");

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

// =========================================================
//  Début du "vrai" code du bot
// =========================================================

client.on("messageCreate", async (message) => {
    // On écoute les messages commençant uniquement par le préfix et on découpe la commande
    if (!message.content.startsWith(prefix) || message.author.bot) return; // Si le message ne commence pas par le préfix ou que c'est un message du bot, ça ne lit pas
    const args = message.content.slice(prefix.length).trim().split(/ +/); // Prend le message, enlève le préfix, et mets chaque mot dans un tableau, en enlevant les espaces
    const command = args.shift().toLowerCase(); // Prend le premier élément du tableau, et le renvoie, tout en le supprimant. Permet de faire plusieurs suites de commande en un message

    // On créé l'embed du message et les paramètres principaux de l'embed (Auteur, couleur par défaut)
    // On en créé un deuxième pour le cas où on en a besoin de 2
    // On créé aussi l'embed de message d'erreur (avec la couleur rouge)
    const embed = new EmbedBuilder()
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({
                format: "png",
                dynamic: true,
                size: 512,
            }),
        })
        // .setTitle(client.commands.get('name')) //! A vérifié pour affiche le nom de la commande
        .setColor("#09d2e1")
        .setFooter({
            text: "OctoBot",
            iconURL: "https://imgur.com/WQqHGze.png",
        })
        .setTimestamp();

    const embed2 = new EmbedBuilder()
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({
                format: "png",
                dynamic: true,
                size: 512,
            }),
        })
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
    if (message.content === "!a ping") {
        return client.commands.get("ping").run(client, message);
    }

    //! TEST de reply avec embed et pas juste message (style message.channel.reply ou message.reply)
    if (command === "test") {
        // message.reply fait un "répondre au message"
        message.reply("test");
        // Tandis que le message.channel.send fait un "envoyer un message"
        message.channel.send("test");
    }

    if (command === "pingpong") { //* Ping, renvoie un pong
        console.log(message.member.roles);
        if (
            message.member.roles.cache.some(
                (role) => role.id === "961322995987664986"
            )
        ) {
            console.log("rôle trouvé");
        } else {
            console.log("rôle NON trouvé");
        }
        embed.setDescription("Pong");
        message.channel.send({
            embeds: [embed],
        });
        //message.channel.send('Pong');
    } else if (command === "beep") { //* Beep, renvoie un boop
        embed.setDescription("Boop");
        embed.addFields([
            {
                name: "Test",
                value: "Boop",
            },
        ]);
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
    } else if (hasNumber(command) && command.includes("d")) { //* XdY, renvoie X nombre aléatoire (chiffre avant le d) entre 1 et Y (le chiffre après d)
        //! Voir pour faire un "+ 10" qui permet de faire un plus 10 du dé. Ex : 1d10 + 1 
        // On coupe en 2 les paramètres pour se retrouver avec le nombre de dé devant le "d" et le nombre de face après le "d"
        // Du coup, dice[0] = nombre de dé
        // Et dice [1] = nombre de face
        let dice = command.slice().split("d");


        //! TEST de dé + nombre
        // il faut que dans tout les cas (" + ", " +", "+ ", "+") sur args[1]
        // Peut être avec un contient ou autre
        if (args[0]) {
            console.log('Commande lancée de dé avec +');

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
            embed.addFields([
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
        // Si pas de mention, donne l'avatar de l'auteur
        if (!message.mentions.users.size) {
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
        } else {
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
                    // .setAuthor({
                    //     name: "OctoBot",
                    //     iconURL: "https://imgur.com/WQqHGze.png",
                    // })
                    .setColor("#09d2e1")
                    // avatar.setThumbnail('https://imgur.com/WQqHGze.png');
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
