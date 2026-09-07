import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import { getDashboardHome } from '../utils/dashboardUI.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Ouvre le panneau de contrôle interactif complet du bot.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const data = await getDashboardHome(interaction.guild);
        await interaction.reply({ ...data, ephemeral: true });
    }
};
