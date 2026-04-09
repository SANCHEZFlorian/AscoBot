import { SlashCommandBuilder, PermissionsBitField, ChannelType } from 'discord.js';
import { setLogChannelId } from '../utils/logManager.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Configure le système de logs du serveur.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto')
                .setDescription('Met en place automatiquement la catégorie complète de logs designée.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Définit manuellement un salon pour un type précis de logs.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Le type de logs que vous souhaitez configurer.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Messages (Modifiés/Supprimés)', value: 'messages' },
                            { name: 'Réactions (Ajoutées/Retirées)', value: 'reactions' },
                            { name: 'Arrivées & Départs', value: 'arrivees-departs' },
                            { name: 'Activité Vocale', value: 'vocal' },
                            { name: 'Membres (Pseudo/Boost/Timeout)', value: 'membre' },
                            { name: 'Threads & Forums', value: 'thread' },
                            { name: 'Salons & Catégories', value: 'salon' },
                            { name: 'Rôles', value: 'role' },
                            { name: 'Emojis & Stickers', value: 'emojis' },
                            { name: 'Modération (Ban/Unban/Kick)', value: 'moderation' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Le salon qui recevra ces logs.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'setup') {
            const logType = interaction.options.getString('type');
            const targetChannel = interaction.options.getChannel('channel');

            if (targetChannel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: "⚠️ Vous devez sélectionner un salon textuel !", ephemeral: true });
            }

            setLogChannelId(interaction.guild.id, logType, targetChannel.id);
            await interaction.reply({ content: `✅ Les logs de type **${logType}** seront envoyés dans <#${targetChannel.id}>.`, ephemeral: true });
        }

        else if (subCommand === 'auto') {
            await interaction.deferReply({ ephemeral: true });

            try {
                // Création de la catégorie de Logs
                const categoryName = 'Logs 〓〓〓〓〓〓〓〓〓〓〓〓〓〓';
                let logCategory = interaction.guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);

                if (!logCategory) {
                    logCategory = await interaction.guild.channels.create({
                        name: categoryName,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionsBitField.Flags.ViewChannel],
                            },
                        ],
                    });
                }

                const channelsToCreate = [
                    { type: 'messages', name: '💬║log-message' },
                    { type: 'reactions', name: '⭐║log-reaction' },
                    { type: 'arrivees-departs', name: '🚪║log-arrivee-depart' },
                    { type: 'vocal', name: '🎙️║log-vocal' },
                    { type: 'membre', name: '👤║log-membre' },
                    { type: 'thread', name: '🧵║log-thread' },
                    { type: 'salon', name: '🗂️║log-salon' },
                    { type: 'role', name: '🔰║log-role' },
                    { type: 'emojis', name: '🎭║log-emojis' },
                    { type: 'moderation', name: '🔨║log-moderation' }
                ];

                for (const ch of channelsToCreate) {
                    let channel = interaction.guild.channels.cache.find(c => c.name === ch.name && c.parentId === logCategory.id);
                    if (!channel) {
                        channel = await interaction.guild.channels.create({
                            name: ch.name,
                            type: ChannelType.GuildText,
                            parent: logCategory.id,
                        });
                    }
                    setLogChannelId(interaction.guild.id, ch.type, channel.id);
                }

                await interaction.editReply(`✅ Configuration terminée ! La catégorie **${categoryName}** a été créée avec l'ensemble des salons de tracking logs !`);
            } catch (error) {
                console.error("Erreur lors de la création automatique des logs :", error);
                await interaction.editReply("❌ Une erreur est survenue lors de la création des salons. Vérifiez si j'ai bien les permissions de gérer les salons.");
            }
        }
    }
};
