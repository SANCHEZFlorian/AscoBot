import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    EmbedBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed, Colors } from '../utils/embeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const command = {
    data: new SlashCommandBuilder()
        .setName('createtemplatefromcategory')
        .setDescription('Générer un template Universel (Wizard Interactif).')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('La catégorie modèle à analyser')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const category = interaction.options.getChannel('category');

        // 1. Initial Scan
        const roleSet = new Set();
        const scan = (c) => {
            c.permissionOverwrites.cache.forEach(ow => {
                if (ow.type === 0 && ow.id !== interaction.guild.id) { // Role & Not Everyone
                    roleSet.add(ow.id);
                }
            });
        };
        scan(category);
        category.children.cache.forEach(c => scan(c));

        // Filter out managed roles/bots if possible?
        // For now, keep all found roles but let user ignore them.
        const rolesFound = [];
        for (const id of roleSet) {
            const r = interaction.guild.roles.cache.get(id);
            if (r) rolesFound.push(r);
        }

        if (rolesFound.length === 0) {
            return interaction.reply({ embeds: [createErrorEmbed('Aucun rôle spécifique trouvé dans cette catégorie.')], ephemeral: true });
        }

        // 2. Step 1: Variable Definition (Modal)
        // We need to show a Modal. Modals must be response to interaction.
        // We can show it directly.
        const modal = new ModalBuilder()
            .setCustomId(`wizard_init_${category.id}`)
            .setTitle('Configuration Initiale');

        const catNameInput = new TextInputBuilder()
            .setCustomId('catVariable')
            .setLabel("Variable dans le Nom Catégorie")
            .setPlaceholder(`Ex: Pour "${category.name}", tapez "SHONEN"`)
            .setValue(category.name) // Default to full name
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const fileNameInput = new TextInputBuilder()
            .setCustomId('fileName')
            .setLabel("Nom du fichier de sortie")
            .setPlaceholder("template_universel")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(catNameInput);
        const row2 = new ActionRowBuilder().addComponents(fileNameInput);
        modal.addComponents(row1, row2);

        await interaction.showModal(modal);
    },

    async handleModal(interaction) {
        // Handle Step 1 Modal
        if (interaction.customId.startsWith('wizard_init_')) {
            const categoryId = interaction.customId.split('_')[2];
            const category = interaction.guild.channels.cache.get(categoryId);

            if (!category) return interaction.reply({ embeds: [createErrorEmbed('Catégorie introuvable.')], ephemeral: true });

            const catVariable = interaction.fields.getTextInputValue('catVariable');
            const fileName = interaction.fields.getTextInputValue('fileName').replace('.json', '');

            // Re-scan roles (clean state)
            const roleSet = new Set();
            const scan = (c) => {
                c.permissionOverwrites.cache.forEach(ow => {
                    if (ow.type === 0 && ow.id !== interaction.guild.id) roleSet.add(ow.id);
                });
            };
            scan(category);
            category.children.cache.forEach(c => scan(c));

            const rolesToProcess = Array.from(roleSet).map(id => interaction.guild.roles.cache.get(id)).filter(r => r);

            // Wizard State
            const state = {
                category,
                catVariable,
                fileName,
                rolesToProcess,
                currentRoleIndex: 0,
                rolesConfig: [],
                interaction: interaction // Keep reference if needed, but we used modal so we need to reply/defer
            };

            await interaction.deferReply({ ephemeral: true });
            await this.processNextRole(state, interaction);
        }
        else if (interaction.customId.startsWith('wizard_dynamic_')) {
            // Handle Step 2 DYNAMIC Modal
            // We need to access state.
            // In a real persistent bot we'd use a DB or Map.
            // Here, we can encode state in CustomID? Too large.
            // We must use a temporary cache or similar.
            // Since this is a one-shot process, let's use a module-level Map for active wizards?
            // Risk of leaks if not cleaned.
            // Or we just use the Collector's scope if we stay within one collector?
            // But Modal breaks collector scope if we leave it?
            // Actually, `awaitModalSubmit` is better for local flow!
        }
    },

    // Helper for Wizard Logic
    async processNextRole(state, interactionOrUpdate) {
        // Check if done
        if (state.currentRoleIndex >= state.rolesToProcess.length) {
            return this.finishWizard(state, interactionOrUpdate);
        }

        const role = state.rolesToProcess[state.currentRoleIndex];

        // Define buttons
        const btnDynamic = new ButtonBuilder().setCustomId('type_dynamic').setLabel('DYNAMIQUE (Créer)').setStyle(ButtonStyle.Primary).setEmoji('✨');
        const btnInput = new ButtonBuilder().setCustomId('type_input').setLabel('INPUT (Demander)').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️');
        const btnStatic = new ButtonBuilder().setCustomId('type_static').setLabel('STATIQUE (Garder)').setStyle(ButtonStyle.Secondary).setEmoji('🔒');
        const btnIgnore = new ButtonBuilder().setCustomId('type_ignore').setLabel('IGNORER').setStyle(ButtonStyle.Danger).setEmoji('🗑️');

        const row = new ActionRowBuilder().addComponents(btnDynamic, btnInput, btnStatic, btnIgnore);

        const embed = new EmbedBuilder()
            .setTitle(`Configuration Rôle ${state.currentRoleIndex + 1}/${state.rolesToProcess.length}`)
            .setDescription(`**Rôle :** ${role} (\`${role.name}\`)\n\n**Que faire avec ce rôle ?**\n\n` +
                `✨ **DYNAMIQUE** : Sera recréé avec un préfixe (ex: \`{{PREFIX}}_${role.name}\`).\n` +
                `🙋‍♂️ **INPUT** : L'utilisateur devra choisir un rôle existant (ex: Fan).\n` +
                `🔒 **STATIQUE** : Garde cet ID précis (ex: Admin).\n` +
                `🗑️ **IGNORER** : Retire ce rôle des permissions.`)
            .setColor(role.hexColor);

        // Edit or Reply?
        let response;
        if (interactionOrUpdate.replied || interactionOrUpdate.deferred) {
            response = await interactionOrUpdate.editReply({ embeds: [embed], components: [row] });
        } else {
            // Should not happen with defer
            response = await interactionOrUpdate.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // Create Collector for this step
        try {
            const confirmation = await response.awaitMessageComponent({ componentType: ComponentType.Button, time: 60000 });

            if (confirmation.customId === 'type_dynamic') {
                // Ask for Pattern (Modal)
                const modal = new ModalBuilder()
                    .setCustomId(`modal_dynamic_${role.id}`)
                    .setTitle('Config Dynamique');

                const patternInput = new TextInputBuilder()
                    .setCustomId('pattern')
                    .setLabel('Pattern de Nom')
                    // Default guess: replace detected variable? Or just {{PREFIX}}_Name
                    .setValue(`{{PREFIX}}_${role.name}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(patternInput));

                await confirmation.showModal(modal);
                const submission = await confirmation.awaitModalSubmit({ time: 60000 });

                const pattern = submission.fields.getTextInputValue('pattern');

                state.rolesConfig.push({
                    id: `{{ROLE_${state.currentRoleIndex}}}`,
                    originalId: role.id, // For map
                    originalName: role.name,
                    type: 'DYNAMIC',
                    namePattern: pattern,
                    color: role.hexColor === '#000000' ? 'Default' : role.hexColor,
                    permissions: role.permissions.bitfield.toString(),
                    hoist: role.hoist
                });

                await submission.deferUpdate(); // Acknowledge modal
                state.currentRoleIndex++;
                return this.processNextRole(state, submission); // Pass submission to edit reply

            } else if (confirmation.customId === 'type_input') {
                // Ask for Question Label
                const modal = new ModalBuilder()
                    .setCustomId(`modal_input_${role.id}`)
                    .setTitle('Config Input');

                const labelInput = new TextInputBuilder()
                    .setCustomId('label')
                    .setLabel('Question posée à l\'utilisateur')
                    .setValue(`Quel est le rôle ${role.name} ?`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(labelInput));

                await confirmation.showModal(modal);
                const submission = await confirmation.awaitModalSubmit({ time: 60000 });

                const label = submission.fields.getTextInputValue('label');

                state.rolesConfig.push({
                    id: `{{ROLE_${state.currentRoleIndex}}}`,
                    originalId: role.id,
                    type: 'INPUT',
                    label: label
                });

                await submission.deferUpdate();
                state.currentRoleIndex++;
                return this.processNextRole(state, submission);

            } else if (confirmation.customId === 'type_static') {
                state.rolesConfig.push({
                    id: role.id, // Keep ID directly? Or placeholder mapped to ID?
                    // User Req: "Garde l'ID du rôle tel quel"
                    // If we keep ID, we don't need placeholder mapping for this one?
                    // BUT for consistency in structure, should we use placeholder?
                    // "structure... en remplaçant les IDs réels par des placeholders mappés vers roles_config"
                    // IF type is STATIC, we can use placeholder {{ROLE_X}} and map it to Real ID in consumer.
                    // This allows clean structure.
                    // Let's use placeholder.
                    id: `{{ROLE_${state.currentRoleIndex}}}`,
                    originalId: role.id,
                    type: 'STATIC',
                    staticId: role.id
                });

                await confirmation.deferUpdate();
                state.currentRoleIndex++;
                return this.processNextRole(state, confirmation);

            } else if (confirmation.customId === 'type_ignore') {
                // Do not add to config
                // We will need to filter this ID out of structure
                state.rolesConfig.push({
                    originalId: role.id,
                    type: 'IGNORE'
                });

                await confirmation.deferUpdate();
                state.currentRoleIndex++;
                return this.processNextRole(state, confirmation);
            }

        } catch (e) {
            console.error(e);
            await interactionOrUpdate.editReply({ embeds: [createErrorEmbed('Temps écoulé ou erreur !')], components: [] });
        }
    },

    async finishWizard(state, interactionOrUpdate) {
        const { category, catVariable, fileName, rolesConfig } = state;

        // Build Maps
        const roleIdToPlaceholder = new Map();
        rolesConfig.forEach(conf => {
            if (conf.type !== 'IGNORE') {
                roleIdToPlaceholder.set(conf.originalId, conf.id);
            } else {
                roleIdToPlaceholder.set(conf.originalId, null); // Mark for removal
            }
        });

        // Structure Building
        const formatOverwrites = (overwrites) => {
            const formatted = [];
            overwrites.cache.forEach(ow => {
                let id = ow.id;
                if (ow.type === 0) { // Role
                    if (id === category.guild.id) {
                        id = '@everyone';
                    } else if (roleIdToPlaceholder.has(id)) {
                        const placeholder = roleIdToPlaceholder.get(id);
                        if (!placeholder) return; // IGNORE
                        id = placeholder;
                    } else {
                        // Unknown role (maybe created during wizard?)
                        // Treat as external/static by default?
                        const r = category.guild.roles.cache.get(id);
                        id = r ? `{{EXISTING_ROLE_${r.name.replace(/[^a-zA-Z0-9]/g, '_')}}}` : id;
                    }
                } else { // Member
                    const m = category.guild.members.cache.get(id);
                    id = m ? `USER:${m.user.tag}` : `USER:${id}`;
                }

                const allow = ow.allow.toArray();
                const deny = ow.deny.toArray();

                if (allow.length > 0 || deny.length > 0) {
                    formatted.push({
                        role: id, allow, deny
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
            [ChannelType.GuildForum]: 'GUILD_FORUM'
        };

        // Name Replacement
        const replaceCatName = (str) => {
            if (str.includes(catVariable)) return str.replace(catVariable, '{{CAT_NAME}}');
            return str;
        };
        // For channels, do we replace prefixes? User said "Variable dans le Nom Catégorie".
        // And "Le bot remplace ce texte par {{CAT_NAME}}".
        // What about role prefixes in channel names?
        // User didn't specify for channel names in V3 request details, but logic implies universatility.
        // Let's stick to replacing `catVariable` with `{{CAT_NAME}}` everywhere.
        // And if we have dynamic roles with `{{PREFIX}}`, maybe we should replace PREFIX in channel names too?
        // But we don't know the "Prefix" value (it wasn't asked in V3 init).
        // V3 Init: "Quel texte... est la variable ? (ex: Admin)".
        // So we only replace that variable.

        const children = category.guild.channels.cache.filter(c => c.parentId === category.id);
        const sortedChildren = children.sort((a, b) => a.position - b.position);

        const template = {
            meta: {
                displayName: `Template ${catVariable}`,
                description: `Généré le ${new Date().toLocaleDateString()}`
            },
            variables: {
                categoryNamePlaceholder: "{{CAT_NAME}}",
                // prefixPlaceholder: "{{PREFIX}}" // Only if we used it in patterns?
                // We add it if any role pattern uses {{PREFIX}}
            },
            roles_config: rolesConfig.filter(c => c.type !== 'IGNORE').map(c => {
                // Clean up internal keys
                const { originalId, originalName, ...rest } = c;
                return rest;
            }),
            structure: {
                categoryName: replaceCatName(category.name),
                categoryPermissions: formatOverwrites(category.permissionOverwrites),
                channels: sortedChildren.map(c => ({
                    name: replaceCatName(c.name),
                    type: channelTypeMap[c.type] || 'GUILD_TEXT',
                    overwrites: formatOverwrites(c.permissionOverwrites)
                }))
            }
        };

        // Check if prefix is used
        const usesPrefix = rolesConfig.some(c => c.namePattern && c.namePattern.includes('{{PREFIX}}'));
        if (usesPrefix) {
            template.variables.prefixPlaceholder = "{{PREFIX}}";
        }

        // Save
        const templatesDir = path.join(__dirname, '../templatesCategory');
        if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir);

        const filePath = path.join(templatesDir, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));

        await interactionOrUpdate.editReply({
            embeds: [createSuccessEmbed(`✅ **Template Universel Sauvegardé !**\n\n📁 \`${fileName}.json\`\n✨ Rôles configurés : ${rolesConfig.length}`)],
            components: []
        });
    }
};
