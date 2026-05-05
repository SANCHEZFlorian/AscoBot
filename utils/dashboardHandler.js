import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder, RoleSelectMenuBuilder } from 'discord.js';
import { getDashboardHome, getDashboardMod, getDashboardReact, getDashboardLogs, getDashboardEngage } from './dashboardUI.js';
import pool from './db.js';
import { getLogChannelId, setLogChannelId } from './logManager.js';

// Cache temporaire pour stocker les mots-clés pendant la sélection des réactions
const reactCache = new Map();

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

    // --- ACTIONS LOGS ---
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
                { name: 'moderation', key: 'moderation' },
                { name: 'vocal', key: 'vocal' },
                { name: 'messages', key: 'messages' },
                { name: 'arrivees-departs', key: 'arrivees-departs' },
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
            await interaction.editReply('✅ Tous les salons de logs modération ont été créés et linkés !');
        } catch (error) {
            await interaction.editReply('❌ Erreur lors du déploiement (Permissions ?).');
        }
        return;
    }

    // --- ACTIONS ENGAGEMENT ---
    if (id === 'btn_eng_voice') {
        await interaction.deferReply({ ephemeral: true });
        try {
            const masterChannel = await interaction.guild.channels.create({ name: '➕ Créer un salon', type: ChannelType.GuildVoice });
            const conn = await pool.getConnection();
            await conn.query('INSERT INTO voice_masters (guild_id, channel_id) VALUES (?, ?)', [interaction.guildId, masterChannel.id]);
            conn.release();
            await interaction.editReply('✅ Salon Vocal Master "Join To Create" créé à la racine !');
        } catch(e) { await interaction.editReply('❌ Erreur vocale.'); }
        return;
    }

    if (id === 'btn_eng_ticket') {
        const embed = new EmbedBuilder().setTitle('🎫 Centre de Support').setDescription('Cliquez ci-dessous pour ouvrir un ticket').setColor('#2980B9');
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_create_support').setLabel('Support').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_create_question').setLabel('Question').setStyle(ButtonStyle.Secondary)
        );
        await interaction.channel.send({ embeds: [embed], components: [actionRow] });
        return interaction.reply({ content: '✅ Panneau de billets déployé ICI.', ephemeral: true });
    }

    if (id === 'btn_eng_autorole') {
        const modal = new ModalBuilder().setCustomId('modal_eng_autorolecreate').setTitle('Panneau Auto-Rôle');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titre').setLabel('Titre de l\'embed').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (id === 'btn_eng_autoroleadd') {
        const modal = new ModalBuilder().setCustomId('modal_eng_autoroleadd').setTitle('Ajouter option à un panneau');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg').setLabel('ID du Message du panneau').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Texte affiché pour l\'option').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji (Optionnel)').setStyle(TextInputStyle.Short).setRequired(false))
        );
        return interaction.showModal(modal);
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
        const title = interaction.fields.getTextInputValue('titre');
        const desc = interaction.fields.getTextInputValue('desc');

        const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor('#3498DB');
        const selectMenu = new StringSelectMenuBuilder().setCustomId('autorole_menu').setPlaceholder('Sélectionnez vos rôles ci-dessous...').setMinValues(0).setMaxValues(1)
            .addOptions([{ label: 'Aucun rôle configuré', description: 'Admin doit le faire.', value: 'dummy' }]);
        const row = new ActionRowBuilder().addComponents(selectMenu);
        const rep = await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: `✅ Panneau créé avec succès ! [Aller y](#) (ID: ${rep.id})`, ephemeral: true });
    }

    if (id === 'modal_eng_autoroleadd') {
        const msgId = interaction.fields.getTextInputValue('msg');
        const label = interaction.fields.getTextInputValue('label');
        const emojiStr = interaction.fields.getTextInputValue('emoji');
        
        try {
            const message = await interaction.channel.messages.fetch(msgId);
            if (!message) return interaction.reply({ content: "Message introuvable.", ephemeral: true });
            
            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId(`role_${msgId}_${encodeURIComponent(label)}_${encodeURIComponent(emojiStr || '')}`)
                .setPlaceholder('Sélectionnez le rôle discord à associer à cette option.');
            return interaction.reply({ content: `✅ Vous modifiez l'option "${label}". Quel rôle voulez-vous lui attribuer ?`, components: [new ActionRowBuilder().addComponents(roleSelect)], ephemeral: true });
        } catch(e) {
            return interaction.reply({ content: "Erreur ID message introuvable ici.", ephemeral: true });
        }
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

export async function handleDashboardSelectMenu(interaction) {
    const id = interaction.customId;

    if (id === 'sel_logs_captcharole') {
        const roleId = interaction.values[0];
        try {
            const conn = await pool.getConnection();
            // Puisque la table 'server_config' a le champ captcha_role_id, on l'update.
            // S'il n'y a pas de ligne pour cette guild, on l'insert.
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
        const modal = new ModalBuilder().setCustomId(`modal_logs_set_${type}`).setTitle(`Configurer Logs: ${type}`);
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('chid').setLabel('Collez l\'ID du salon texte').setStyle(TextInputStyle.Short).setRequired(true)));
        return interaction.showModal(modal);
    }

    if (id.startsWith('role_')) {
        // ID Format: role_MESSAGEID_label_emoji
        const parts = id.split('_');
        const msgId = parts[1];
        const label = decodeURIComponent(parts[2]);
        const emojiStr = decodeURIComponent(parts[3] || '');
        const roleId = interaction.values[0];

        try {
            const message = await interaction.channel.messages.fetch(msgId);
            const oldActionRow = message.components[0];
            const selectMenuComponent = oldActionRow.components[0];
            const options = Array.from(selectMenuComponent.options).filter(opt => opt.value !== 'dummy');

            const newOption = { label: label, value: roleId };
            if (emojiStr) newOption.emoji = emojiStr;
            options.push(newOption);

            const newSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('autorole_menu')
                .setPlaceholder('Sélectionnez vos rôles ci-dessous...')
                .setMinValues(0)
                .setMaxValues(options.length)
                .addOptions(options);

            await message.edit({ components: [new ActionRowBuilder().addComponents(newSelectMenu)] });
            await interaction.message.delete().catch(()=>{});
            return interaction.reply({ content: `✅ Option ajoutée avec succès au panneau originel !`, ephemeral: true });
        } catch(e) {
            return interaction.reply({ content: `❌ Erreur : message originel introuvable ou vous répondez trop tard.`, ephemeral: true });
        }
    }
}
