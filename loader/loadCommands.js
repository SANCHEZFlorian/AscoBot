const fs = require('fs');

module.exports = async client => {
    // // On récupère toutes les commandes
    // const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    // // On boucle sur les commandes
    // for (const file of commandFiles) {
    //     // On récupère les commandes
    //     const command = require(`../commands

    fs.readdirSync('./commands').filter(f => f.endsWith('.js')).forEach(async file => {
        let command = require(`../commands/${file}`);
        if (!command.name || typeof command.name !== 'string') {
            throw new TypeError(`La commande ${file} n'a pas de nom`);
        }
        client.commands.set(command.name, command);
        console.log(`${file} succès`);
    });

}