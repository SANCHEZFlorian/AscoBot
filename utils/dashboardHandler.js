import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder } from 'discord.js';
import { getDashboardHome, getDashboardMod, getDashboardReact, getDashboardLogs, getDashboardEngage } from './dashboardUI.js';
import pool from './db.js';
import { getLogChannelId, setLogChannelId } from './logManager.js';

// Cache temporaire pour stocker les mots-clés pendant la sélection des réactions
const reactCache = new Map();
// Cache temporaire pour stocker les descriptions d'autoroles
const autoroleDescCache = new Map();

export async function handleDashboardButton(interaction) {
    const id = interaction.customId;

    // --- NAVIGATION ---
    if (id.startsWith('nav_config_')) {
        const action = id.replace('nav_config_', '');
        if (action === 'close') return interaction.message.delete().catch(()=>{});
        
        let data = null;
        if (action === 'home') data = await getDashboardHome(interaction.guild);
        else if (action === 'mod') data = await getDashboardMod(interaction.guild);
        else if (action === 'react') data = await getDashboardReact(interaction.guild);
        else if (action === 'logs') data = await getDashboardLogs(interaction.guild);
        else if (action === 'engage') data = await getDashboardEngage(interaction.guild);
        
        if (data) await interaction.update(data);
        return;
    }

    // --- ACTIONS MODERATION ---
    if (id === 'btn_mod_spam') {
        const modal = new ModalBuilder().setCustomId('modal_mod_spam').setTitle('Régler l\'Anti-Spam');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('count').setLabel('Messages successifs tolérés').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 5')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timer').setLabel('Temps en secondes').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 3'))
        );
        return interaction.showModal(modal);
    }
    if (id === 'btn_mod_warns') {
        const modal = new ModalBuilder().setCustomId('modal_mod_warns').setTitle('Régler les Sanctions Auto');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick').setLabel('Warns avant d\'expulser (0=Désactivé)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 3')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban').setLabel('Warns avant bannissement (0=Désactivé)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 5'))
        );
        return interaction.showModal(modal);
    }
    if (id === 'btn_mod_addword') {
        const modal = new ModalBuilder().setCustomId('modal_mod_addword').setTitle('Ajouter un Mot Banni');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('word').setLabel('Le mot').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
    }
    if (id === 'btn_mod_delword') {
        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT word FROM banned_words WHERE guild_id = ?', [interaction.guildId]);
            conn.release();
            if (rows.length === 0) return interaction.reply({ content: '❌ Il n\'y a aucun mot banni à supprimer.', ephemeral: true });

            const options = rows.map(r => ({ label: r.word, value: r.word })).slice(0, 25);
            const select = new StringSelectMenuBuilder().setCustomId('sel_mod_delword').setPlaceholder('Choisis un mot à supprimer').addOptions(options);
            await interaction.reply({ content: 'Sélectionnez le mot à supprimer :', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
        } catch(e) {}
        return;
    }

    if (id === 'btn_react_add') {
        const modal = new ModalBuilder().setCustomId('modal_react_add_word').setTitle('Configuration Auto-Réaction');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('word').setLabel('Mot déclencheur').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
    }
    if (id === 'btn_react_reorder') {
        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT id, trigger_word, position FROM auto_reactions WHERE guild_id = ? ORDER BY position ASC, id ASC', [interaction.guildId]);
            conn.release();
            if (rows.length === 0) return interaction.reply({ content: '❌ Il n\'y a aucune auto-réaction à réorganiser.', ephemeral: true });

            const options = rows.map((r, i) => ({ label: `${i + 1}. ${r.trigger_word}`, value: r.id.toString() })).slice(0, 25);
            const select = new StringSelectMenuBuilder().setCustomId('sel_react_reorder').setPlaceholder('Choisis une réaction à déplacer').addOptions(options);
            await interaction.reply({ content: 'Sélectionnez la réaction que vous souhaitez faire monter ou descendre dans la liste de priorité :', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
        } catch(e) {}
        return;
    }

    if (id.startsWith('btn_react_move_')) {
        // ID Format: btn_react_move_up_REACTIONID or btn_react_move_down_REACTIONID
        const direction = id.includes('_up_') ? 'up' : 'down';
        const reactId = id.split('_').pop();

        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT id, position FROM auto_reactions WHERE guild_id = ? ORDER BY position ASC, id ASC', [interaction.guildId]);
            
            const index = rows.findIndex(r => r.id.toString() === reactId);
            if (index !== -1) {
                let targetIndex = direction === 'up' ? index - 1 : index + 1;
                
                if (targetIndex >= 0 && targetIndex < rows.length) {
                    const current = rows[index];
                    const target = rows[targetIndex];

                    // Swap positions
                    await conn.query('UPDATE auto_reactions SET position = ? WHERE id = ?', [target.position, current.id]);
                    await conn.query('UPDATE auto_reactions SET position = ? WHERE id = ?', [current.position, target.id]);
                    
                    await interaction.update(await getDashboardReact(interaction.guild));
                } else {
                    await interaction.reply({ content: "❌ Action impossible (déjà en haut ou en bas).", ephemeral: true });
                }
            }
            conn.release();
        } catch(e) { console.error(e); }
        return;
    }

    if (id === 'btn_react_del') {
        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT trigger_word FROM auto_reactions WHERE guild_id = ?', [interaction.guildId]);
            conn.release();
            if (rows.length === 0) return interaction.reply({ content: '❌ Il n\'y a aucune auto-réaction à supprimer.', ephemeral: true });

            const options = rows.map(r => ({ label: r.trigger_word, value: r.trigger_word })).slice(0, 25);
            const select = new StringSelectMenuBuilder().setCustomId('sel_react_del').setPlaceholder('Choisis un mot à supprimer').addOptions(options);
            await interaction.reply({ content: 'Sélectionnez le mot à supprimer :', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
        } catch(e) {}
        return;
    }

    if (id === 'btn_save_react_session') {
        const words = reactCache.get(interaction.user.id);
        if (!words || words.length === 0) {
            return interaction.reply({ content: '❌ Session expirée ou aucun mot trouvé. Veuillez recommencer.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Analyser les réactions directement sur le message de l'interaction
            const message = await interaction.channel.messages.fetch(interaction.message.id);
            const reactions = message.reactions.cache;
            
            if (reactions.size === 0) {
                return interaction.editReply({ content: '❌ Vous n\'avez ajouté aucun émoji sur le message ! Vraiment ?' });
            }

            const emojisArr = Array.from(reactions.values()).map(r => r.emoji.identifier);
            const emojisStr = emojisArr.join(' ');
            const emojisDisplay = Array.from(reactions.values()).map(r => r.emoji.toString()).join(' ');

            const conn = await pool.getConnection();
            for (const word of words) {
                const [ex] = await conn.query('SELECT id FROM auto_reactions WHERE guild_id=? AND trigger_word=?', [interaction.guildId, word]);
                if (ex.length > 0) {
                    await conn.query('UPDATE auto_reactions SET emojis=? WHERE id=?', [emojisStr, ex[0].id]);
                } else {
                    // Trouver la dernière position
                    const [last] = await conn.query('SELECT MAX(position) as maxPos FROM auto_reactions WHERE guild_id=?', [interaction.guildId]);
                    const nextPos = (last[0].maxPos || 0) + 1;
                    await conn.query('INSERT INTO auto_reactions (guild_id, trigger_word, emojis, position) VALUES (?, ?, ?, ?)', [interaction.guildId, word, emojisStr, nextPos]);
                }
            }
            conn.release();
            reactCache.delete(interaction.user.id);

            await interaction.message.delete().catch(()=>{});
            await interaction.editReply({ content: `✅ Parfait ! Réactions enregistrées pour : **${words.join(', ')}**\n${emojisDisplay}` });
            
        } catch (error) {
            console.error("Save react error", error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la récupération des réactions.' });
        }
        return;
    }

    // --- ACTIONS LOGS & WELCOME ---
    if (id === 'btn_logs_welcomeconfig') {
        const embed = new EmbedBuilder()
            .setTitle('👋 Configuration : Bienvenue & Départs')
            .setColor('#3498DB')
            .setDescription('**Comment souhaitez-vous organiser l\'accueil et les départs de vos membres ?**\n\n' +
                '• **🔄 Salon unique (Groupé) :** Les arrivées (carte image) et les départs seront publiés dans un seul et même salon.\n' +
                '• **🔀 Salons distincts (Séparé) :** Un salon dédié pour souhaiter la bienvenue publiquement aux arrivants, et un salon distinct pour la journalisation des départs / expulsions.')
            .setFooter({ text: 'Sélectionnez une option ci-dessous pour continuer' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_welcome_choice_single').setLabel('🔄 Regrouper (1 seul salon)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_welcome_choice_split').setLabel('🔀 Séparer (2 salons distincts)').setStyle(ButtonStyle.Success)
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (id === 'btn_welcome_choice_single') {
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('sel_welcome_single_channel')
            .setPlaceholder('Sélectionnez le salon pour arrivées & départs...')
            .setChannelTypes(ChannelType.GuildText);

        return interaction.update({
            content: '👉 **Sélectionnez ci-dessous le salon unique qui recevra les arrivées et les départs :**',
            embeds: [],
            components: [new ActionRowBuilder().addComponents(channelSelect)]
        });
    }

    if (id === 'btn_welcome_choice_split') {
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('sel_welcome_split_welcome_channel')
            .setPlaceholder('Sélectionnez le salon de Bienvenue / Arrivées...')
            .setChannelTypes(ChannelType.GuildText);

        return interaction.update({
            content: '👉 **Étape 1/2 :** Sélectionnez le salon public pour les **Messages de Bienvenue & Arrivées** (avec la carte image) :',
            embeds: [],
            components: [new ActionRowBuilder().addComponents(channelSelect)]
        });
    }

    if (id === 'btn_logs_captcharole') {
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('sel_logs_captcharole')
            .setPlaceholder('Sélectionnez le Rôle de Vérification Captcha');
        return interaction.reply({ 
            content: 'Sélectionnez ci-dessous le rôle qui sera attribué aux membres ayant réussi le Captcha à leur arrivée :', 
            components: [new ActionRowBuilder().addComponents(roleSelect)], 
            ephemeral: true 
        });
    }

    if (id === 'btn_logs_autodeploy') {
        await interaction.deferReply({ ephemeral: true });
        try {
            let logCat = interaction.guild.channels.cache.find(c => c.name === 'LOGS-ASCOBOT' && c.type === ChannelType.GuildCategory);
            if (!logCat) {
                logCat = await interaction.guild.channels.create({ name: 'LOGS-ASCOBOT', type: ChannelType.GuildCategory });
            }
            const logsToCreate = [
                { name: 'bienvenue', key: 'bienvenue' },
                { name: 'departs', key: 'departs' },
                { name: 'moderation', key: 'moderation' },
                { name: 'vocal', key: 'vocal' },
                { name: 'messages', key: 'messages' },
                { name: 'serveur', key: 'serveur' }
            ];

            for (const log of logsToCreate) {
                const newChannel = await interaction.guild.channels.create({
                    name: log.name,
                    type: ChannelType.GuildText,
                    parent: logCat.id
                });
                setLogChannelId(interaction.guildId, log.key, newChannel.id);
            }
            await interaction.editReply('✅ Tous les salons de logs et bienvenue ont été créés et associés !');
        } catch (error) {
            await interaction.editReply('❌ Erreur lors du déploiement (Permissions ?).');
        }
        return;
    }

    // --- ACTIONS ENGAGEMENT ---
    if (id === 'btn_eng_voice') {
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Créer un salon « Join to Create »')
            .setColor('#3498DB')
            .setDescription('Un **salon vocal master** sera créé à la racine du serveur.\n\nQuand un membre le rejoindra, un salon vocal temporaire lui sera automatiquement créé. Il disparaîtra quand tout le monde l\'aura quitté.\n\n⚠️ *Un seul salon master est nécessaire par serveur.*');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_eng_voice_confirm').setLabel('Confirmer la création').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId('nav_config_engage').setLabel('Annuler').setStyle(ButtonStyle.Secondary).setEmoji('◀')
        );
        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (id === 'btn_eng_voice_confirm') {
        await interaction.deferReply({ ephemeral: true });
        try {
            const masterChannel = await interaction.guild.channels.create({ name: '➕ Créer un salon', type: ChannelType.GuildVoice });
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO voice_masters (guild_id, channel_id) VALUES (?, ?)', [interaction.guildId, masterChannel.id]);
            conn.release();
            await interaction.editReply(`✅ **Salon Vocal Master créé avec succès !**\n🎙️ ${masterChannel} — Les membres peuvent le rejoindre pour créer leur propre salon.`);
        } catch(e) { await interaction.editReply('❌ Erreur lors de la création (permissions insuffisantes ?).'); }
        return;
    }

    if (id === 'btn_eng_ticket') {
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('sel_eng_ticket_channel')
            .setPlaceholder('Sélectionnez le salon pour le panneau de tickets…')
            .setChannelTypes(ChannelType.GuildText);

        return interaction.reply({
            content: '🎫 **Déployer un panneau de tickets**\n\n👉 Sélectionnez ci-dessous le salon dans lequel le panneau sera envoyé :\n\n*Les membres pourront cliquer sur les boutons pour ouvrir un ticket.*',
            components: [new ActionRowBuilder().addComponents(channelSelect)],
            ephemeral: true
        });
    }

    if (id === 'btn_eng_autorole') {
        const modal = new ModalBuilder().setCustomId('modal_eng_autorolecreate').setTitle('Créer un Panneau Auto-Rôle');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titre').setLabel('Titre du panneau').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Ex: 🎭 Choisissez vos Rôles')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Message d\'introduction').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Ex: Réagissez aux émojis ci-dessous pour obtenir vos rôles.'))
        );
        return interaction.showModal(modal);
    }

    if (id === 'btn_eng_autoroleadd') {
        try {
            const conn = await pool.getConnection();
            const [panels] = await conn.query(`
                SELECT channel_id, message_id, title FROM reaction_panels WHERE guild_id = ?
                UNION
                SELECT DISTINCT channel_id, message_id, 'Panneau Auto-Rôle' as title FROM reaction_roles WHERE guild_id = ?
            `, [interaction.guildId, interaction.guildId]);
            conn.release();

            const manualBtn = new ButtonBuilder()
                .setCustomId('btn_eng_autoroleadd_manual')
                .setLabel('Saisir l\'ID d\'un message existant')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔍');

            if (panels.length === 0) {
                const row = new ActionRowBuilder().addComponents(manualBtn);
                return interaction.reply({
                    content: '💡 **Aucun panneau auto-rôle n\'est encore enregistré en base de données.**\n\nSi vous avez déjà créé un panneau (ou si vous souhaitez configurer un message existant), cliquez ci-dessous pour renseigner son ID de message :',
                    components: [row],
                    ephemeral: true
                });
            }

            const options = panels.map((p, i) => {
                const channel = interaction.guild.channels.cache.get(p.channel_id);
                const channelName = channel ? `#${channel.name}` : `#salon`;
                return {
                    label: (p.title || `Panneau #${i + 1}`).substring(0, 100),
                    value: `${p.channel_id}_${p.message_id}`,
                    description: `${channelName} • ID: ...${p.message_id.slice(-6)}`.substring(0, 100)
                };
            }).slice(0, 25);

            const select = new StringSelectMenuBuilder()
                .setCustomId('sel_eng_autoroleadd_panel')
                .setPlaceholder('Sélectionnez le panneau auquel ajouter un rôle…')
                .addOptions(options);

            const rowSelect = new ActionRowBuilder().addComponents(select);
            const rowBtn = new ActionRowBuilder().addComponents(manualBtn);

            return interaction.reply({
                content: '🎯 **Quel panneau souhaitez-vous modifier ?**\nSélectionnez le panneau ci-dessous, ou saisissez directement l\'ID d\'un message :',
                components: [rowSelect, rowBtn],
                ephemeral: true
            });
        } catch(e) {
            console.error("Erreur listing panneaux :", e);
            return interaction.reply({ content: '❌ Erreur lors de la récupération des panneaux.', ephemeral: true });
        }
    }

    if (id.startsWith('btn_eng_autoroleadd_direct_')) {
        const parts = id.replace('btn_eng_autoroleadd_direct_', '').split('_');
        const channelId = parts[0];
        const msgId = parts[1];

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`sel_arr_role_pick_${channelId}_${msgId}`)
            .setPlaceholder('Sélectionnez le rôle à associer au panneau…');

        return interaction.reply({
            content: '👉 **Étape 1/2 :** Choisissez le rôle Discord à ajouter au panneau :',
            components: [new ActionRowBuilder().addComponents(roleSelect)],
            ephemeral: true
        });
    }

    if (id === 'btn_eng_autoroleadd_manual') {
        const modal = new ModalBuilder()
            .setCustomId('modal_eng_autoroleadd_manual')
            .setTitle('Associer un message existant');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg_id').setLabel('ID du Message du panneau').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'))
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('btn_arr_cancel_')) {
        await interaction.message.delete().catch(()=>{});
        return interaction.reply({ content: '❌ Configuration de l\'émoji annulée.', ephemeral: true });
    }

    if (id.startsWith('btn_arr_add_desc_')) {
        const parts = id.replace('btn_arr_add_desc_', '').split('_');
        const channelId = parts[0];
        const msgId = parts[1];
        const roleId = parts[2];

        const modal = new ModalBuilder()
            .setCustomId(`modal_arr_desc_${msgId}_${roleId}`)
            .setTitle('Description du rôle');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Description sous le rôle (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Ex: Pour être notifié des streams'))
        );
        return interaction.showModal(modal);
    }

    if (id === 'btn_eng_autoroledel') {
        try {
            const conn = await pool.getConnection();
            const [panels] = await conn.query('SELECT DISTINCT channel_id, message_id FROM reaction_roles WHERE guild_id = ?', [interaction.guildId]);
            conn.release();

            if (panels.length === 0) {
                return interaction.reply({ content: '❌ Aucun panneau auto-rôle n\'est configuré sur ce serveur.', ephemeral: true });
            }

            const options = panels.map((p, i) => ({
                label: `Panneau #${i + 1}`,
                value: `${p.channel_id}_${p.message_id}`,
                description: `Salon: #... • Message: ${p.message_id.slice(-6)}`
            })).slice(0, 25);

            const select = new StringSelectMenuBuilder()
                .setCustomId('sel_eng_autoroledel_panel')
                .setPlaceholder('Sélectionnez le panneau dont retirer un rôle…')
                .addOptions(options);

            return interaction.reply({
                content: '🗑️ **De quel panneau souhaitez-vous retirer un rôle ?**\nSélectionnez le panneau ci-dessous :',
                components: [new ActionRowBuilder().addComponents(select)],
                ephemeral: true
            });
        } catch(e) {
            console.error("Erreur listing panneaux :", e);
            return interaction.reply({ content: '❌ Erreur lors de la récupération des panneaux.', ephemeral: true });
        }
    }
}

export async function handleDashboardModal(interaction) {
    const id = interaction.customId;

    if (id === 'modal_mod_spam') {
        const c = interaction.fields.getTextInputValue('count');
        const t = interaction.fields.getTextInputValue('timer');
        try {
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO server_config (guild_id, spam_threshold, spam_timer_ms) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE spam_threshold=?, spam_timer_ms=?', 
                [interaction.guildId, parseInt(c), parseInt(t)*1000, parseInt(c), parseInt(t)*1000]);
            conn.release();
            const data = await getDashboardMod(interaction.guild);
            await interaction.update(data);
        } catch(e) {}
    }
    if (id === 'modal_mod_warns') {
        const kick = parseInt(interaction.fields.getTextInputValue('kick'));
        const ban = parseInt(interaction.fields.getTextInputValue('ban'));
        try {
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO server_config (guild_id, warn_kick_limit, warn_ban_limit) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE warn_kick_limit=?, warn_ban_limit=?', 
                [interaction.guildId, kick===0?null:kick, ban===0?null:ban, kick===0?null:kick, ban===0?null:ban]);
            conn.release();
            await interaction.update(await getDashboardMod(interaction.guild));
        } catch(e) {}
    }
    if (id === 'modal_mod_addword') {
        const word = interaction.fields.getTextInputValue('word').toLowerCase();
        try {
            const conn = await pool.getConnection();
            await conn.query('INSERT IGNORE INTO banned_words (guild_id, word) VALUES (?, ?)', [interaction.guildId, word]);
            conn.release();
            await interaction.update(await getDashboardMod(interaction.guild));
        } catch(e) {}
    }
    if (id === 'modal_react_add_word') {
        const input = interaction.fields.getTextInputValue('word');
        const words = input.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        
        if (words.length === 0) return interaction.reply({ content: '❌ Veuillez entrer au moins un mot.', ephemeral: true });
        
        // Stockage en cache pour la session
        reactCache.set(interaction.user.id, words);

        const embed = new EmbedBuilder()
            .setTitle('✨ Enregistrement d\'une Auto-Réaction')
            .setColor('#F1C40F')
            .setDescription(`**Mots déclencheurs :** ${words.map(w => `\`${w}\``).join(', ')}\n\nRéagissez à ce message avec **tous les émojis** que vous souhaitez associer à ces mots.\nUtilisez le clavier d'émojis Discord pour ajouter vos réactions, y compris les émojis personnalisés du serveur.\n\nUne fois terminé, cliquez sur le bouton ci-dessous pour sauvegarder.`)
            .setFooter({ text: '💡 Astuce : Vous pouvez ajouter plusieurs émojis, un seul sera choisi aléatoirement à chaque déclenchement.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`btn_save_react_session`).setLabel("J'ai réagi avec tous les émojis ✅").setStyle(ButtonStyle.Success)
        );

        return interaction.reply({ 
            embeds: [embed],
            components: [row],
            fetchReply: true
        });
    }

    if (id === 'modal_eng_autorolecreate') {
        const title = interaction.fields.getTextInputValue('titre') || '🎭 Choisissez vos Rôles';
        const desc = interaction.fields.getTextInputValue('desc') || 'Sélectionnez les rôles qui vous intéressent pour accéder aux salons associés ou personnaliser vos notifications.';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${desc}\n\n✨ **Réagissez avec l'émoji correspondant ci-dessous pour obtenir ou retirer un rôle !**\n\n*Aucun rôle n'a encore été ajouté. Utilisez « Ajouter Option Rôle » dans le dashboard.*`)
            .setColor('#5865F2')
            .setFooter({ text: 'AscoBot • Auto-Rôle Interactif', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const panelMsg = await interaction.channel.send({ embeds: [embed] });

        try {
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO reaction_panels (guild_id, channel_id, message_id, title) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
                [interaction.guildId, interaction.channel.id, panelMsg.id, title]);
            conn.release();
        } catch(e) {
            console.error("Erreur enregistrement panneau :", e);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_eng_autoroleadd_direct_${interaction.channel.id}_${panelMsg.id}`)
                .setLabel('Ajouter un premier rôle ➕')
                .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
            content: `✅ **Panneau Auto-Rôle créé avec succès dans ce salon !**\n\n🆔 **ID du message :** \`${panelMsg.id}\`\n[Aller au message](${panelMsg.url})\n\n👉 *Cliquez sur le bouton ci-dessous pour ajouter immédiatement un premier rôle :*`,
            components: [row],
            ephemeral: true
        });
    }

    if (id === 'modal_eng_autoroleadd_manual') {
        const msgId = interaction.fields.getTextInputValue('msg_id').trim();
        
        // Chercher le message dans les salons du serveur
        let targetChannel = null;
        let targetMsg = null;

        try {
            targetMsg = await interaction.channel.messages.fetch(msgId);
            if (targetMsg) targetChannel = interaction.channel;
        } catch(e) {}

        if (!targetMsg) {
            const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
            for (const [, ch] of textChannels) {
                try {
                    targetMsg = await ch.messages.fetch(msgId);
                    if (targetMsg) {
                        targetChannel = ch;
                        break;
                    }
                } catch(e) {}
            }
        }

        if (!targetMsg) {
            return interaction.reply({ content: `❌ Message \`${msgId}\` introuvable sur ce serveur. Assurez-vous d'avoir entré le bon ID de message.`, ephemeral: true });
        }

        // Sauvegarder dans reaction_panels pour les prochaines fois
        try {
            const panelTitle = targetMsg.embeds.length > 0 && targetMsg.embeds[0].title ? targetMsg.embeds[0].title : 'Panneau Auto-Rôle';
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO reaction_panels (guild_id, channel_id, message_id, title) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
                [interaction.guildId, targetChannel.id, msgId, panelTitle]);
            conn.release();
        } catch(e) {}

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`sel_arr_role_pick_${targetChannel.id}_${msgId}`)
            .setPlaceholder('Sélectionnez le rôle à associer…');

        return interaction.reply({
            content: `🎯 **Panneau associé dans <#${targetChannel.id}> !**\n\n👉 **Étape 1/2 :** Sélectionnez ci-dessous le rôle Discord à attribuer :`,
            components: [new ActionRowBuilder().addComponents(roleSelect)],
            ephemeral: true
        });
    }

    if (id.startsWith('modal_arr_desc_')) {
        const parts = id.replace('modal_arr_desc_', '').split('_');
        const msgId = parts[0];
        const roleId = parts[1];
        const desc = interaction.fields.getTextInputValue('desc')?.trim() || '';

        autoroleDescCache.set(`${msgId}_${roleId}`, desc);
        return interaction.reply({
            content: `📝 Description enregistrée : *« ${desc || 'Aucune'} »* !\n👉 Vous pouvez maintenant réagir au message avec l'émoji souhaité.`,
            ephemeral: true
        });
    }

    if (id.startsWith('modal_logs_set_')) {
        const type = id.replace('modal_logs_set_', '');
        const chId = interaction.fields.getTextInputValue('chid');
        try {
            setLogChannelId(interaction.guildId, type, chId);
            return interaction.reply({ content: `✅ Catégorie _${type}_ liée au salon <#${chId}>. Actualisez le dashboard !`, ephemeral: true });
        } catch(e) {}
    }
}

