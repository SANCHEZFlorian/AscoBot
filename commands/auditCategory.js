import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createErrorEmbed, Colors } from '../utils/embeds.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('auditcategory')
        .setDescription('Auditer les permissions d\'une catégorie et de ses salons.')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('La catégorie à analyser')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const category = interaction.options.getChannel('category');

        if (!category) {
            return interaction.editReply({ embeds: [createErrorEmbed('Catégorie introuvable.')] });
        }

        const children = interaction.guild.channels.cache.filter(c => c.parentId === category.id);

        if (children.size === 0) {
            return interaction.editReply({ embeds: [createErrorEmbed(`La catégorie **${category.name}** est vide.`)] });
        }

        let report = `📊 **Audit de la catégorie : ${category.name}**\n\n`;
        const embedFields = [];
        let useFile = false;

        // Analysis of the Category Channel itself
        let categoryReport = `**#${category.name} (Catégorie)**\n`;
        const catOverwrites = category.permissionOverwrites.cache;

        if (catOverwrites.size === 0) {
            categoryReport += `⚠️ Aucun overwrite spécifique sur la catégorie (Héritage global).\n`;
        } else {
            catOverwrites.forEach(overwrite => {
                const targetName = overwrite.type === 0
                    ? (interaction.guild.roles.cache.get(overwrite.id)?.name || `Rôle inconnu (${overwrite.id})`)
                    : (interaction.guild.members.cache.get(overwrite.id)?.user.tag || `Utilisateur inconnu (${overwrite.id})`);

                const allow = overwrite.allow.toArray();
                const deny = overwrite.deny.toArray();

                if (allow.length > 0 || deny.length > 0) {
                    categoryReport += `> **${overwrite.type === 0 ? '@' : '👤'}${targetName}** :\n`;
                    if (allow.length > 0) categoryReport += `> 🟢 Allow: ${allow.join(', ')}\n`;
                    if (deny.length > 0) categoryReport += `> 🔴 Deny: ${deny.join(', ')}\n`;
                }
            });
        }
        categoryReport += `\n`;
        report += categoryReport;

        if (categoryReport.length < 1024) {
            embedFields.push({
                name: `📂 Catégorie : ${category.name}`,
                value: categoryReport.substring(0, 1024)
            });
        }

        // sort by position
        const sortedChildren = children.sort((a, b) => a.position - b.position);

        sortedChildren.forEach(channel => {
            let channelReport = `**#${channel.name}** (${channel.type === ChannelType.GuildVoice ? 'Vocal' : 'Texte'})\n`;

            if (channel.permissionsLocked) {
                channelReport += `✅ Synchronisé avec la catégorie\n`;
            } else {
                const overwrites = channel.permissionOverwrites.cache;
                if (overwrites.size === 0) {
                    channelReport += `⚠️ Non synchronisé mais aucun overwrite spécifique (Héritage par défaut)\n`;
                } else {
                    overwrites.forEach(overwrite => {
                        // Determine type (Role or Member)
                        const targetName = overwrite.type === 0 // 0 for Role, 1 for Member
                            ? (interaction.guild.roles.cache.get(overwrite.id)?.name || `Rôle inconnu (${overwrite.id})`)
                            : (interaction.guild.members.cache.get(overwrite.id)?.user.tag || `Utilisateur inconnu (${overwrite.id})`);

                        const allow = overwrite.allow.toArray();
                        const deny = overwrite.deny.toArray();

                        if (allow.length > 0 || deny.length > 0) {
                            channelReport += `> **${overwrite.type === 0 ? '@' : '👤'}${targetName}** :\n`;
                            if (allow.length > 0) channelReport += `> 🟢 Allow: ${allow.join(', ')}\n`;
                            if (deny.length > 0) channelReport += `> 🔴 Deny: ${deny.join(', ')}\n`;
                        }
                    });
                }
            }
            channelReport += `\n`;

            if (report.length + channelReport.length < 2000) {
                // Keep creating text for file/summary
                report += channelReport; // We keep a master string for file fallback
            }

            // For Embed fields
            if (channelReport.length > 1024) {
                useFile = true;
            } else {
                embedFields.push({
                    name: `#${channel.name} ${channel.permissionsLocked ? '✅' : ''}`,
                    value: channelReport.substring(0, 1024)
                });
            }
        });

        // Check limits
        if (embedFields.length > 25 || report.length > 4000 || useFile || children.size > 25) {
            const buffer = Buffer.from(report, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `audit-${category.name}.txt` });

            const fileEmbed = new EmbedBuilder()
                .setTitle(`📊 Audit : ${category.name}`)
                .setDescription(`Le rapport est trop long pour être affiché ici. Veuillez consulter le fichier joint.`)
                .setColor(Colors.Success);

            await interaction.editReply({
                embeds: [fileEmbed],
                files: [attachment]
            });
        } else {
            const finalEmbed = new EmbedBuilder()
                .setTitle(`📊 Audit : ${category.name}`)
                .setColor(Colors.Success)
                .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                .setTimestamp();

            // Add fields
            embedFields.forEach(field => finalEmbed.addFields(field));

            await interaction.editReply({ embeds: [finalEmbed] });
        }
    }
};
