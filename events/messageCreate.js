import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const prefix = config.prefix || '!';

export const event = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = message.client.commands.get(commandName);

        // Special handling for Dice regex (e.g. !1d20)
        const regexDice = /^[0-9]{0,2}[dD][0-9]+([\s]?\+[\s]?[0-9]+)?$/;

        if (!command && regexDice.test(commandName)) {
            command = message.client.commands.get('roll');
            if (command) {
                // Inject the commandName (e.g. "1d20") back into args for the roll command
                args.unshift(commandName);
            }
        }

        if (!command) return;

        // --- Mock Interaction for Hybrid Support ---
        const interaction = {
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client: message.client,
            formattedArgs: args,

            // Methods to mimic Interaction
            reply: async (payload) => {
                const content = typeof payload === 'string' ? payload : payload.content;
                const embeds = typeof payload === 'object' ? payload.embeds : [];
                const files = typeof payload === 'object' ? payload.files : [];
                return message.reply({ content, embeds, files });
            },
            followUp: async (payload) => {
                const content = typeof payload === 'string' ? payload : payload.content;
                return message.channel.send({ content });
            },
            // Options getter mock
            options: {
                getString: (name) => {
                    // Specific logic for roll command to get the full expression
                    if (command.data.name === 'roll') {
                        return args.join(' ');
                    }
                    return args[0] || null;
                },
                getInteger: (name) => parseInt(args[0]) || null,
                getUser: (name) => message.mentions.users.first() || null,
                getMember: (name) => message.mentions.members.first() || null,
            }
        };

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await message.reply('There was an error while executing this command!');
        }
    },
};