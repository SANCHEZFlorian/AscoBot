import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const command = {
    data: new SlashCommandBuilder()
        .setName('changelog')
        .setDescription('Affiche les derniers changements du bot'),
    async execute(interaction) {
        try {
            const changelogPath = path.resolve(__dirname, '../changelog.md');
            let content = await fs.readFile(changelogPath, 'utf8');

            // On limite la taille pour l'embed Discord (4096 car. max pour description)
            if (content.length > 4000) {
                content = content.substring(0, 4000) + '... (Changelog trop long, voir le fichier directement)';
            }

            const embed = new EmbedBuilder()
                .setTitle('📜 Historique des Changements')
                .setColor('#2F3136')
                .setDescription(content || 'Aucun changement enregistré.')
                .setTimestamp()
                .setFooter({ text: 'AscoBot Update System', iconURL: interaction.client.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lecture changelog:', error);
            await interaction.reply({ content: 'Impossible de lire le changelog pour le moment.', ephemeral: true });
        }
    }
};
