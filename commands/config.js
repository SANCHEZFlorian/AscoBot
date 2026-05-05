import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Ouvre le panneau de contrôle interactif complet du bot.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Accueil Configuration AscoBot')
            .setDescription('Bienvenue sur votre Dashboard central. Utilisez les boutons ci-dessous pour naviguer dans les options de configuration de votre serveur.')
            .setColor('#2B2D31')
            .addFields(
                { name: '🛡️ Modération', value: 'Anti-Spam, Paliers de Sanctions, Mots Bannis.', inline: true },
                { name: '✨ Auto-Réactions', value: 'Émojis automatiques sur certains mots.', inline: true },
                { name: '📋 Logs & Welcome', value: 'Salons de pointage et cartes de bienvenue.', inline: true },
                { name: '🚀 Engagement', value: 'Tickets, Autoroles et Vocaux dynamiques.', inline: true }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('nav_config_mod').setLabel('Modération').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('nav_config_react').setLabel('Auto-Réactions').setStyle(ButtonStyle.Primary).setEmoji('✨'),
            new ButtonBuilder().setCustomId('nav_config_logs').setLabel('Logs & Welcome').setStyle(ButtonStyle.Primary).setEmoji('📋'),
            new ButtonBuilder().setCustomId('nav_config_engage').setLabel('Engagement').setStyle(ButtonStyle.Primary).setEmoji('🚀'),
            new ButtonBuilder().setCustomId('nav_config_close').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('❌')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
