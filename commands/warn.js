import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } from 'discord.js';
import pool from '../utils/db.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Système complet de gestion des avertissements (warns).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Met un avertissement à un utilisateur.')
                .addUserOption(option => option.setName('cible').setDescription('L\'utilisateur à avertir.').setRequired(true))
                .addStringOption(option => option.setName('raison').setDescription('La raison de l\'avertissement.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retire un avertissement spécifique.')
                .addIntegerOption(option => option.setName('id').setDescription('L\'ID du warn à retirer.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste les avertissements d\'un utilisateur.')
                .addUserOption(option => option.setName('cible').setDescription('L\'utilisateur.').setRequired(true))
        ),

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'add') {
            const target = interaction.options.getUser('cible');
            const reason = interaction.options.getString('raison');

            if (target.bot) {
                return interaction.reply({ content: "❌ Vous ne pouvez pas avertir un bot.", ephemeral: true });
            }

            try {
                const connection = await pool.getConnection();
                await connection.query(
                    'INSERT INTO warns (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
                    [target.id, interaction.guildId, interaction.user.id, reason]
                );

                // Fetch current active warn count
                const [rows] = await connection.query(
                    'SELECT COUNT(*) as count FROM warns WHERE user_id = ? AND guild_id = ?',
                    [target.id, interaction.guildId]
                );
                const warnCount = rows[0].count;

                // Check limits in config
                const [configRows] = await connection.query('SELECT * FROM server_config WHERE guild_id = ?', [interaction.guildId]);
                let actionTaken = 'Aucune action supplémentaire.';
                if (configRows.length > 0) {
                    const config = configRows[0];
                    if (config.warn_ban_limit && warnCount >= config.warn_ban_limit) {
                        try {
                            await interaction.guild.members.ban(target, { reason: `Auto-Ban: Trop d'avertissements (${warnCount})` });
                            actionTaken = '🔨 Utilisateur banni automatiquement (limite atteinte).';
                        } catch (e) {
                            actionTaken = '⚠️ Utilisateur devrait être banni, mais je manque de permissions.';
                        }
                    } else if (config.warn_kick_limit && warnCount == config.warn_kick_limit) {
                        try {
                            const member = await interaction.guild.members.fetch(target.id);
                            await member.kick(`Auto-Kick: Trop d'avertissements (${warnCount})`);
                            actionTaken = '👢 Utilisateur expulsé automatiquement (limite atteinte).';
                        } catch (e) {
                            actionTaken = '⚠️ Utilisateur devrait être expulsé, mais je manque de permissions (ou est introuvable).';
                        }
                    }
                }
                connection.release();

                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Avertissement Ajouté')
                    .setColor('#E74C3C')
                    .setDescription(`<@${target.id}> a reçu un avertissement.`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Avertissements actuels', value: `${warnCount}` },
                        { name: 'Action', value: actionTaken }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                // Note : il serait bien d'envoyer le log aussi au setup log.  
                
                try {
                    await target.send(`⚠️ Vous avez reçu un avertissement sur le serveur **${interaction.guild.name}**.\n**Raison :** ${reason}`);
                } catch(e) {} // Can't DM user
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Erreur lors de l\'ajout du warn en BDD.', ephemeral: true });
            }
        }

        else if (subCommand === 'remove') {
            const warnId = interaction.options.getInteger('id');
            try {
                const connection = await pool.getConnection();
                const [result] = await connection.query('DELETE FROM warns WHERE id = ? AND guild_id = ?', [warnId, interaction.guildId]);
                connection.release();

                if (result.affectedRows === 0) {
                    return interaction.reply({ content: `❌ Aucun avertissement trouvé avec l'ID \`${warnId}\`.`, ephemeral: true });
                }

                await interaction.reply({ content: `✅ L'avertissement \`#${warnId}\` a été supprimé avec succès.`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Erreur base de données.', ephemeral: true });
            }
        }

        else if (subCommand === 'list') {
            const target = interaction.options.getUser('cible');
            try {
                const connection = await pool.getConnection();
                const [rows] = await connection.query(
                    'SELECT id, moderator_id, reason, created_at FROM warns WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
                    [target.id, interaction.guildId]
                );
                connection.release();

                const embed = new EmbedBuilder()
                    .setTitle(`📋 Avertissements de ${target.tag}`)
                    .setColor('#F1C40F')
                    .setThumbnail(target.displayAvatarURL());

                if (rows.length === 0) {
                    embed.setDescription("Cet utilisateur n'a aucun avertissement actif.");
                } else {
                    embed.setDescription(`Nombre total : **${rows.length}**`);
                    // Discord limits to 25 fields
                    const recentWarns = rows.slice(0, 24);
                    recentWarns.forEach(warn => {
                        embed.addFields({
                            name: `ID: ${warn.id} | Le ${new Date(warn.created_at).toLocaleDateString('fr-FR')}`,
                            value: `Par: <@${warn.moderator_id}>\nRaison: ${warn.reason}`
                        });
                    });
                }
                
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Erreur base de données.', ephemeral: true });
            }
        }
    }
};
