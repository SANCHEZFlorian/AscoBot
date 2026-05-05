import { EmbedBuilder, AuditLogEvent, ChannelType, PermissionsBitField } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';
import pool from '../utils/db.js';

// Stockage en RAM des ID des salons vocaux créés dynamiquement
const tempVoiceChannels = new Set();

export const event = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(oldState, newState) {
        // --- 1. Gestion des Salons Vocaux Dynamiques (Join To Create) ---
        const member = newState.member;
        
        // S'il rejoint un salon (ou se déplace vers un salon)
        if (newState.channelId && newState.channelId !== oldState.channelId) {
            try {
                const connection = await pool.getConnection();
                const [rows] = await connection.query('SELECT channel_id FROM voice_masters WHERE guild_id = ? AND channel_id = ?', [newState.guild.id, newState.channelId]);
                connection.release();

                if (rows.length > 0) {
                    // Le membre a rejoint un Salon Maître !
                    const masterChannel = newState.channel;
                    // Créer le salon temporaire
                    const tempChannel = await newState.guild.channels.create({
                        name: `Salon de ${member.user.username}`,
                        type: ChannelType.GuildVoice,
                        parent: masterChannel.parentId,
                        permissionOverwrites: [
                            {
                                id: member.user.id,
                                allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles] // Créateur gère le salon
                            }
                        ]
                    });
                    
                    tempVoiceChannels.add(tempChannel.id);
                    
                    // On déplace le membre dedans
                    try {
                        await member.voice.setChannel(tempChannel);
                    } catch(e) {
                         // Si la personne a quitté ultra vite avant la création, on supprime le salon
                         await tempChannel.delete().catch(()=>{});
                         tempVoiceChannels.delete(tempChannel.id);
                    }
                }
            } catch (e) {
                console.error("Erreur JoinToCreate :", e);
            }
        }

        // S'il quitte un salon (ou se déplace d'un salon)
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            if (tempVoiceChannels.has(oldState.channelId)) {
                const oldChannel = oldState.channel;
                if (oldChannel && oldChannel.members.size === 0) {
                    try {
                        await oldChannel.delete();
                        tempVoiceChannels.delete(oldState.channelId);
                    } catch (e) { console.error("Erreur suppression salon dynamique :", e); }
                }
            }
        }
        // --- Fin Gestion Vocaux ---

        if (!member) return;
        const logChannelId = getLogChannelId(newState.guild.id, 'vocal');
        if (!logChannelId) return;

        try {
            const channel = await newState.client.channels.fetch(logChannelId);
            if (!channel) return;

            const member = newState.member;
            if (!member) return;

            const timeNow = `<t:${Math.floor(Date.now() / 1000)}:T>`;

            // Connexion à un salon vocal
            if (!oldState.channelId && newState.channelId) {
                const embed = new EmbedBuilder()
                    .setTitle('🔊 Connexion Vocale')
                    .setColor('#2ECC71')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${member.user.id}> a rejoint <#${newState.channelId}> à ${timeNow}.`)
                    .setTimestamp();
                return await channel.send({ embeds: [embed] });
            }

            // Déconnexion d'un salon vocal
            if (oldState.channelId && !newState.channelId) {
                let executor = null;
                try {
                    const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberDisconnect });
                    const discLog = fetchedLogs.entries.first();
                    if (discLog && discLog.target.id === member.user.id && (Date.now() - discLog.createdTimestamp < 5000)) {
                        executor = discLog.executor;
                    }
                } catch (e) {}

                const embed = new EmbedBuilder()
                    .setTitle('🔇 Déconnexion Vocale')
                    .setColor('#E74C3C')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${member.user.id}> a quitté <#${oldState.channelId}>${executor ? ` (Déconnecté par <@${executor.id}>)` : ''} à ${timeNow}.`)
                    .setTimestamp();
                return await channel.send({ embeds: [embed] });
            }

            // Déplacement
            if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                let executor = null;
                try {
                    const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberMove });
                    const moveLog = fetchedLogs.entries.first();
                    if (moveLog && moveLog.target.id === member.user.id && (Date.now() - moveLog.createdTimestamp < 5000)) {
                        executor = moveLog.executor;
                    }
                } catch (e) {}

                const embed = new EmbedBuilder()
                    .setTitle('🔄 Déplacement Vocal')
                    .setColor('#3498DB')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${member.user.id}> s'est déplacé de <#${oldState.channelId}> vers <#${newState.channelId}>${executor ? ` (Déplacé par <@${executor.id}>)` : ''} à ${timeNow}.`)
                    .setTimestamp();
                return await channel.send({ embeds: [embed] });
            }

            // Mute Serveur
            if (!oldState.serverMute && newState.serverMute) {
                let executor = null;
                try {
                    const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
                    const muteLog = fetchedLogs.entries.first();
                    if (muteLog && muteLog.target.id === member.user.id && (Date.now() - muteLog.createdTimestamp < 5000)) {
                        executor = muteLog.executor;
                    }
                } catch (e) {}
                const embed = new EmbedBuilder()
                    .setTitle('🎙️ Mute Serveur')
                    .setColor('#E67E22')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${member.user.id}> a été rendu muet par le serveur${executor ? ` (par <@${executor.id}>)` : ''} à ${timeNow}.`)
                    .setTimestamp();
                return await channel.send({ embeds: [embed] });
            }

            // Sourdine Serveur
            if (!oldState.serverDeaf && newState.serverDeaf) {
                let executor = null; // même logique d'audit possible
                const embed = new EmbedBuilder()
                    .setTitle('🎧 Sourdine Serveur')
                    .setColor('#E67E22')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`<@${member.user.id}> a été mis en sourdine serveur à ${timeNow}.`)
                    .setTimestamp();
                return await channel.send({ embeds: [embed] });
            }

        } catch (error) {}
    },
};
