import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        const isProd = process.env.NODE_ENV === 'production';
        const TOKEN = isProd ? process.env.PROD_TOKEN : process.env.DEV_TOKEN;

        const rest = new REST({ version: '10' }).setToken(TOKEN);

        try {
            const commandsForRest = client.commandsForRest || [];
            console.log(`Started refreshing ${commandsForRest.length} application (/) commands.`);

            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commandsForRest },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    },
};

