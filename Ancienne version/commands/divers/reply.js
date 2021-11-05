const {
    Command,
} = require('discord.js-commando');

module.exports = class ReplyCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reply',
            memberName: 'reply',
            group: 'divers',
            description: 'Reply.',
            clientPermissions: ['SEND_MESSAGES'], // le bot doit avoir la permission d'envoyer des messages
            throttling: {
                usages: 2,
                duration: 10,
            },
            args: [{
                key: 'text',
                prompt: 'Quel texte voulez-vous que le bot répondre ?',
                type: 'string',
                validate: question => { // Valideur
                    if (question.length < 101 && question.length > 11) return true; // Si, alors continué (grâce à return true qui arrête le valideur)
                    return 'La question doit avoir au minimum 10 caractères, et maximum 100.'; // Sinon, cela return cela
                },
            }, ],
        });
    }

    async run(msg, {
        text,
    }) {
        msg.say('Votre texte est: ${text}');
    }
};