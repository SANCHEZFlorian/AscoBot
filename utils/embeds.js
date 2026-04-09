import { EmbedBuilder } from 'discord.js';

export const Colors = {
    Success: 0x00FF00, // Green
    Error: 0xFF0000,   // Red
    Info: 0x0099FF     // Blue
};

export function createSuccessEmbed(description) {
    return new EmbedBuilder()
        .setTitle('✅ Succès')
        .setDescription(description)
        .setColor(Colors.Success);
}

export function createErrorEmbed(description) {
    return new EmbedBuilder()
        .setTitle('🔴 Erreur')
        .setDescription(description)
        .setColor(Colors.Error);
}

export function createInfoEmbed(description) {
    return new EmbedBuilder()
        .setTitle('ℹ️ Information')
        .setDescription(description)
        .setColor(Colors.Info);
}
