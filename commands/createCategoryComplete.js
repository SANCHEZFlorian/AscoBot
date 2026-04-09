import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    RoleSelectMenuBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../utils/embeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const command = {
    data: new SlashCommandBuilder()
        .setName('createcategorycomplete')
        .setDescription('Créer une catégorie complète via un template Universel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // 1. Select Template
        const templatesDir = path.join(__dirname, '../templatesCategory');
        if (!fs.existsSync(templatesDir)) return interaction.reply({ embeds: [createErrorEmbed('Dossier templates vide.')], ephemeral: true });

        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
        if (files.length === 0) return interaction.reply({ embeds: [createErrorEmbed('Aucun template trouvé.')], ephemeral: true });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('template_select')
            .setPlaceholder('Choisir un template')
            .addOptions(files.slice(0, 25).map(f => ({ label: f, value: f }))); // Simple label

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const response = await interaction.reply({
            embeds: [createInfoEmbed('Choisissez un modèle :')],
            components: [row],
            ephemeral: true
        });

        // 2. Collector
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

        collector.on('collect', async i => {
            const fileName = i.values[0];
            const filePath = path.join(templatesDir, fileName);
            let template;
            try {
                template = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                return i.reply({ embeds: [createErrorEmbed('JSON Template invalide.')], ephemeral: true });
            }

            // check format
            if (!template.roles_config) {
                // Legacy support or Error?
                // Let's fail gracefully for now or support legacy later.
                // We assume V3 format.
                return i.reply({ embeds: [createErrorEmbed('Format de template V3 requis (`roles_config`).')], ephemeral: true });
            }

            // 3. Scan for INPUTs needed
            const inputRoles = template.roles_config.filter(r => r.type === 'INPUT');

            // If inputs needed, we need Role Selectors.
            // Discord allows 5 rows.
            // Step 2.5: Ask for Input Roles (if any)

            if (inputRoles.length > 0) {
                // Show role selectors
                // We can't put multiple RoleSelectMenus in one row? No, 1 per row.
                // Limit to 5 inputs?
                if (inputRoles.length > 5) {
                    return i.reply({ embeds: [createErrorEmbed('Trop de rôles INPUT demandés (>5). Non supporté pour le moment.')], ephemeral: true });
                }

                const rows = inputRoles.map(r => {
                    return new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`input_role_${r.id}`) // Encoded ID
                            .setPlaceholder(r.label || `Choisir rôle pour ${r.id}`)
                            .setMinValues(1)
                            .setMaxValues(1)
                    );
                });

                // Send Selectors and wait
                // We need a button to "Confirm" after selecting?
                // OR we store selections in a temporary collector?
                // Select Menus don't submit all at once.
                // Best flow:
                // Show Selectors + "Next" Button.
                // Store selections in state.

                const btnNext = new ButtonBuilder().setCustomId('next_step').setLabel('Suivant').setStyle(ButtonStyle.Primary);
                rows.push(new ActionRowBuilder().addComponents(btnNext));

                const selectionMsg = await i.reply({
                    embeds: [createInfoEmbed('Veuillez sélectionner les rôles existants requis :')],
                    components: rows,
                    ephemeral: true,
                    fetchReply: true
                });

                const roleCollector = selectionMsg.createMessageComponentCollector({ time: 120000 });
                const selectedInputs = {};

                roleCollector.on('collect', async c => {
                    if (c.customId === 'next_step') {
                        // Check if all filled
                        const missing = inputRoles.some(r => !selectedInputs[r.id]);
                        if (missing) {
                            return c.reply({ content: 'Veuillez sélectionner tous les rôles requis avant de continuer.', ephemeral: true });
                        }
                        // Proceed to Modal
                        // Pass selectedInputs to next step (encode in modal ID or custom handling)
                        // We will call a helper function
                        await createFromTemplate(c, template, selectedInputs);
                        roleCollector.stop();
                    } else if (c.customId.startsWith('input_role_')) {
                        const roleid = c.values[0];
                        const placeholder = c.customId.replace('input_role_', '');
                        selectedInputs[placeholder] = roleid;
                        await c.deferUpdate(); // Quiet update
                    }
                });

            } else {
                // No inputs, go straight to Modal
                await createFromTemplate(i, template, {});
            }
        });
    }
};

