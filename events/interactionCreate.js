import { createErrorEmbed } from '../utils/embeds.js';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';
import { handleDashboardButton, handleDashboardModal, handleDashboardSelectMenu } from '../utils/dashboardHandler.js';
import { captchaCache } from '../utils/captchaManager.js';

export const event = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        // Handle Chat Input Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorEmbed = createErrorEmbed('Une erreur est survenue lors de l\'exécution de cette commande !');
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }
        else if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Erreur', ephemeral: true });
            }
        }
        else if (interaction.isButton()) {
            if (interaction.customId.startsWith('delete_msg_')) {
                const parts = interaction.customId.split('_');
                const channelId = parts[2];
                const msgId = parts[3];
                try {
                    const ch = await interaction.guild.channels.fetch(channelId);
                    if (!ch) throw new Error("M");
                    const msg = await ch.messages.fetch(msgId);
                    if (!msg) throw new Error("M");
                    await msg.delete();
                    await interaction.reply({ content: "✅ Le message a été supprimé.", ephemeral: true });
                } catch(e) {
                    await interaction.reply({ content: "❌ Impossible de supprimer ce message (déjà supprimé ou manque permissions).", ephemeral: true });
                }
            }
            // Captcha Solve Button
            else if (interaction.customId === 'btn_captcha_solve') {
                const captchaData = captchaCache.get(interaction.user.id);
                if (!captchaData) return interaction.reply({ content: "❌ Aucun captcha actif ou captcha expiré.", ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId('modal_captcha_submit')
                    .setTitle('Vérification Captcha');
                const input = new TextInputBuilder()
                    .setCustomId('captcha_code')
                    .setLabel('Entrez le code de l\'image')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(6)
                    .setMaxLength(6)
                    .setRequired(true);
                
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
            // Dashboard Buttons
            else if (interaction.customId.startsWith('nav_config_') || interaction.customId.startsWith('btn_')) {
                return await handleDashboardButton(interaction);
            }
            // Création de tickets (Panneau principal)
            else if (interaction.customId.startsWith('ticket_create_')) {
                const type = interaction.customId.replace('ticket_create_', '');
                let modalTitle = 'Ticket';
                let inputName = new TextInputBuilder().setCustomId('ticket_input_name').setLabel('Sujet principal').setStyle(TextInputStyle.Short).setRequired(true);
                let inputBody = new TextInputBuilder().setCustomId('ticket_input_body').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true);

                if (type === 'support') {
                    modalTitle = 'Demande de Support';
                    inputBody.setLabel('Quel est votre problème exact ?');
                } else if (type === 'question') {
                    modalTitle = 'Poser une Question';
                    inputBody.setLabel('Posez votre question complète ici');
                } else if (type === 'report') {
                    modalTitle = 'Signaler un joueur / abus';
                    inputName.setLabel('Qui/Quoi voulez-vous signaler ?');
                    inputBody.setLabel('Preuves et explications obligatoires');
                } else if (type === 'recrutement') {
                    modalTitle = 'Candidature / Recrutement';
                    inputName.setLabel('Quel poste visez-vous ?');
                    inputBody.setLabel('Décrivez vos compétences et motivations');
                }

                const modal = new ModalBuilder()
                    .setCustomId(`modal_ticket_submit_${type}`)
                    .setTitle(modalTitle);

                const row1 = new ActionRowBuilder().addComponents(inputName);
                const row2 = new ActionRowBuilder().addComponents(inputBody);
                modal.addComponents(row1, row2);

                await interaction.showModal(modal);
            }
            // Fermeture de ticket (bouton interne)
            else if (interaction.customId === 'ticket_close') {
                const thread = interaction.channel;
                if (!thread || !thread.isThread()) return interaction.reply({ content: "❌ Commande utilisable uniquement dans un thread ticket.", ephemeral: true });
                
                await interaction.message.edit({ components: [] }); // Retire le bouton pour stop le spam
                await interaction.reply({ content: '🔒 Fermeture et archivage du ticket en cours...' });

                // Générer Transcript
                let allMessages = [];
                let lastId = undefined;
                while (true) {
                    const messages = await thread.messages.fetch({ limit: 100, before: lastId });
                    if (messages.size === 0) break;
                    messages.forEach(m => allMessages.push(m));
                    lastId = messages.last().id;
                }
                
                allMessages.reverse(); // Chronological
                let transcript = `TRANSCRIPT DU TICKET : ${thread.name}\nServeur: ${interaction.guild.name}\n\n`;
                allMessages.forEach(m => {
                    transcript += `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}\n`;
                });

                const logChannelId = getLogChannelId(interaction.guildId, 'messages');
                if (logChannelId) {
                    try {
                        const logChannel = await interaction.guild.channels.fetch(logChannelId);
                        const buffer = Buffer.from(transcript, 'utf-8');
                        const { AttachmentBuilder } = await import('discord.js');
                        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${thread.name}.txt` });
                        await logChannel.send({ content: `📁 Archivage du ticket fermé : **${thread.name}** fermé par <@${interaction.user.id}>`, files: [attachment] });
                    } catch(e) {}
                }

                await thread.send('✅ Ce ticket est maintenant fermé et archivé. Le salon va être vérouillé.');
                await thread.setArchived(true, `Fermé par ${interaction.user.tag}`);
            }
        }
        else if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu()) {
            if (interaction.customId === 'autorole_menu') {
                await interaction.deferReply({ ephemeral: true });

                const selectedRoleIds = interaction.values;
                const member = interaction.member;
                
                // Extraire l'ensemble des IDs des rôles proposés dans ce menu spécifique
                const allRoleIdsInMenu = interaction.message.components[0].components[0].options.map(opt => opt.value);

                // D'abord, on retire tous les rôles du menu que le membre a, au cas où il les aurait décochés
                const rolesToRemove = member.roles.cache.filter(r => allRoleIdsInMenu.includes(r.id) && !selectedRoleIds.includes(r.id));
                const rolesToAdd = selectedRoleIds.filter(id => !member.roles.cache.has(id));

                try {
                    // Supprimer ceux décochés
                    for (const [, role] of rolesToRemove) {
                        await member.roles.remove(role);
                    }
                    // Ajouter ceux cochés
                    for (const roleId of rolesToAdd) {
                        await member.roles.add(roleId);
                    }
                    await interaction.editReply({ content: '✅ Vos rôles ont été mis à jour avec succès !' });
                } catch (e) {
                    console.error("Erreur de modification de rôles :", e);
                    await interaction.editReply({ content: '❌ Erreur : Je n\'ai probablement pas la permission de modifier l\'un de ces rôles en particulier (peut-être est-il au-dessus du mien ?).' });
                }
            } else {
                return await handleDashboardSelectMenu(interaction);
            }
        }
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_captcha_submit') {
                const captchaData = captchaCache.get(interaction.user.id);
                if (!captchaData) return interaction.reply({ content: "❌ Ce captcha n'est plus valide.", ephemeral: true });

                const inputCode = interaction.fields.getTextInputValue('captcha_code').toUpperCase();

                if (inputCode === captchaData.code) {
                    // Réussi
                    try {
                        const guild = await interaction.client.guilds.fetch(captchaData.guildId);
                        const member = await guild.members.fetch(interaction.user.id);
                        await member.roles.add(captchaData.roleId);
                        captchaCache.delete(interaction.user.id);
                        
                        // Modifier le message d'origine
                        await interaction.message.edit({ components: [] });
                        await interaction.reply({ content: `✅ Code correct ! L'accès au serveur **${guild.name}** vous a été accordé.` });
                    } catch (e) {
                        console.error(e);
                        await interaction.reply({ content: "❌ Erreur l'attribution du rôle (Vérifiez mes permissions sur le serveur).", ephemeral: true });
                    }
                } else {
                    // Échoué
                    captchaData.attempts++;
                    if (captchaData.attempts >= 3) {
                        try {
                            const guild = await interaction.client.guilds.fetch(captchaData.guildId);
                            const member = await guild.members.fetch(interaction.user.id);
                            await member.kick('Échec au Captcha (3/3)');
                            captchaCache.delete(interaction.user.id);
                            
                            await interaction.message.edit({ components: [] });
                            await interaction.reply({ content: `❌ Code incorrect. Vous avez été expulsé du serveur. Reconnectez-vous via un lien d'invitation pour réessayer.` });
                        } catch(e) {
                            await interaction.reply({ content: "❌ Erreur lors de l'expulsion (Permissions manquantes).", ephemeral: true });
                        }
                    } else {
                        await interaction.reply({ content: `❌ Code incorrect. Il vous reste ${3 - captchaData.attempts} essai(s).`, ephemeral: true });
                    }
                }
                return;
            }

            if (interaction.customId.startsWith('modal_mod_') || interaction.customId.startsWith('modal_react_') || interaction.customId.startsWith('modal_logs_') || interaction.customId.startsWith('modal_eng_')) {
                return await handleDashboardModal(interaction);
            }
            if (interaction.customId.startsWith('modal_ticket_submit_')) {
                const type = interaction.customId.replace('modal_ticket_submit_', '');
                const subject = interaction.fields.getTextInputValue('ticket_input_name');
                const body = interaction.fields.getTextInputValue('ticket_input_body');

                try {
                    const threadName = `${type}-${interaction.user.username}`;
                    const thread = await interaction.channel.threads.create({
                        name: threadName,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                        type: ChannelType.PrivateThread, // Only works with specific server boosts or defaults to public thread if not tier 2
                        invitable: false,
                        reason: `Nouveau Ticket ${type}`
                    });

                    // Si le serveur ne supporte pas les threads privés sans boost, on gère la possible fallback silent
                    // Mais discord.js le fait nativement bien en général.
                    
                    // On ajoute le membre dedans
                    await thread.members.add(interaction.user.id);

                    const embed = new EmbedBuilder()
                        .setTitle(`🎫 Ticket : ${subject.substring(0, 200)}`)
                        .setColor('#F1C40F')
                        .setDescription(`**Type:** ${type}\n**Par:** <@${interaction.user.id}>\n\n**Description détaillée :**\n> ${body}`)
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Fermer le Ticket').setStyle(ButtonStyle.Danger)
                    );

                    await thread.send({ content: `<@${interaction.user.id}> L'équipe interviendra bientôt.`, embeds: [embed], components: [actionRow] });
                    return interaction.reply({ content: `✅ Votre ticket a été ouvert avec succès ici : <#${thread.id}>`, ephemeral: true });

                } catch (error) {
                    console.error("Erreur création ticket :", error);
                    return interaction.reply({ content: "❌ Impossible de créer le ticket (vérifiez que ce salon supporte les threads ou les permissions du bot).", ephemeral: true });
                }
            }
            if (interaction.customId.startsWith('modal_create_category_')) {
                const command = interaction.client.commands.get('createcategorycomplete');
                if (command && command.handleModal) {
                    try {
                        await command.handleModal(interaction);
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({ embeds: [createErrorEmbed('Erreur lors du traitement du formulaire.')], ephemeral: true });
                    }
                }
            } else if (interaction.customId.startsWith('wizard_init_')) {
                const command = interaction.client.commands.get('createtemplatefromcategory');
                if (command && command.handleModal) {
                    try {
                        await command.handleModal(interaction);
                    } catch (error) {
                        console.error(error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ embeds: [createErrorEmbed('Erreur lors du traitement du wizard.')], ephemeral: true });
                        }
                    }
                }
            }
        }
    },
};
