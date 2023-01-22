const fs = require('fs');

module.exports = async client => {

    fs.readdirSync('./events').filter(f => f.endsWith('.js')).forEach(async file => {

        let events = require(`../events/${file}`);
        client.on(file.split('.js').join(''), events.bind(null, client))
        console.log(`${file} succès`);
    });
}