async function createFromTemplate(interaction, template, inputRoleMap) {
    // Show Modal for Variables
    const modal = new ModalBuilder()
        .setCustomId('modal_create_final')
        .setTitle('Variables du Template');

    const rows = [];

    // Always Cat Name
    if (template.variables && template.variables.categoryNamePlaceholder) {
        rows.push(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('catName')
                .setLabel('Nom de la Catégorie')
                .setPlaceholder('Ex: Karmine Corp')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        ));
    }

    // Prefix if needed
    if (template.variables && template.variables.prefixPlaceholder) {
        rows.push(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('prefix')
                .setLabel('Préfixe des Rôles')
                .setPlaceholder('Ex: KC')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        ));
    }

    modal.addComponents(rows);

    await interaction.showModal(modal);

    try {
        const submission = await interaction.awaitModalSubmit({ time: 60000 });
        await submission.deferReply({ ephemeral: false });

        const catNameComponent = submission.fields.fields.get('catName');
        const catName = catNameComponent ? catNameComponent.value : 'Category';

        const prefixComponent = submission.fields.fields.get('prefix');
        const prefix = prefixComponent ? prefixComponent.value : '';

        // --- EXECUTION ---
        const guild = interaction.guild;
        const roleMap = {}; // Placeholder -> Real ID
        let createdLog = '';

        // 1. Process Roles Config
        if (template.roles_config) {
            for (const conf of template.roles_config) {
                if (conf.type === 'DYNAMIC') {
                    // Create
                    const name = conf.namePattern.replace('{{PREFIX}}', prefix);
                    try {
                        const r = await guild.roles.create({
                            name: name,
                            color: conf.color || 'Default',
                            hoist: conf.hoist || false,
                            permissions: conf.permissions ? BigInt(conf.permissions) : undefined,
                            reason: `Template V3: ${catName}`
                        });
                        roleMap[conf.id] = r.id;
                        createdLog += `✨ ${r.name}\n`;
                    } catch (e) {
                        console.error(e);
                    }
                } else if (conf.type === 'INPUT') {
                    // Use input
                    const id = inputRoleMap[conf.id];
                    if (id) roleMap[conf.id] = id;
                } else if (conf.type === 'STATIC') {
                    // Use static ID (if configured?)
                    // Current V3 plan says "Garde cet ID précis".
                    // So we use conf.staticId (which I stored in wizard)
                    // Wait, in wizard I stored staticId? Yes.
                    if (conf.staticId) roleMap[conf.id] = conf.staticId;
                }
            }
        }

        // 2. Resolve Overwrites Helper
        const resolveOverwrites = (overwrites) => {
            const res = [];
            for (const ow of overwrites) {
                let id = ow.role;
                if (roleMap[id]) id = roleMap[id];
                else if (id === '@everyone') id = guild.id;
                else if (id.startsWith('{{')) continue; // Unresolved placeholder

                // Check if valid snowflake
                // If not, skip

                const allow = ow.allow.map(p => PermissionFlagsBits[p]).filter(x => x);
                const deny = ow.deny.map(p => PermissionFlagsBits[p]).filter(x => x);

                res.push({ id, allow, deny });
            }
            return res;
        };

        // 3. Create Category
        // Replace {{CAT_NAME}}
        const finalCatName = template.structure.categoryName.replace('{{CAT_NAME}}', catName);

        const category = await guild.channels.create({
            name: finalCatName,
            type: ChannelType.GuildCategory,
            permissionOverwrites: resolveOverwrites(template.structure.categoryPermissions)
        });

        // 4. Create Channels
        const channelTypeMap = {
            'GUILD_TEXT': ChannelType.GuildText,
            'GUILD_VOICE': ChannelType.GuildVoice,
            'GUILD_ANNOUNCEMENT': ChannelType.GuildAnnouncement,
            'GUILD_STAGE_VOICE': ChannelType.GuildStageVoice,
            'GUILD_FORUM': ChannelType.GuildForum
        };

        let channelCount = 0;
        for (const c of template.structure.channels) {
            const cName = c.name.replace('{{CAT_NAME}}', catName); // Assuming simple replace
            const type = channelTypeMap[c.type] || ChannelType.GuildText;

            await guild.channels.create({
                name: cName,
                type: type,
                parent: category.id,
                permissionOverwrites: resolveOverwrites(c.overwrites)
            });
            channelCount++;
        }

        await submission.editReply({
            embeds: [createSuccessEmbed(`✅ **${finalCatName} créée !**\n\nSalons : ${channelCount}\nRôles : \n${createdLog}`)]
        });

    } catch (e) {
        console.error(e);
        // interaction might be replied
    }
}
