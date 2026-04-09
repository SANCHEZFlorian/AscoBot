import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, AttachmentBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('exportcategory')
        .setDescription('Exporter la structure d\'une catégorie en JSON (Template Intelligent).')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('La catégorie à exporter')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('current_prefix')
                .setDescription('Le préfixe actuel des rôles (ex: KC) pour la détection automatique.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const category = interaction.options.getChannel('category');
        const prefix = interaction.options.getString('current_prefix');

        if (!category) {
            return interaction.editReply({ embeds: [createErrorEmbed('Catégorie introuvable.')] });
        }

        const children = interaction.guild.channels.cache.filter(c => c.parentId === category.id);
        const sortedChildren = children.sort((a, b) => a.position - b.position);

        // --- Role Detection & Placeholder Logic ---
        const roleMap = new Map(); // Real ID -> Placeholder
        const rolesDefinition = []; // Array for JSON

        // Helper to process a Role ID
        const processRole = (roleId) => {
            if (roleMap.has(roleId)) return; // Already processed
            if (roleId === interaction.guild.id) return; // Ignore @everyone handle later

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return; // Role deleted or unknown

            let placeholder;

            // Case A: Role matches prefix (Team Role)
            if (prefix && role.name.startsWith(prefix)) {
                // Generate name pattern: "KC_Joueur" -> "{PREFIX}_Joueur"
                const namePattern = role.name.replace(prefix, '{PREFIX}');
                const rawName = role.name.replace(prefix, '').replace(/^[-_ ]+/, '').toUpperCase(); // "Joueur"
                placeholder = `{{ROLE_${rawName}}}`;

                rolesDefinition.push({
                    id: placeholder,
                    namePattern: namePattern,
                    color: role.hexColor === '#000000' ? 'Default' : role.hexColor,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield.toString()
                });
            }
            // Case B: External Role
            else {
                // Sanitize name for placeholder
                const safeName = role.name.replace(/[^a-zA-Z0-9]/g, '_');
                placeholder = `{{EXISTING_ROLE_${safeName}}}`;
                // We do NOT add to rolesDefinition, as it's an existing role to be mapped manually or ignored
            }

            roleMap.set(roleId, placeholder);
        };

        // Scan all overwrites to find roles
        const scanOverwrites = (overwrites) => {
            overwrites.cache.forEach(ow => {
                if (ow.type === 0) { // Role
                    processRole(ow.id);
                }
            });
        };

        // Scan Category
        scanOverwrites(category.permissionOverwrites);
        // Scan Children
        children.forEach(c => scanOverwrites(c.permissionOverwrites));


        // --- Formatting Output ---
        const formatOverwrites = (overwrites) => {
            const formatted = [];
            overwrites.cache.forEach(overwrite => {
                let id = overwrite.id;

                // Resolve ID to Placeholder
                if (overwrite.type === 0) {
                    if (id === interaction.guild.id) {
                        id = '@everyone';
                    } else if (roleMap.has(id)) {
                        id = roleMap.get(id); // Use the placeholder
                    } else {
                        // Fallback for roles found in overwrites but somehow missed in scan (unlikely) or just raw ID
                        const role = interaction.guild.roles.cache.get(id);
                        const name = role ? role.name : id;
                        id = `{{EXISTING_ROLE_${name.replace(/[^a-zA-Z0-9]/g, '_')}}}`;
                    }
                } else {
                    // Member overwrite?
                    const member = interaction.guild.members.cache.get(id);
                    id = member ? `USER:${member.user.tag}` : `USER:${id}`;
                }

                const allow = overwrite.allow.toArray();
                const deny = overwrite.deny.toArray();

                if (allow.length > 0 || deny.length > 0) {
                    formatted.push({
                        role: id,
                        allow: allow,
                        deny: deny
                    });
                }
            });
            return formatted;
        };

        const channelTypeMap = {
            [ChannelType.GuildText]: 'GUILD_TEXT',
            [ChannelType.GuildVoice]: 'GUILD_VOICE',
            [ChannelType.GuildAnnouncement]: 'GUILD_ANNOUNCEMENT',
            [ChannelType.GuildStageVoice]: 'GUILD_STAGE_VOICE',
            [ChannelType.GuildForum]: 'GUILD_FORUM',
            [ChannelType.GuildMedia]: 'GUILD_MEDIA'
        };

        // Generate Category Name Pattern
        let categoryNamePattern = category.name;
        if (prefix && categoryNamePattern.includes(prefix)) {
            // Try to be smart about replacing prefix in category name too?
            // User didn't explicitly ask, but "KC Team" -> "{PREFIX} Team" seems logical?
            // Requirements said: "La structure complète... en utilisant les placeholders".
            // Let's replace the prefix text if found in category name with {{TEAM_NAME}} logic?
            // Actually, usually category name is "Team Name".
            // Let's stick to safe behavior: leave category name static or let user edit JSON.
            // BUT, if the user provided a prefix, chances are the category name might contain the team name.
            // Let's just create a generic name for now or keep original.
            // Requirement 2.3 only mentioned Structure.
        }

        const exportData = {
            meta: {
                templateId: `export_${Date.now()}`,
                displayName: `Export ${category.name}`,
                description: `Export généré automatiquement depuis ${category.name}`
            },
            roles_definition: rolesDefinition,
            structure: {
                categoryName: category.name, // User can edit to {{TEAM_NAME}} manually
                categoryPermissions: formatOverwrites(category.permissionOverwrites),
                channels: sortedChildren.map(channel => ({
                    name: channel.name,
                    type: channelTypeMap[channel.type] || `UNKNOWN_${channel.type}`,
                    overwrites: formatOverwrites(channel.permissionOverwrites)
                }))
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const buffer = Buffer.from(jsonString, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `template-${category.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json` });

        // Summary Statistics
        const roleCount = rolesDefinition.length;
        const externalCount = Array.from(roleMap.values()).filter(v => v.includes('EXISTING_ROLE')).length;

        await interaction.editReply({
            embeds: [createSuccessEmbed(`📂 **Export Intelligent terminé !**\n\n**Rôles dynamiques détectés :** ${roleCount}\n**Rôles externes identifiés :** ${externalCount}\n\nLe fichier JSON est prêt à l'emploi.`)],
            files: [attachment]
        });
    }
};