export async function updateReactionRoleMessage(guild, channelId, messageId) {
    try {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return false;
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return false;

        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ? ORDER BY id ASC', [guild.id, messageId]);
        conn.release();

        let baseTitle = '🎭 Choisissez vos Rôles';
        let baseDesc = 'Sélectionnez les rôles qui vous intéressent pour accéder aux salons associés ou personnaliser vos notifications.';

        if (message.embeds.length > 0 && message.embeds[0].title) {
            baseTitle = message.embeds[0].title;
        }

        const embed = new EmbedBuilder()
            .setTitle(baseTitle)
            .setColor('#5865F2')
            .setFooter({ text: 'AscoBot • Auto-Rôle Interactif', iconURL: guild.client.user.displayAvatarURL() })
            .setTimestamp();

        if (rows.length === 0) {
            embed.setDescription(`${baseDesc}\n\n*⚠️ Aucun rôle n'est encore configuré sur ce panneau. Ajoutez-en depuis le dashboard (/config).*`);
        } else {
            embed.setDescription(`${baseDesc}\n\n✨ **Réagissez avec l'émoji correspondant ci-dessous pour obtenir ou retirer un rôle !**\n\n` +
                rows.map(r => `${r.emoji}  •  <@&${r.role_id}> ${r.description ? `\n> *${r.description}*` : ''}`).join('\n\n')
            );
        }

        await message.edit({ embeds: [embed], components: [] });

        // Ajouter les réactions automatiquement
        for (const r of rows) {
            try {
                const customMatch = r.emoji.match(/<a?:.+?:(\d+)>/);
                const emojiToReact = customMatch ? customMatch[1] : r.emoji;
                await message.react(emojiToReact).catch(() => {});
            } catch (e) {}
        }

        return true;
    } catch (e) {
        console.error("Erreur updateReactionRoleMessage :", e);
        return false;
    }
}

export async function handleDashboardSelectMenu(interaction) {
    const id = interaction.customId;

    if (id === 'sel_logs_captcharole') {
        const roleId = interaction.values[0];
        try {
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO server_config (guild_id, captcha_role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE captcha_role_id=?', [interaction.guildId, roleId, roleId]);
            conn.release();
            await interaction.message.delete().catch(()=>{});
            await interaction.reply({ content: `✅ Rôle de vérification Captcha défini sur <@&${roleId}> !`, ephemeral: true });
        } catch (e) {
            console.error("Erreur save captcha role :", e);
            await interaction.reply({ content: `❌ Erreur BDD.`, ephemeral: true });
        }
        return;
    }

    if (id === 'sel_mod_delword') {
        const word = interaction.values[0];
        try {
            const conn = await pool.getConnection();
            await conn.query('DELETE FROM banned_words WHERE guild_id = ? AND word = ?', [interaction.guildId, word]);
            conn.release();
            await interaction.message.delete().catch(()=>{});
            await interaction.reply({ content: `✅ Mot supprimé ! Actualisez le dashboard.`, ephemeral: true });
        } catch(e) {}
    }

    if (id === 'sel_react_reorder') {
        const reactId = interaction.values[0];
        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT trigger_word FROM auto_reactions WHERE id = ?', [reactId]);
            conn.release();
            
            if (rows.length === 0) return interaction.reply({ content: 'Réaction introuvable.', ephemeral: true });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btn_react_move_up_${reactId}`).setLabel('🔼 Monter').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`btn_react_move_down_${reactId}`).setLabel('🔽 Descendre').setStyle(ButtonStyle.Primary)
            );

            await interaction.update({ 
                content: `Réorganisation de : **${rows[0].trigger_word}**\nUtilisez les boutons ci-dessous pour changer sa priorité dans la liste.`, 
                components: [row] 
            });
        } catch(e) {}
        return;
    }

    if (id === 'sel_react_del') {
        const word = interaction.values[0];
        try {
            const conn = await pool.getConnection();
            await conn.query('DELETE FROM auto_reactions WHERE guild_id = ? AND trigger_word = ?', [interaction.guildId, word]);
            conn.release();
            await interaction.message.delete().catch(()=>{});
            await interaction.reply({ content: `✅ Réaction supprimée ! Actualisez le dashboard.`, ephemeral: true });
        } catch(e) {}
    }

    if (id === 'sel_logs_channel') {
        const type = interaction.values[0];
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`sel_logs_channel_pick_${type}`)
            .setPlaceholder(`Sélectionnez le salon pour : ${type}`)
            .setChannelTypes(ChannelType.GuildText);

        return interaction.update({
            content: `👉 Sélectionnez ci-dessous le salon textuel à associer à la catégorie **${type}** :`,
            components: [new ActionRowBuilder().addComponents(channelSelect)]
        });
    }

    if (id.startsWith('sel_logs_channel_pick_')) {
        const type = id.replace('sel_logs_channel_pick_', '');
        const chId = interaction.values[0];
        setLogChannelId(interaction.guildId, type, chId);
        return interaction.update({
            content: `✅ Salon <#${chId}> associé avec succès à la catégorie **${type}** ! Actualisez le dashboard.`,
            components: []
        });
    }

    if (id === 'sel_welcome_single_channel') {
        const chId = interaction.values[0];
        setLogChannelId(interaction.guildId, 'bienvenue', chId);
        setLogChannelId(interaction.guildId, 'departs', chId);
        setLogChannelId(interaction.guildId, 'arrivees-departs', chId);

        return interaction.update({
            content: `✅ **Configuration enregistrée avec succès !**\nLes annonces d'arrivée et de départ seront publiées dans le salon unique <#${chId}>.\n*(Actualisez le dashboard pour voir les changements).*`,
            components: []
        });
    }

    if (id === 'sel_welcome_split_welcome_channel') {
        const welcomeChId = interaction.values[0];
        setLogChannelId(interaction.guildId, 'bienvenue', welcomeChId);

        const leaveSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`sel_welcome_split_leave_channel_${welcomeChId}`)
            .setPlaceholder('Sélectionnez le salon des Départs & Expulsions...')
            .setChannelTypes(ChannelType.GuildText);

        return interaction.update({
            content: `✅ Salon de bienvenue configuré sur <#${welcomeChId}> !\n\n👉 **Étape 2/2 :** Sélectionnez maintenant le salon pour les **Départs & Expulsions** :`,
            components: [new ActionRowBuilder().addComponents(leaveSelect)]
        });
    }

    if (id.startsWith('sel_welcome_split_leave_channel_')) {
        const welcomeChId = id.replace('sel_welcome_split_leave_channel_', '');
        const leaveChId = interaction.values[0];
        setLogChannelId(interaction.guildId, 'departs', leaveChId);

        return interaction.update({
            content: `✅ **Configuration terminée avec succès !**\n\n• **👋 Bienvenue & Arrivées :** <#${welcomeChId}>\n• **🔴 Départs & Expulsions :** <#${leaveChId}>\n\n*(Actualisez le dashboard pour voir les changements).*`,
            components: []
        });
    }

    if (id.startsWith('sel_arr_role_')) {
        // Format: sel_arr_role_CHANNELID_MESSAGEID_EMOJI_DESC
        const parts = id.split('_');
        const channelId = parts[3];
        const msgId = parts[4];
        const emojiStr = decodeURIComponent(parts[5]);
        const descStr = decodeURIComponent(parts[6] || '');
        const roleId = interaction.values[0];

        try {
            const role = interaction.guild.roles.cache.get(roleId);
            const roleName = role ? role.name : '';

            const conn = await pool.getConnection();
            await conn.query(`
                INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji, description, role_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), description = VALUES(description), role_name = VALUES(role_name)
            `, [interaction.guildId, channelId, msgId, roleId, emojiStr, descStr, roleName]);
            conn.release();

            await updateReactionRoleMessage(interaction.guild, channelId, msgId);

            return interaction.update({
                content: `✅ Le rôle <@&${roleId}> a été associé à l'émoji **${emojiStr}** sur le panneau !\nL'embed et la réaction ont été mis à jour sur le message.`,
                components: []
            });
        } catch (e) {
            console.error("Erreur association role :", e);
            return interaction.update({ content: `❌ Erreur lors de l'enregistrement du rôle.`, components: [] });
        }
    }

    if (id.startsWith('sel_arr_del_option_')) {
        const optionId = interaction.values[0];

        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT * FROM reaction_roles WHERE id = ?', [optionId]);
            if (rows.length > 0) {
                const opt = rows[0];
                await conn.query('DELETE FROM reaction_roles WHERE id = ?', [optionId]);
                conn.release();

                await updateReactionRoleMessage(interaction.guild, opt.channel_id, opt.message_id);

                return interaction.update({
                    content: `✅ L'option **${opt.emoji} <@&${opt.role_id}>** a été retirée du panneau !`,
                    components: []
                });
            } else {
                conn.release();
                return interaction.update({ content: `❌ Option introuvable ou déjà supprimée.`, components: [] });
            }
        } catch (e) {
            console.error("Erreur suppression option autorole :", e);
            return interaction.update({ content: `❌ Erreur lors de la suppression de l'option.`, components: [] });
        }
    }

    // --- SÉLECTION PANNEAU AUTO-RÔLE (AJOUT) ---
    if (id === 'sel_eng_autoroleadd_panel') {
        const [channelId, msgId] = interaction.values[0].split('_');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`sel_arr_role_pick_${channelId}_${msgId}`)
            .setPlaceholder('Sélectionnez le rôle à associer au panneau…');

        return interaction.update({
            content: '👉 **Étape 1/2 :** Choisissez le rôle Discord à ajouter au panneau :',
            components: [new ActionRowBuilder().addComponents(roleSelect)]
        });
    }

    // --- SÉLECTION DU RÔLE -> ATTRIBUTION DE L'ÉMOJI PAR RÉACTION ---
    if (id.startsWith('sel_arr_role_pick_')) {
        const parts = id.replace('sel_arr_role_pick_', '').split('_');
        const channelId = parts[0];
        const msgId = parts[1];
        const roleId = interaction.values[0];

        await interaction.update({
            content: `✅ Rôle <@&${roleId}> sélectionné !\n👉 Regardez ci-dessous dans ce salon pour lui attribuer son émoji.`,
            components: []
        });

        const embed = new EmbedBuilder()
            .setTitle('✨ Attribution d\'Émoji pour l\'Auto-Rôle')
            .setColor('#5865F2')
            .setDescription(`**Rôle :** <@&${roleId}>\n\n👉 **Réagissez à ce message avec l'émoji souhaité !**\nUtilisez le bouton de réaction Discord (➕😀) pour choisir n'importe quel émoji (standard ou personnalisé du serveur).\n\n*(Vous pouvez aussi ajouter une description via le bouton ci-dessous).*`)
            .setFooter({ text: 'Vous avez 60 secondes pour réagir avec un émoji' });

        const descBtn = new ButtonBuilder()
            .setCustomId(`btn_arr_add_desc_${channelId}_${msgId}_${roleId}`)
            .setLabel('Ajouter une description 📝')
            .setStyle(ButtonStyle.Secondary);

        const cancelBtn = new ButtonBuilder()
            .setCustomId(`btn_arr_cancel_${channelId}_${msgId}_${roleId}`)
            .setLabel('Annuler ❌')
            .setStyle(ButtonStyle.Danger);

        const promptMsg = await interaction.channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(descBtn, cancelBtn)]
        });

        const filter = (reaction, user) => user.id === interaction.user.id && !user.bot;
        const collector = promptMsg.createReactionCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async (reaction) => {
            const emojiStr = reaction.emoji.id 
                ? (reaction.emoji.animated ? `<a:${reaction.emoji.name}:${reaction.emoji.id}>` : `<:${reaction.emoji.name}:${reaction.emoji.id}>`)
                : reaction.emoji.name;

            const descStr = autoroleDescCache.get(`${msgId}_${roleId}`) || '';
            autoroleDescCache.delete(`${msgId}_${roleId}`);

            try {
                const role = interaction.guild.roles.cache.get(roleId);
                const roleName = role ? role.name : '';

                const conn = await pool.getConnection();
                await conn.query(`
                    INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji, description, role_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), description = VALUES(description), role_name = VALUES(role_name)
                `, [interaction.guildId, channelId, msgId, roleId, emojiStr, descStr, roleName]);
                conn.release();

                await updateReactionRoleMessage(interaction.guild, channelId, msgId);

                await promptMsg.edit({
                    content: `✅ **Succès !** Le rôle <@&${roleId}> a été associé à l'émoji **${emojiStr}** sur le panneau !\nL'émoji et l'embed ont été mis à jour sur le panneau.`,
                    embeds: [],
                    components: []
                });

                setTimeout(() => promptMsg.delete().catch(()=>{}), 6000);
            } catch(e) {
                console.error("Erreur enregistrement autorole par réaction :", e);
                await promptMsg.edit({ content: '❌ Erreur lors de l\'enregistrement du rôle.', embeds: [], components: [] });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await promptMsg.edit({
                    content: '⏱️ Temps écoulé (60s). Aucune réaction ajoutée, opération annulée.',
                    embeds: [],
                    components: []
                }).catch(()=>{});
                setTimeout(() => promptMsg.delete().catch(()=>{}), 5000);
            }
        });
        return;
    }

    // --- SÉLECTION PANNEAU AUTO-RÔLE (SUPPRESSION) ---
    if (id === 'sel_eng_autoroledel_panel') {
        const [channelId, msgId] = interaction.values[0].split('_');

        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ?', [interaction.guildId, msgId]);
            conn.release();

            if (rows.length === 0) {
                return interaction.update({ content: `❌ Aucun rôle n'est configuré sur ce panneau.`, components: [] });
            }

            const options = rows.map(r => ({
                label: `${r.emoji} ${r.role_name || r.role_id}`.substring(0, 100),
                value: r.id.toString(),
                description: (r.description || 'Sans description').substring(0, 100)
            })).slice(0, 25);

            const select = new StringSelectMenuBuilder()
                .setCustomId(`sel_arr_del_option_${msgId}`)
                .setPlaceholder('Choisissez le rôle à retirer du panneau…')
                .addOptions(options);

            return interaction.update({
                content: `🗑️ Sélectionnez le rôle à retirer du panneau dans <#${channelId}> :`,
                components: [new ActionRowBuilder().addComponents(select)]
            });
        } catch(e) {
            console.error("Erreur listing options :", e);
            return interaction.update({ content: `❌ Erreur lors de la récupération des rôles.`, components: [] });
        }
    }

    // --- DÉPLOIEMENT TICKETS DANS UN SALON CHOISI ---
    if (id === 'sel_eng_ticket_channel') {
        const channelId = interaction.values[0];

        try {
            const targetChannel = await interaction.guild.channels.fetch(channelId);

            const embed = new EmbedBuilder()
                .setTitle('🎫 Centre de Support')
                .setDescription('Besoin d\'aide ? Cliquez sur un bouton ci-dessous pour ouvrir un ticket.\nUn membre de l\'équipe vous répondra dès que possible.')
                .setColor('#2980B9')
                .setFooter({ text: 'AscoBot • Système de Tickets', iconURL: interaction.client.user.displayAvatarURL() });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_create_support').setLabel('Support').setStyle(ButtonStyle.Primary).setEmoji('🛠️'),
                new ButtonBuilder().setCustomId('ticket_create_question').setLabel('Question').setStyle(ButtonStyle.Secondary).setEmoji('❓')
            );

            await targetChannel.send({ embeds: [embed], components: [actionRow] });

            return interaction.update({
                content: `✅ **Panneau de tickets déployé avec succès dans <#${channelId}> !**\n\n*Les membres peuvent maintenant cliquer sur les boutons pour ouvrir un ticket.*`,
                components: []
            });
        } catch(e) {
            console.error("Erreur déploiement tickets :", e);
            return interaction.update({ content: `❌ Erreur lors du déploiement dans le salon sélectionné.`, components: [] });
        }
    }
}

